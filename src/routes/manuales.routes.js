const { Router } = require('express');
const { 
  submitManualContratacionesForm,
  checkSubmissionStatus,
  submitManualExpressForm, 
  checkExpressSubmissionStatus 
} = require('../controllers/manuales.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = Router();

// Rutas para Manual PRO
router.get('/status', authenticateToken, checkSubmissionStatus);
router.post('/submit', authenticateToken, submitManualContratacionesForm);

// Rutas para Manual Express
router.get('/express/status', authenticateToken, checkExpressSubmissionStatus);
router.post('/express/submit', authenticateToken, submitManualExpressForm);

module.exports = router;