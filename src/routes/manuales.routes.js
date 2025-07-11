// --- Explicación del Archivo ---
// Este archivo define las rutas para la gestión de formularios, específicamente
// para el formulario de "Manual de Contrataciones". Sigue la misma estructura
// que auth.routes.js.

const { Router } = require('express');
const { submitManualContratacionesForm } = require('../controllers/manuales.controller');

// Opcional: Si el envío de este formulario requiere que el usuario esté autenticado,
// puedes importar el middleware de autenticación.
// const { authenticateToken } = require('../middleware/auth.middleware');

// --- Inicialización del Router ---
const router = Router();

// --- Definición de la Ruta de Envío de Formulario ---
// Define un endpoint que responde a peticiones POST en la URL '/api/manuales/submit'.
// Esta URL coincide con la que configuramos en el `form.service.ts` del frontend.
//
// Si este formulario solo puede ser enviado por usuarios que han iniciado sesión,
// simplemente descomenta y añade el middleware 'authenticateToken' a la ruta:
// router.post('/submit', authenticateToken, submitManualContratacionesForm);
router.post('/submit', submitManualContratacionesForm);


// --- Exportación ---
// Exportamos el router para poder usarlo en el archivo principal del servidor (ej. src/index.js).
module.exports = router;
