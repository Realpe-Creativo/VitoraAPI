const express = require('express');
const { listar, obtener, crear, actualizar, eliminar } = require('../controllers/productoController');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

router.get('/', listar);
router.get('/:id', obtener);
router.post('/', authenticateToken, crear);
router.put('/:id', authenticateToken, actualizar);
router.delete('/:id', authenticateToken, eliminar);

module.exports = router;
