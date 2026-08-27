import express from 'express';
import multer from 'multer';
import { Op } from 'sequelize';
import { encryptText, decryptText } from '../utils/encryption.js';
import { uploadFileToDrive, getOrCreateClientFolder } from '../utils/googleDrive.js';

const router = express.Router();

const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Credentials are stored as an array of { id, platform, username, password, notes }.
// Passwords are encrypted at rest; decrypt here so the client only ever sees plaintext.
const decryptCredentials = (value) => {
  if (!value) return [];
  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  if (!Array.isArray(parsed)) return [];
  return parsed.map((entry) => ({ ...entry, password: decryptText(entry.password) }));
};

const encryptCredentials = (value) => {
  if (!Array.isArray(value)) return null;
  return value.map((entry) => ({ ...entry, password: entry.password ? encryptText(entry.password) : entry.password }));
};

// Helper to format array fields
const formatArrayFields = (data) => ({
  ...data,
  servicesSelected: data.servicesSelected ? data.servicesSelected.split(',').filter(Boolean) : [],
  proposals: data.proposals ? data.proposals.split(',').filter(Boolean) : [],
  credentials: decryptCredentials(data.credentials),
  campaigns: data.campaigns ? data.campaigns.split(',').filter(Boolean) : [],
  socialMediaAccounts: data.socialMediaAccounts ? data.socialMediaAccounts.split(',').filter(Boolean) : [],
  reports: data.reports ? data.reports.split(',').filter(Boolean) : [],
  invoices: data.invoices ? data.invoices.split(',').filter(Boolean) : [],
  contentCalendar: data.contentCalendar ? data.contentCalendar.split(',').filter(Boolean) : [],
});

// Invoices are an admin-only view (Invoices page + client profile tab are
// hidden from team members) — strip the field for non-admins on read, and
// ignore attempts to write it on create/update.
const redactForRole = (data, role) => {
  if (role === 'admin') return data;
  const { invoices, ...rest } = data;
  return rest;
};

// Accepts array or comma-separated string, returns CSV string or null
const toArrayString = (value) => {
  if (!value) return null;
  return Array.isArray(value) ? value.filter(Boolean).join(',') : String(value);
};

// Accepts object or JSON string, returns JSON string or null
const toJsonString = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      JSON.parse(value);
      return value;
    } catch {
      return null;
    }
  }
  return JSON.stringify(value);
};

// Helper to prepare data for DB
const prepareClientData = (body) => ({
  name: body.name,
  industry: body.industry,
  phoneNumber: body.phoneNumber,
  whatsappNumber: body.whatsappNumber,
  address: body.address,
  email: body.email,
  servicesSelected: toArrayString(body.servicesSelected),
  clientManagedBy: body.clientManagedBy,
  clientHealth: body.clientHealth,
  proposals: toArrayString(body.proposals),
  credentials: Array.isArray(body.credentials)
    ? JSON.stringify(encryptCredentials(body.credentials))
    : toJsonString(body.credentials),
  campaigns: toArrayString(body.campaigns),
  socialMediaAccounts: toArrayString(body.socialMediaAccounts),
  reports: toArrayString(body.reports),
  invoices: toArrayString(body.invoices),
  notes: body.notes,
  renewal: body.renewal ? new Date(body.renewal) : null,
  contentCalendar: toArrayString(body.contentCalendar),
});

// POST /api/clients - Create a new client
router.post('/clients', async (req, res) => {
  try {
    const { Client } = req.app.locals.models;
    const clientData = prepareClientData(req.body);
    if (req.user?.role !== 'admin') delete clientData.invoices;

    if (!clientData.name) {
      return res.status(400).json({ success: false, message: 'Client name is required' });
    }

    const client = await Client.create(clientData);
    res.status(201).json({ success: true, message: 'Client created successfully', data: redactForRole(formatArrayFields(client.toJSON()), req.user?.role) });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ success: false, message: 'Error creating client', error: error.message });
  }
});

