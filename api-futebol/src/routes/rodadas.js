const express = require('express');
const router = express.Router();
const rodadasController = require('../controllers/rodadas');

// Define routes for match rounds
router.get('/', rodadasController.getAllRodadas);
router.get('/:id', rodadasController.getRodadaById);
router.post('/', rodadasController.createRodada);
router.put('/:id', rodadasController.updateRodada);
router.delete('/:id', rodadasController.deleteRodada);

module.exports = router;