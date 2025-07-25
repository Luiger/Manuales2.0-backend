const { Router } = require('express');
const { handleMessage } = require('../controllers/ai.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = Router();

// Protegemos la ruta: solo usuarios con un token válido pueden acceder al chatbot.
router.post('/detectIntent', authenticateToken, handleMessage);

module.exports = router;