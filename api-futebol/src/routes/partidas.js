const express = require('express');
const router = express.Router();
const partidasController = require('../controllers/partidas');

router.get('/', partidasController.getAllPartidas);
router.get('/search', partidasController.searchPartidas);
router.get('/:rodadaId/:numeroPartida', partidasController.getPartidaById);
router.post('/', partidasController.createPartida);
router.put('/:rodadaId/:numeroPartida', partidasController.updatePartida);
router.delete('/:rodadaId/:numeroPartida', partidasController.deletePartida);

module.exports = router;
