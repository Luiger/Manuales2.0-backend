// backend/src/routes/redirect.routes.js

const { Router } = require('express');
const { handleRedirect } = require('../controllers/redirect.controller');
const router = Router();

// Cuando un navegador visite GET /api/redirect, se ejecutará el controlador
router.get('/', handleRedirect);

module.exports = router;