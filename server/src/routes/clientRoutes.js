import express from 'express';
import { Op } from 'sequelize';

const router = express.Router();

// Helper to format array fields
const formatArrayFields = (data) => ({
  ...data,
  servicesSelected: data.servicesSelected ? data.servicesSelected.split(',').filter(Boolean) : [],
  proposals: data.proposals ? data.proposals.split(',').filter(Boolean) : [],
  credentials: data.credentials ? JSON.parse(data.credentials) : {},
  campaigns: data.campaigns ? data.campaigns.split(',').filter(Boolean) : [],
  socialMediaAccounts: data.socialMediaAccounts ? data.socialMediaAccounts.split(',').filter(Boolean) : [],
  reports: data.reports ? data.reports.split(',').filter(Boolean) : [],
  invoices: data.invoices ? data.invoices.split(',').filter(Boolean) : [],
  contentCalendar: data.contentCalendar ? data.contentCalendar.split(',').filter(Boolean) : [],
});

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
  credentials: toJsonString(body.credentials),
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

    if (!clientData.name) {
      return res.status(400).json({ success: false, message: 'Client name is required' });
    }

    const client = await Client.create(clientData);
    res.status(201).json({ success: true, message: 'Client created successfully', data: formatArrayFields(client.toJSON()) });
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

    const formattedRows = rows.map((c) => formatArrayFields(c.toJSON()));

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

    const headers = [
      'ID', 'Name', 'Industry', 'Phone Number', 'WhatsApp Number', 'Address', 'Email',
      'Services Selected', 'Managed By', 'Client Health', 'Proposals', 'Credentials',
      'Campaigns', 'Social Media Accounts', 'Reports', 'Invoices', 'Notes',
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
        d.invoices || '',
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
    res.json({ success: true, data: formatArrayFields(client.toJSON()) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching client', error: error.message });
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
    await client.update(updateData);

    res.json({ success: true, message: 'Client updated successfully', data: formatArrayFields(client.toJSON()) });
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