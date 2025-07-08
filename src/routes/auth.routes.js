// --- Explicación del Archivo ---
// Este archivo define las rutas relacionadas con la autenticación.
// En este caso, solo tendremos una ruta para el login.

const { Router } = require('express');
const { loginController } = require('../controllers/auth.controller');

// --- Inicialización del Router ---
// `router`: Es una instancia del enrutador de Express.
// Nos permite agrupar rutas y exportarlas para usarlas en el archivo principal.
const router = Router();

// --- Definición de la Ruta de Login ---
// `router.post('/login', ...)`: Define un endpoint que responde a peticiones POST en la URL '/api/auth/login'.
// Se usa POST porque el cliente envía datos sensibles (credenciales) en el cuerpo de la petición.
// `loginController`: Es la función del controlador que se ejecutará cuando se reciba una petición en esta ruta.
router.post('/login', loginController);

// --- Exportación ---
// Exportamos el router para poder usarlo en `src/index.js`.
module.exports = router;
