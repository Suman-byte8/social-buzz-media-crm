import express from 'express';

const router = express.Router();

// POST /api/clients - Create a new client
router.post('/clients', async (req, res) => {
  try {
    const { Client } = req.app.locals.models;
    const {
      name,
      industry,
      phoneNumber,
      whatsappNumber,
      address,
      email,
      servicesSelected,
      clientManagedBy,
      clientHealth,
      proposals,
      credentials,
      campaigns,
      socialMediaAccounts,
      reports,
      invoices,
      notes,
      renewal,
      contentCalendar
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Client name is required' });
    }

    const clientData = {
      name,
      industry,
      phoneNumber,
      whatsappNumber,
      address,
      email,
      servicesSelected: servicesSelected ? servicesSelected.join(',') : null,
      clientManagedBy: clientManagedBy || 0,
      clientHealth: clientHealth || 0,
      proposals: proposals ? proposals.join(',') : null,
      credentials: credentials ? JSON.stringify(credentials) : null,
      campaigns: campaigns ? campaigns.join(',') : null,
      socialMediaAccounts: socialMediaAccounts ? socialMediaAccounts.join(',') : null,
      reports: reports ? reports.join(',') : null,
      invoices: invoices ? invoices.join(',') : null,
      notes,
      renewal: renewal ? new Date(renewal) : null,
      contentCalendar: contentCalendar ? contentCalendar.join(',') : null,
    };

    const client = await Client.create(clientData);

    res.status(201).json({ success: true, message: 'Client created successfully', data: client });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ success: false, message: 'Error creating client', error: error.message });
  }
});

// GET /api/clients - Get all clients
router.get('/clients', async (req, res) => {
  try {
    const { Client } = req.app.locals.models;
    const clients = await Client.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: clients });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching clients', error: error.message });
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
    res.json({ success: true, data: client });
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

    const {
      name,
      industry,
      phoneNumber,
      whatsappNumber,
      address,
      email,
      servicesSelected,
      clientManagedBy,
      clientHealth,
      proposals,
      credentials,
      campaigns,
      socialMediaAccounts,
      reports,
      invoices,
      notes,
      renewal,
      contentCalendar
    } = req.body;

    const updateData = {
      name: name ?? client.name,
      industry: industry ?? client.industry,
      phoneNumber: phoneNumber ?? client.phoneNumber,
      whatsappNumber: whatsappNumber ?? client.whatsappNumber,
      address: address ?? client.address,
      email: email ?? client.email,
      servicesSelected: servicesSelected !== undefined ? servicesSelected.join(',') : client.servicesSelected,
      clientManagedBy: clientManagedBy ?? client.clientManagedBy,
      clientHealth: clientHealth ?? client.clientHealth,
      proposals: proposals !== undefined ? proposals.join(',') : client.proposals,
      credentials: credentials ? JSON.stringify(credentials) : client.credentials,
      campaigns: campaigns !== undefined ? campaigns.join(',') : client.campaigns,
      socialMediaAccounts: socialMediaAccounts !== undefined ? socialMediaAccounts.join(',') : client.socialMediaAccounts,
      reports: reports !== undefined ? reports.join(',') : client.reports,
      invoices: invoices !== undefined ? invoices.join(',') : client.invoices,
      notes: notes ?? client.notes,
      renewal: renewal !== undefined ? new Date(renewal) : client.renewal,
      contentCalendar: contentCalendar !== undefined ? contentCalendar.join(',') : client.contentCalendar,
    };

    await client.update(updateData);

    res.json({ success: true, message: 'Client updated successfully', data: client });
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