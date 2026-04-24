const express = require('express');
const router = express.Router();
const jogadoresController = require('../controllers/jogadores');

// Define routes for player-related endpoints
router.get('/', jogadoresController.getAllPlayers);
router.get('/search', jogadoresController.searchPlayers);
router.get('/:id', jogadoresController.getPlayerById);
router.post('/', jogadoresController.createPlayer);
router.post('/importar', jogadoresController.importPlayers);
router.put('/:id', jogadoresController.updatePlayer);
router.delete('/:id', jogadoresController.deletePlayer);

module.exports = router;