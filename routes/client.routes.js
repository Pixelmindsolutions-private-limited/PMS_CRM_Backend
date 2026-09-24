// routes/clientRoutes.js
const express = require('express');
const router = express.Router();
const {
    createClient,
    getAllClients,
    getClientById,
    getClientWithProjects,
    updateClient,
    deleteClient,
    updateLeadStatus
} = require('../controllers/client.controller');

router.post('/', createClient);
router.get('/all', getAllClients);
router.get('/:id/projects', getClientWithProjects);
router.get('/:id', getClientById);
router.put('/:id', updateClient);
router.delete('/:id/delete', deleteClient);

// ✅ Status update route (dono paths)
router.patch('/:id/lead-status', updateLeadStatus);
router.patch('/:id/status', updateLeadStatus);

module.exports = router;