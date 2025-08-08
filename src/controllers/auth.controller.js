// --- Explicación del Archivo ---
// Este archivo contiene los controladores para la autenticación.
// Un controlador es una función que recibe la petición, procesa la lógica de negocio
// (a menudo llamando a servicios) y envía una respuesta.

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { findUserByEmail, updateCell, findUserByResetToken, appendSheetData, deleteRow, findRowByValueInColumn  } = require('../services/sheets.service');
const { sendEmail, generateOtp, getPasswordResetHTML, getActivationEmailHTML } = require('../services/email.service');

const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await findUserByEmail(email);

    if (!email || !password) {
      return res.status(400).json({ message: 'El correo y la contraseña son requeridos.' });
    }    
    if (!result) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const { user } = result;
    if (!user.ID) { // VALIDACIÓN CLAVE
      return res.status(403).json({ message: 'Tu cuenta no ha sido verificada. Por favor, revisa tu correo electrónico.' });
    }

    const isMatch = bcrypt.compareSync(password, user.Contraseña);
    if (!isMatch) return res.status(401).json({ message: 'Credenciales inválidas.' });

    const payload = { id: user.ID, email: user.Usuario, rol: user.Rol };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Inicio de sesión exitoso.', token });

  } catch (error) {
    console.error('Error en el controlador de login:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// --- Controlador para el primer paso del registro ---
const registerCredentialsController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await findUserByEmail(email);

    if (!email || !password) {
      return res.status(400).json({ message: 'El correo y la contraseña son requeridos.' });
    }

    if (existingUser) {
      // Si el usuario existe pero no está verificado (no tiene ID) y su token expiró
      const isUnverifiedAndExpired = !existingUser.user.ID && new Date(existingUser.user.resetTokenExpiry).getTime() < Date.now();
      if (isUnverifiedAndExpired) {
        // Limpiamos el registro antiguo para permitir que el usuario se registre de nuevo
        await deleteRow(process.env.SPREADSHEET_ID, 'Login', existingUser.rowIndex);
      } else {
        return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
      }
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
    // Extraemos los datos del perfil del cuerpo de la petición.
    const { Nombre, Apellido, Telefono, Institucion, Cargo } = req.body;
    // Buscamos al usuario para obtener el índice de su fila.
    const result = await findUserByEmail(email);

    if (!email) {
      return res.status(403).json({ message: 'Token inválido o sin email.' });
    }        
    if (!result) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    
    const activationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(activationToken).digest('hex');
    const tokenExpiry = Date.now() + 600000; // 10 minutos

    // Creamos un array de promesas para actualizar todas las celdas necesarias.
    await Promise.all([
      updateCell(process.env.SPREADSHEET_ID, 'Login', `D${result.rowIndex}`, Nombre),
      updateCell(process.env.SPREADSHEET_ID, 'Login', `E${result.rowIndex}`, Apellido),
      updateCell(process.env.SPREADSHEET_ID, 'Login', `F${result.rowIndex}`, Telefono),
      updateCell(process.env.SPREADSHEET_ID, 'Login', `G${result.rowIndex}`, Institucion),
      updateCell(process.env.SPREADSHEET_ID, 'Login', `H${result.rowIndex}`, Cargo),
      updateCell(process.env.SPREADSHEET_ID, 'Login', `I${result.rowIndex}`, hashedToken), // Columna resetToken
      updateCell(process.env.SPREADSHEET_ID, 'Login', `J${result.rowIndex}`, new Date(tokenExpiry).toISOString()), // Columna resetTokenExpiry
    ]);

    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
        throw new Error('La URL del backend no está configurada en el archivo .env');
    }
    const deepLink = `${backendUrl}/api/redirect?type=verify&token=${activationToken}`;
    const emailHTML = getActivationEmailHTML(Nombre, deepLink);
    await sendEmail(email, 'Confirma tu cuenta en Manuales de Contrataciones Públicas', emailHTML);

    res.status(200).json({ success: true, message: 'Perfil guardado. Se ha enviado un correo de confirmación.' });
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

    if (result && result.user.ID) {
      if (!result.user.ID) { // VALIDACIÓN CLAVE
        return res.status(403).json({ message: 'Debes confirmar tu correo electrónico antes de poder recuperar la contraseña.' });
      }
      const { user, rowIndex } = result;
      // Generar un código OTP de 6 dígitos.
      const otp = generateOtp();
      // El código expira en 10 minutos.
      const otpExpiry = Date.now() + 600000; // 10 minutos en milisegundos

      // EL NUEVO ENLACE APUNTANDO AL SERVIDOR DEL BACKEND
      const backendUrl = process.env.BACKEND_URL;
      const finalLink = `${backendUrl}/api/redirect?otp=${otp}&email=${email}`;

      await Promise.all([
        updateCell(process.env.SPREADSHEET_ID, 'Login', `I${rowIndex}`, otp),
        updateCell(process.env.SPREADSHEET_ID, 'Login', `J${rowIndex}`, new Date(otpExpiry).toISOString()),
      ]);

      // Enviar el correo de recuperación con el código OTP.
      const emailHTML = getPasswordResetHTML(user.Nombre || 'usuario', finalLink);
      await sendEmail(email, 'Restablece tu contraseña', emailHTML);
    }
    
    // Responder al usuario independientemente de si el correo existe o no.
    res.status(200).json({ message: 'Si tu correo está registrado y verificado, recibirás un enlace de recuperación.' });
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

// --- Controlador para verificar la cuenta ---
// Este controlador se encarga de activar la cuenta del usuario al hacer clic en el enlace enviado
// Ya no se está usando
const verifyAccountController = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
            return res.status(400).json({ message: 'Token no proporcionado.' });
        }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const result = await findRowByValueInColumn('Login', 'resetToken', hashedToken);

    if (!result || new Date(result.user.resetTokenExpiry).getTime() < Date.now()) {
      return res.status(400).json({ message: 'Token de activación inválido o expirado.' });
    }

    const newId = crypto.randomUUID();
    await Promise.all([
      updateCell(process.env.SPREADSHEET_ID, 'Login', `A${result.rowIndex}`, newId),
      updateCell(process.env.SPREADSHEET_ID, 'Login', `I${result.rowIndex}`, ''), // Limpia el token
      updateCell(process.env.SPREADSHEET_ID, 'Login', `J${result.rowIndex}`, ''), // Limpia la expiración
    ]);

    res.status(200).json({ success: true, message: 'Cuenta verificada exitosamente.' });
  } catch (error) { 
      console.error('Error en verifyAccountController:', error);
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
  verifyAccountController,
};