// GET /api/clients - Get all clients with pagination, search, sort
router.get('/clients', async (req, res) => {
  try {
    const { Client } = req.app.locals.models;
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      industry,
      healthMin,
      healthMax,
      managedBy,
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { industry: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (industry) where.industry = industry;
    if (managedBy) where.clientManagedBy = parseInt(managedBy);
    if (healthMin || healthMax) {
      where.clientHealth = {};
      if (healthMin) where.clientHealth[Op.gte] = parseInt(healthMin);
      if (healthMax) where.clientHealth[Op.lte] = parseInt(healthMax);
    }

    const { count, rows } = await Client.findAndCountAll({
      where,
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const formattedRows = rows.map((c) => redactForRole(formatArrayFields(c.toJSON()), req.user?.role));

    res.json({
      success: true,
      data: formattedRows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching clients', error: error.message });
  }
});

// GET /api/clients/export - Export clients to CSV
router.get('/clients/export', async (req, res) => {
  try {
    const { Client } = req.app.locals.models;
    const { search = '', industry, healthMin, healthMax } = req.query;

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { industry: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (industry) where.industry = industry;
    if (healthMin || healthMax) {
      where.clientHealth = {};
      if (healthMin) where.clientHealth[Op.gte] = parseInt(healthMin);
      if (healthMax) where.clientHealth[Op.lte] = parseInt(healthMax);
    }

    const clients = await Client.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    const isAdmin = req.user?.role === 'admin';
    const headers = [
      'ID', 'Name', 'Industry', 'Phone Number', 'WhatsApp Number', 'Address', 'Email',
      'Services Selected', 'Managed By', 'Client Health', 'Proposals', 'Credentials',
      'Campaigns', 'Social Media Accounts', 'Reports', ...(isAdmin ? ['Invoices'] : []), 'Notes',
      'Renewal Date', 'Content Calendar', 'Created At', 'Updated At'
    ];

    const rows = clients.map((c) => {
      const d = c.toJSON();
      return [
        d.id,
        d.name,
        d.industry || '',
        d.phoneNumber || '',
        d.whatsappNumber || '',
        d.address || '',
        d.email || '',
        d.servicesSelected || '',
        d.clientManagedBy || '',
        d.clientHealth || '',
        d.proposals || '',
        d.credentials || '',
        d.campaigns || '',
        d.socialMediaAccounts || '',
        d.reports || '',
        ...(isAdmin ? [d.invoices || ''] : []),
        d.notes || '',
        d.renewal ? new Date(d.renewal).toISOString().split('T')[0] : '',
        d.contentCalendar || '',
        d.createdAt ? new Date(d.createdAt).toISOString() : '',
        d.updatedAt ? new Date(d.updatedAt).toISOString() : '',
      ];
    });

    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="clients-export-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error exporting clients', error: error.message });
  }
});

// GET /api/clients/:id - Get client by ID
router.get('/clients/:id', async (req, res) => {
  try {
    const { Client } = req.app.locals.models;
    const client = await Client.findByPk(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    res.json({ success: true, data: redactForRole(formatArrayFields(client.toJSON()), req.user?.role) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching client', error: error.message });
  }
});

// POST /api/clients/:id/upload-logo - Upload/replace a client's logo
router.post('/clients/:id/upload-logo', logoUpload.single('logo'), async (req, res) => {
  try {
    const { Client } = req.app.locals.models;
    const client = await Client.findByPk(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No logo file provided or file exceeds 5MB limit' });
    }

    const clientFolder = await getOrCreateClientFolder(client.name, client.id);
    const driveResult = await uploadFileToDrive(req.file.buffer, req.file.originalname, req.file.mimetype, clientFolder.folderId);

    await client.update({ logo: driveResult.proxyLink });

    res.json({ success: true, message: 'Logo uploaded successfully', data: redactForRole(formatArrayFields(client.toJSON()), req.user?.role) });
  } catch (error) {
    console.error('Error uploading client logo:', error);
    res.status(500).json({ success: false, message: error.message || 'Error uploading logo', error: error.message });
  }
});

// PUT /api/clients/:id - Update client
router.put('/clients/:id', async (req, res) => {
  try {
    const { Client } = req.app.locals.models;
    const client = await Client.findByPk(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const updateData = prepareClientData(req.body);
    if (req.user?.role !== 'admin') delete updateData.invoices;
    await client.update(updateData);

    res.json({ success: true, message: 'Client updated successfully', data: redactForRole(formatArrayFields(client.toJSON()), req.user?.role) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating client', error: error.message });
  }
});

// DELETE /api/clients/:id - Delete client
router.delete('/clients/:id', async (req, res) => {
  try {
    const { Client } = req.app.locals.models;
    const client = await Client.findByPk(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    await client.destroy();
    res.json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting client', error: error.message });
  }
});

export default router;