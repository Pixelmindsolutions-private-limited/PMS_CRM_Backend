// controllers/clientController.js
const Client = require('../models/Client');
const Project = require('../models/Project');

const normalizeLeadStatus = (value) => {
    const raw = value === undefined || value === null ? '' : String(value).trim();
    if (!raw) return 'Running';

    const normalized = raw.toLowerCase();
    if (['converted', 'conversion', 'converted lead', 'won', 'closed won'].includes(normalized)) {
        return 'Converted';
    }
    if (['cancelled', 'canceled', 'cancel', 'rejected', 'lost', 'closed lost'].includes(normalized)) {
        return 'Cancelled';
    }
    return 'Running';
};

// Create a new client
exports.createClient = async (req, res) => {
    try {
        const payload = { ...req.body };
        payload.leadStatus = normalizeLeadStatus(payload.leadStatus ?? payload.status);
        const client = new Client(payload);
        await client.save();
        res.status(201).json({ success: true, data: client });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Get all clients
exports.getAllClients = async (req, res) => {
    try {
        const clients = await Client.find();
        res.status(200).json({ success: true, data: clients });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Get a client by ID
exports.getClientById = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ 
                success: false, 
                message: 'Client not found' 
            });
        }
        res.status(200).json({ 
            success: true, 
            data: client 
        });
    } catch (error) {
        console.error('Get client by ID error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Get client with all projects
exports.getClientWithProjects = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ success: false, error: 'Client not found' });
        }
        const projects = await Project.find({ clientId: req.params.id });
        res.status(200).json({ 
            success: true, 
            data: {
                client,
                projects,
                totalProjects: projects.length
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Update a client
exports.updateClient = async (req, res) => {
    try {
        const client = await Client.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!client) {
            return res.status(404).json({ success: false, error: 'Client not found' });
        }
        res.status(200).json({ success: true, data: client });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Delete a client
exports.deleteClient = async (req, res) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);
        if (!client) {
            return res.status(404).json({ success: false, error: 'Client not found' });
        }
        // Delete all projects associated with this client
        await Project.deleteMany({ clientId: req.params.id });
        res.status(200).json({ success: true, message: 'Client and associated projects deleted' });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};


// ✅ Update lead (Running / Converted / Cancelled)
exports.updateLeadStatus = async (req, res) => {
  try {
    const incomingStatus = req.body.leadStatus ?? req.body.status ?? req.body.lead;
    const leadStatus = normalizeLeadStatus(incomingStatus);
    const allowed = ['Running', 'Converted', 'Cancelled'];

    if (!allowed.includes(leadStatus)) {
      return res.status(400).json({
        success: false,
        message: `leadStatus must be one of: ${allowed.join(', ')}`
      });
    }

    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { leadStatus },
      { new: true, runValidators: true }
    );

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    res.status(200).json({
      success: true,
      message: `Client marked as ${leadStatus}`,
      data: client
    });
  } catch (error) {
    console.error('updateLeadStatus error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};