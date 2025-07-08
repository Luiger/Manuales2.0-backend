// --- Explicación del Archivo ---
// Este archivo contiene los controladores para la autenticación.
// Un controlador es una función que recibe la petición, procesa la lógica de negocio
// (a menudo llamando a servicios) y envía una respuesta.

const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Módulo nativo de Node.js para criptografía
const { findUserByEmail, updateCell } = require('../services/sheets.service');

const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'El correo y la contraseña son requeridos.' });
    }

    // --- 2. Búsqueda del Usuario ---
    // Ahora `findUserByEmail` devuelve un objeto con `user` y `rowIndex`.
    const result = await findUserByEmail(email);

    if (!result) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const { user, rowIndex } = result;

    // --- 3. Verificación de Contraseña ---
    const isMatch = password === user.Contraseña;
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // --- 4. Verificación y Generación de ID ---
    // Si el campo 'ID' del usuario está vacío, generamos uno nuevo.
    if (!user.ID) {
      // `crypto.randomUUID()`: Genera un Identificador Único Universal (UUID).
      const newId = crypto.randomUUID();
      
      // Actualizamos la celda 'A' de la fila correspondiente con el nuevo ID.
      // Asumimos que la columna ID es la primera (A).
      const idCell = `A${rowIndex}`;
      await updateCell(process.env.SPREADSHEET_ID, 'Login', idCell, newId);
      
      // Actualizamos el objeto de usuario local para incluir el nuevo ID.
      user.ID = newId;
    }

    // --- 5. Generación del Token JWT ---
    const payload = {
      id: user.ID,
      email: user.Usuario,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // --- 6. Envío de la Respuesta Exitosa ---
    res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      token: token,
    });

  } catch (error) {
    console.error('Error en el controlador de login:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = {
  loginController,
};
