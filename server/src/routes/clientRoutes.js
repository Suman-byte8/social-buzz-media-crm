import express from 'express';

const router = express.Router();

// POST /api/clients - Create a new client
router.post('/clients', async (req, res) => {
  try {
    const { Client } = req.app.locals.models;
    const { name, category, responsibleUserId, renewalDate, invoiceNumber } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Client name is required' });
    }

    const client = await Client.create({
      name,
      category,
      responsibleUserId,
      renewalDate: renewalDate ? new Date(renewalDate) : null,
      invoiceNumber
    });

    res.status(201).json({ 
      success: true, 
      message: 'Client created successfully', 
      data: client 
    });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating client', 
      error: error.message 
    });
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
    
    const { name, category, responsibleUserId, renewalDate, invoiceNumber } = req.body;
    await client.update({
      name: name || client.name,
      category: category !== undefined ? category : client.category,
      responsibleUserId: responsibleUserId !== undefined ? responsibleUserId : client.responsibleUserId,
      renewalDate: renewalDate ? new Date(renewalDate) : client.renewalDate,
      invoiceNumber: invoiceNumber !== undefined ? invoiceNumber : client.invoiceNumber
    });
    
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