// --- Explicación del Archivo ---
// Este archivo contiene los controladores para la autenticación.
// Un controlador es una función que recibe la petición, procesa la lógica de negocio
// (a menudo llamando a servicios) y envía una respuesta.

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { findUserByEmail, updateCell, findUserByResetToken, appendSheetData, deleteRow, findRowByValueInColumn  } = require('../services/sheets.service');
const { sendEmail, generateOtp, getPasswordResetHTML, getActivationEmailHTML, getDeletionEmailHTML } = require('../services/email.service');

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

const registerController = async (req, res) => {
  try {
    // Recibe TODOS los datos del frontend en una sola petición
    const { email, password, Nombre, Apellido, Telefono, Institucion, Cargo } = req.body;

    // Lógica para limpiar usuarios expirados (se mantiene)
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      const isUnverifiedAndExpired = !existingUser.user.ID && new Date(existingUser.user.resetTokenExpiry).getTime() < Date.now();
      if (isUnverifiedAndExpired) {
        await deleteRow(process.env.SPREADSHEET_ID, 'Login', existingUser.rowIndex);
      } else {
        return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
      }
    }

    // Lógica para hashear la contraseña (se mantiene)
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Lógica para el token de activación (se mantiene)
    const activationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(activationToken).digest('hex');
    const tokenExpiry = Date.now() + 600000; // 10 minutos

    // Crea la fila completa con todos los datos de una vez
    const newRow = [
      '', // ID (se genera al confirmar)
      email,
      hashedPassword,
      Nombre,
      Apellido,
      Telefono,
      Institucion,
      Cargo,
      hashedToken, // resetToken (para activación)
      new Date(tokenExpiry).toISOString(), // resetTokenExpiry
      'Usuario Gratis', // Rol
    ];
    await appendSheetData(process.env.SPREADSHEET_ID, 'Login', newRow);

    // Envía el correo de activación (se mantiene)
    const backendUrl = process.env.BACKEND_URL;
    const activationLink = `${backendUrl}/api/redirect?type=verify&token=${activationToken}`;
    const emailHTML = getActivationEmailHTML(Nombre, activationLink);
    await sendEmail(email, 'Confirma tu cuenta en Manuales de Contrataciones Públicas', emailHTML);

    res.status(201).json({ success: true, message: 'Registro casi completo. Se ha enviado un correo de confirmación.' });

  } catch (error) {
    console.error('Error en registerController:', error);
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
      const emailHTML = getPasswordResetHTML(user.Nombre || 'usuario', finalLink, otp);
      await sendEmail(email, 'Restablece tu contraseña', emailHTML);
    }
    
    // Responder al usuario independientemente de si el correo existe o no.
    res.status(200).json({ message: 'Si tu correo está registrado y verificado, recibirás un enlace de recuperación.' });
  } catch (error) {
    console.error('Error en el controlador de forgot-password:', error);
    res.status(200).json({ message: 'Si tu correo está registrado, recibirás un código de recuperación.' });
    // Responder con un mensaje genérico para no revelar si el correo existe o no.
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error interno del servidor.' });
    }
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
      // Si el correo no existe, el código es inválido por defecto.
      return res.status(400).json({ message: 'El código ingresado es incorrecto.' });
    }

    const { user, rowIndex } = result;

    // Comparamos ambos valores como String para evitar errores de tipo de dato.
    if (String(user.resetToken) !== String(otp)) {
      return res.status(400).json({ message: 'El código ingresado es incorrecto.' });
    }

    // Verificar si el código OTP coincide y no ha expirado
    const now = Date.now();
    const expiryDate = new Date(user.resetTokenExpiry).getTime();
    // Verificamos si el OTP coincide y si no ha expirado
    // Si el OTP es incorrecto o ha expirado, respondemos con un error.
    if (now >= expiryDate) {
        // Limpia los datos expirados de la base de datos.
        await Promise.all([
            updateCell(process.env.SPREADSHEET_ID, 'Login', `I${rowIndex}`, ''), // Borra resetToken
            updateCell(process.env.SPREADSHEET_ID, 'Login', `J${rowIndex}`, ''), // Borra resetTokenExpiry
        ]);
        
        return res.status(400).json({ message: 'Tu código ha expirado, solicita otro.' });
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

// --- Controlador para refrescar el token ---
const refreshTokenController = async (req, res) => {
  try {
    // El middleware 'authenticateToken' ya nos ha dado los datos del usuario en req.user
    const userPayload = {
      id: req.user.id,
      email: req.user.email,
      rol: req.user.rol,
    };

    // Creamos un nuevo token con una nueva hora de expiración
    const newToken = jwt.sign(userPayload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ success: true, token: newToken });
  } catch (error) {
    console.error('Error en refreshTokenController:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// --- Controladores para eliminación de cuenta ---
const requestAccountDeletionController = async (req, res) => {
    try {
        const { email } = req.body;
        const result = await findUserByEmail(email);

        // Solo procedemos si el usuario existe
        if (result && result.user.ID) {
            const { user, rowIndex } = result;
            const deletionToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(deletionToken).digest('hex');
            const tokenExpiry = Date.now() + 3600000; // 1 hora para confirmar

            // Guarda el token en las nuevas columnas L y M
            await Promise.all([
                updateCell(process.env.SPREADSHEET_ID, 'Login', `L${rowIndex}`, hashedToken),
                updateCell(process.env.SPREADSHEET_ID, 'Login', `M${rowIndex}`, new Date(tokenExpiry).toISOString()),
            ]);

            // Envía el correo de confirmación
            const backendUrl = process.env.BACKEND_URL;
            const confirmationLink = `${backendUrl}/api/auth/confirm-deletion?token=${deletionToken}`;
            
            // (Necesitarás crear una nueva plantilla de correo 'getDeletionEmailHTML' en email.service.js)
            const emailHTML = getDeletionEmailHTML(user.Nombre, confirmationLink);
            await sendEmail(email, 'Confirmación para eliminar tu cuenta', emailHTML);
        }
        
        // Siempre enviamos una respuesta genérica por seguridad
        res.status(200).json({ message: 'Si tu correo está registrado, recibirás un enlace para confirmar la eliminación.' });

    } catch (error) {
        console.error('Error en requestAccountDeletionController:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// --- Controlador para confirmación de eliminación de cuenta ---
const confirmAccountDeletionController = async (req, res) => {
    try {
        const { token } = req.query;
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const result = await findRowByValueInColumn('Login', 'deletionToken', hashedToken);

        if (!result || new Date(result.user.deletionTokenExpiry).getTime() < Date.now()) {  
            const errorHtml = `
                <!DOCTYPE html><html><head><title>Enlace Inválido</title><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{margin:0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background-color:#f1f2f6;}.card{text-align:center;background-color:#fff;padding:40px 30px;border-radius:12px;box-shadow:0 5px 15px rgba(0,0,0,0.1);max-width:400px;margin:20px;}h1{color:#1d2342;font-size:22px;}p{font-size:16px;color:#374151;}</style></head><body><div class="card"><h1>Enlace inválido o expirado</h1><p>Este enlace ya no es válido. Si deseas eliminar tu cuenta, por favor inicia el proceso de nuevo.</p></div></body></html>`;
            return res.status(400).send(Buffer.from(errorHtml));
        }

        await deleteRow(process.env.SPREADSHEET_ID, 'Login', result.rowIndex);
        // Página confirmando la eliminación
        const successHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Cuenta Eliminada</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background-color: #f1f2f6; }
                    .card { text-align: center; background-color: #ffffff; padding: 40px 30px; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); max-width: 400px; margin: 20px; }
                    .logo { font-size: 24px; font-weight: bold; color: #1d2342; margin-bottom: 20px; }
                    .title { font-size: 22px; font-weight: bold; color: #1c2025; margin-bottom: 10px; }
                    .message { font-size: 16px; color: #374151; line-height: 1.5; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="logo">Universitas Legal</div>
                    <h1 class="title">Cuenta Eliminada</h1>
                    <p class="message">Tu cuenta y todos tus datos asociados han sido eliminados exitosamente de nuestra plataforma.</p>
                </div>
            </body>
            </html>
        `;
        res.set('Content-Type', 'text/html').send(Buffer.from(successHtml));

    } catch (error) {
        console.error('Error en confirmAccountDeletionController:', error);
        res.status(500).send('<h1>Error del Servidor</h1>');
    }
};

module.exports = {
  loginController,
  registerController,
  forgotPasswordController,
  resetPasswordController,
  verifyOtpController,
  verifyAccountController,
  refreshTokenController,
  requestAccountDeletionController,
  confirmAccountDeletionController,
};
