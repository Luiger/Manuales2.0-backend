const { Router } = require('express');
const { 
  submitManualContratacionesForm,
  checkSubmissionStatus 
} = require('../controllers/manuales.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = Router();

// Ruta GET para verificar el estado, protegida por autenticación.
router.get('/status', authenticateToken, checkSubmissionStatus);

// Ruta POST para enviar el formulario, protegida por autenticación.
router.post('/submit', authenticateToken, submitManualContratacionesForm);

module.exports = router;
