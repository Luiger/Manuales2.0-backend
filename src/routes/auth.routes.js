const { Router } = require('express');
const { 
  loginController, 
  forgotPasswordController,
  resetPasswordController,
  verifyOtpController,
  registerController,
  refreshTokenController,
} = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// --- Inicialización del Router ---
// `router`: Es una instancia del enrutador de Express.
// Nos permite agrupar rutas y exportarlas para usarlas en el archivo principal.
const router = Router();

// --- Definición de la Ruta de Login ---
// `router.post('/login', ...)`: Define un endpoint que responde a peticiones POST en la URL '/api/auth/login'.
// Se usa POST porque el cliente envía datos sensibles (credenciales) en el cuerpo de la petición.
// `loginController`: Es la función del controlador que se ejecutará cuando se reciba una petición en esta ruta.
router.post('/login', loginController);

// --- Definición de la Ruta de Registro (Paso 1) ---
//router.post('/register/credentials', registerCredentialsController);

// --- Definición de la Ruta de Registro (Paso 2) ---
// Esta ruta está protegida por el middleware `authenticateToken`.
// Solo se puede acceder con un token JWT válido (el temporal en este caso).
//router.post('/register/profile', authenticateToken, registerProfileController);

// --- Definición de la Ruta para Solicitar Recuperación de Contraseña ---
router.post('/forgot-password', forgotPasswordController);

// --- Definición de la Ruta para Verificar el Código OTP ---
router.post('/verify-otp', verifyOtpController);

// --- Definición de la Ruta para Resetear la Contraseña ---
// Ahora está protegida y usa el token JWT temporal generado por /verify-otp
router.post('/reset-password', authenticateToken, resetPasswordController);

// --- Definición de la Ruta de Registro Completo ---
router.post('/register', registerController);

// --- Definición de la Ruta para Refrescar el Token ---
router.post('/refresh-token', authenticateToken, refreshTokenController);

// --- Exportación ---
// Exportamos el router para poder usarlo en `src/index.js`.
module.exports = router;
