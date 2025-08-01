// --- Explicación del Archivo ---
// Este archivo contiene los controladores para la autenticación.
// Un controlador es una función que recibe la petición, procesa la lógica de negocio
// (a menudo llamando a servicios) y envía una respuesta.

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { findUserByEmail, updateCell, findUserByResetToken, appendSheetData } = require('../services/sheets.service');
const { sendEmail, generateOtp, getPasswordResetHTML } = require('../services/email.service');

const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'El correo y la contraseña son requeridos.' });
    }

    const result = await findUserByEmail(email);
    if (!result) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const { user, rowIndex } = result;

    // --- Verificación de Contraseña con bcrypt ---
    // `bcrypt.compareSync` compara la contraseña enviada en texto plano (`password`)
    // con el hash almacenado en la base de datos (`user.Contraseña`).
    const isMatch = bcrypt.compareSync(password, user.Contraseña);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // --- Verificación y Generación de ID (si es necesario) ---
    if (!user.ID) {
      const newId = crypto.randomUUID();
      const idCell = `A${rowIndex}`;
      await updateCell(process.env.SPREADSHEET_ID, 'Login', idCell, newId);
      user.ID = newId;
    }

    // --- Generación del Token JWT ---
    const payload = {
      id: user.ID,
      email: user.Usuario,
      rol: user.Rol || 'Usuario Gratis', // Si un usuario antiguo no tiene rol, se le asigna gratis
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      token: token,
    });

  } catch (error) {
    console.error('Error en el controlador de login:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// --- Controlador para el primer paso del registro ---
const registerCredentialsController = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'El correo y la contraseña son requeridos.' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
    }

    // Hashear la contraseña
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Añadir el nuevo usuario al Google Sheet
    // Dejamos los otros campos vacíos por ahora
    const newRow = [
      '', // ID (se genera en el primer login)
      email,
      hashedPassword,
      '', // Nombre
      '', // Apellido
      '', // Teléfono
      '', // Institución
      '', // Cargo
      '', // resetToken
      '', // resetTokenExpiry
      'Usuario Gratis', // Rol (por defecto)
    ];
    const success = await appendSheetData(process.env.SPREADSHEET_ID, 'Login', newRow);

    if (!success) {
      return res.status(500).json({ message: 'Error al registrar el usuario.' });
    }

    // Generar un token temporal para el siguiente paso
    const payload = { email, step: 'profile_completion' };
    const tempToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' }); // Token válido por 15 minutos

    res.status(201).json({
      message: 'Credenciales registradas. Por favor, completa tu perfil.',
      tempToken,
    });

  } catch (error) {
    console.error('Error en el controlador de registro de credenciales:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};


// --- Controlador para el segundo paso del registro (completar perfil) ---
const registerProfileController = async (req, res) => {
  try {
    // El email se obtiene del token JWT verificado por el middleware, no del body.
    const { email } = req.user;
    if (!email) {
      return res.status(403).json({ message: 'Token inválido o sin email.' });
    }

    // Extraemos los datos del perfil del cuerpo de la petición.
    const { Nombre, Apellido, Telefono, Institucion, Cargo } = req.body;

    // Buscamos al usuario para obtener el índice de su fila.
    const result = await findUserByEmail(email);
    if (!result) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    const { rowIndex } = result;

    // --- Actualización de las celdas en Google Sheet ---
    // Creamos un array de promesas para actualizar todas las celdas necesarias.
    // Esto es más eficiente que hacerlo una por una esperando cada vez.
    const updatePromises = [
      updateCell(process.env.SPREADSHEET_ID, 'Login', `D${rowIndex}`, Nombre),
      updateCell(process.env.SPREADSHEET_ID, 'Login', `E${rowIndex}`, Apellido),
      updateCell(process.env.SPREADSHEET_ID, 'Login', `F${rowIndex}`, Telefono),
      updateCell(process.env.SPREADSHEET_ID, 'Login', `G${rowIndex}`, Institucion),
      updateCell(process.env.SPREADSHEET_ID, 'Login', `H${rowIndex}`, Cargo),
    ];

    // `Promise.all` ejecuta todas las promesas en paralelo.
    await Promise.all(updatePromises);

    res.status(200).json({ message: 'Perfil completado exitosamente.' });

  } catch (error) {
    console.error('Error en el controlador de completar perfil:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// --- Controlador para solicitar la recuperación de contraseña ---
const forgotPasswordController = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await findUserByEmail(email);

    if (result) {
      const { user, rowIndex } = result;

      // Generar un código OTP de 6 dígitos.
      const otp = generateOtp();
      // El código expira en 10 minutos.
      const otpExpiry = Date.now() + 600000; // 10 minutos en milisegundos

      // EL NUEVO ENLACE APUNTANDO A TU SERVIDOR
      // (Es recomendable mover esta URL a tu archivo .env como BACKEND_URL)
      const backendUrl = 'https://manuales2-0-backend.onrender.com';
      const finalLink = `${backendUrl}/api/redirect?otp=${otp}&email=${email}`;

      await Promise.all([
        updateCell(process.env.SPREADSHEET_ID, 'Login', `I${rowIndex}`, otp),
        updateCell(process.env.SPREADSHEET_ID, 'Login', `J${rowIndex}`, new Date(otpExpiry).toISOString()),
      ]);

      // Enviar el correo de recuperación con el código OTP.
      const emailHTML = getPasswordResetHTML(user.Nombre || 'usuario', finalLink);
      await sendEmail(email, 'Restablece tu contraseña', emailHTML);
    }

    // Por seguridad, siempre enviamos una respuesta genérica.
    res.status(200).json({ message: 'Si tu correo está registrado, recibirás un código de recuperación.' });

  } catch (error) {
    console.error('Error en el controlador de forgot-password:', error);
    res.status(200).json({ message: 'Si tu correo está registrado, recibirás un código de recuperación.' });
  }
};


// --- Controlador para resetear la contraseña ---
const resetPasswordController = async (req, res) => {
  try {
    // El email se obtiene del token JWT verificado por el middleware.
    const { email } = req.user;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'La nueva contraseña es requerida.' });
    }
    if (!email) {
      return res.status(403).json({ message: 'Token inválido o sin email.' });
    }

    // Buscar al usuario por email para obtener su fila
    const result = await findUserByEmail(email);
    if (!result) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    const { rowIndex } = result;

    // Hashear la nueva contraseña
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Actualizar la contraseña y limpiar los campos del token de reseteo
    const updatePromises = [
      updateCell(process.env.SPREADSHEET_ID, 'Login', `C${rowIndex}`, hashedPassword), // Columna de Contraseña
      updateCell(process.env.SPREADSHEET_ID, 'Login', `I${rowIndex}`, ''), // Limpiar resetToken
      updateCell(process.env.SPREADSHEET_ID, 'Login', `J${rowIndex}`, ''), // Limpiar resetTokenExpiry
    ];
    await Promise.all(updatePromises);

    res.status(200).json({ message: 'Contraseña actualizada exitosamente.' });

  } catch (error) {
    console.error('Error en el controlador de reset-password:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};


const verifyOtpController = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'El correo y el código OTP son requeridos.' });
    }

    const result = await findUserByEmail(email);
    if (!result) {
      return res.status(400).json({ message: 'Código o correo inválido.' });
    }

    const { user } = result;

    // Verificar si el código OTP coincide y no ha expirado
    const now = Date.now();
    const expiryDate = new Date(user.resetTokenExpiry).getTime();
    const isValid = user.resetToken === otp && now < expiryDate;

    if (!isValid) {
      return res.status(400).json({ message: 'Código inválido o expirado.' });
    }

    // Generar un token temporal para autorizar el reseteo de contraseña
    const payload = { email, step: 'reset_password' };
    const resetToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '10m' }); // Válido por 10 minutos

    res.status(200).json({
      message: 'Código verificado exitosamente.',
      resetToken,
    });

  } catch (error) {
    console.error('Error en el controlador de verify-otp:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = {
  loginController,
  registerCredentialsController,
  registerProfileController,
  forgotPasswordController,
  resetPasswordController,
  verifyOtpController,
};
