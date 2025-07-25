// --- Explicación del Archivo ---
// Middleware para la autenticación. La funcionalidad principal es la misma,
// pero se han mejorado los mensajes de error para que sean más descriptivos.

const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    // MEJORA: Enviar un mensaje JSON en lugar de solo el estado.
    // Esto ayuda al frontend a saber exactamente qué salió mal.
    return res.status(401).json({ message: 'Acceso no autorizado. Token no proporcionado.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // MEJORA: Mensaje específico si el token es inválido o ha expirado.
      return res.status(403).json({ message: 'Acceso prohibido. El token es inválido o ha expirado.' });
    }
    
    // La lógica principal no cambia: el usuario se adjunta a la petición.
    req.user = user;
    next();
  });
};

// Verificar si el usuario es Admin
const isAdmin = (req, res, next) => {
  // Se asume que este middleware se usa DESPUÉS de authenticateToken
  if (req.user && req.user.rol === 'Admin') {
    next(); // El usuario es Admin, puede continuar
  } else {
    res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
  }
};

module.exports = {
  authenticateToken,
  isAdmin,
};
