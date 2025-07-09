// --- Explicación del Archivo ---
// Este archivo contiene "middlewares" de Express relacionados con la autenticación.
// Un middleware es una función que se ejecuta antes del controlador de la ruta
// y puede modificar los objetos de petición (req) y respuesta (res), o terminar el ciclo.

const jwt = require('jsonwebtoken');

// --- Middleware para Verificar JWT ---
// `authenticateToken`: Verifica que la petición contenga un token JWT válido.
const authenticateToken = (req, res, next) => {
  // `authHeader`: Buscamos el token en la cabecera 'Authorization'.
  // El formato estándar es "Bearer TOKEN".
  const authHeader = req.headers['authorization'];
  // Extraemos el token de la cabecera.
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    // Si no hay token, devolvemos un error 401 (No autorizado).
    return res.sendStatus(401);
  }

  // `jwt.verify`: Comprueba la validez y firma del token.
  // Si el token es inválido o ha expirado, lanzará un error.
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // Si hay un error en la verificación, devolvemos un error 403 (Prohibido).
      return res.sendStatus(403);
    }
    // Si el token es válido, añadimos el payload del token (`user`)
    // al objeto `req` para que los siguientes middlewares o controladores puedan usarlo.
    req.user = user;
    // `next()`: Pasa el control al siguiente middleware o al controlador de la ruta.
    next();
  });
};

module.exports = {
  authenticateToken,
};
