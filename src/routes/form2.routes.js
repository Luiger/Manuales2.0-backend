// Manuales2.0-backend/src/routes/form2.routes.js

const express = require('express');
const { submitManualContratacionesForm } = require('../controllers/form2.controller');

const router = express.Router();

// Route for submitting the "MANUAL CONTRATACIONES" form.
// This endpoint is designed to be part of a larger '/api/forms' structure,
// allowing for future expansion with other form types.
router.post('/submitManualContratacionesForm', submitManualContratacionesForm);

// Future routes for other forms can be added here, nested under a common prefix.
// Example:
// router.post('/submitAnotherForm', submitAnotherFormController);

module.exports = router;
