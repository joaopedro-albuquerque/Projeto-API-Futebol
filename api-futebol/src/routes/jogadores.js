const express = require('express');
const router = express.Router();
const jogadoresController = require('../controllers/jogadores');
const tabularUpload = require('../middleware/tabularUpload');

// Define routes for player-related endpoints
router.get('/', jogadoresController.getAllPlayers);
router.get('/search', jogadoresController.searchPlayers);
router.post('/importar/csv', tabularUpload, jogadoresController.importPlayersCsv);
router.get('/:id', jogadoresController.getPlayerById);
router.post('/', jogadoresController.createPlayer);
router.put('/:id', jogadoresController.updatePlayer);
router.delete('/:id', jogadoresController.deletePlayer);

module.exports = router;