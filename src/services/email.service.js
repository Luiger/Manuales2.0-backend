// Este servicio encapsula toda la lógica para el envío de correos electrónicos
// utilizando la librería Resend y su API.

const { Resend } = require('resend');

// --- Configuración del Cliente de Resend ---
// Utiliza la variable de entorno RESEND_API_KEY.
const resend = new Resend(process.env.RESEND_API_KEY);

// --- Función para Enviar Correo ---
const sendEmail = async (to, subject, html) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL, 
      to,
      subject,
      html,
    });

    // Si la API de Resend devuelve un error, lo manejamos.
    if (error) {
      console.error('Error al enviar el correo desde Resend:', error);
      return false;
    }

    console.log('Correo enviado exitosamente a:', to, 'con ID:', data.id);
    return true;

  } catch (error) {
    // Si ocurre un error de red o de otro tipo, lo capturamos.
    console.error('Error al enviar el correo:', error);
    return false;
  }
};

// --- Función para generar un código OTP de 6 dígitos ---
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// --- Plantilla de Correo para Enviar Código OTP ---
// `getOtpEmailHTML`: Genera el HTML para el correo con el código de recuperación.
//    - `name`: El nombre del usuario para personalizar el correo.
//    - `resetLink`: El enlace para restablecer la contraseña.
//    - `otp`: El código OTP que se mostrará en el correo.
const getPasswordResetHTML = (name, resetLink, otp) => {
  // Creamos los dígitos del OTP con estilos.
  const otpDigits = otp.split('').map(digit => 
    `<span style="color: #1d2342; font-weight: bold; font-size: 24px; letter-spacing: 5px;">${digit}</span>`
  ).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style> .button:hover { opacity: 0.8; } </style>
    </head>
    <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; border: 1px solid #ddd; border-radius: 8px; padding: 20px 40px;">
        <h2 style="color: #1d2342;">Restablecer contraseña</h2>
        <p>Hola ${name},</p>
        <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
        
        <p>Usa el siguiente código para continuar:</p>
        <div style="background-color: #f0f0f0; border-radius: 8px; padding: 15px; margin: 20px auto; width: fit-content;">
          ${otpDigits}
        </div>
        
        <p>O presiona el siguiente botón:</p>
        <a href="${resetLink}" target="_blank" class="button" style="display: inline-block; background-color: #1d2342; color: #ffffff; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">
          Crear nueva contraseña
        </a>
        
        <p style="font-size: 12px; color: #777; margin-top: 20px;">Por tu seguridad, este enlace es de un solo uso y expirará en 10 minutos.</p>
        <p style="font-size: 12px; color: #777;">Si el botón no funciona, puedes usar el enlace: <a href="${resetLink}" target="_blank" style="color: #1f3c87;">${resetLink}</a></p>
      </div>
    </body>
    </html>
  `;
};

// --- Plantilla de Correo para Confirmar Cuenta ---
// `getActivationEmailHTML`: Genera el HTML para el correo de confirmación de cuenta.
//    - `name`: El nombre del usuario para personalizar el correo.
//    - `activationLink`: El enlace para activar la cuenta.
const getActivationEmailHTML = (name, activationLink) => {
  return `
  <!DOCTYPE html>
  <html>
  <body>
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #1d2342;">Confirma tu cuenta</h2>
      <p style="text-align: left;">¡Hola, ${name}!</p>
      <p style="text-align: left;">Te damos la bienvenida a la aplicación de elaboración de Manuales de Contrataciones Públicas de Universitas.</p>
      <p style="text-align: left;">Para completar tu registro y asegurar tu cuenta, solo necesitas hacer clic en el siguiente botón:</p>
      <a href="${activationLink}" target="_blank" style="display: inline-block; background-color: #1d2342; color: #ffffff; padding: 15px 25px; margin: 20px 0; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Activar mi cuenta
      </a>
      <p style="font-size: 12px; color: #777;">Si el botón anterior no funciona, por favor copia y pega el siguiente enlace en tu navegador:<br><a href="${activationLink}" target="_blank" style="color: #1f3c87;">${activationLink}</a></p>
      <p style="margin-top: 20px; text-align: left;">Una vez que actives tu cuenta, podrás iniciar sesión y comenzar a elaborar tu manual express de forma gratuita.</p>
      <p style="text-align: left;">Si no creaste esta cuenta, por favor ignora este correo electrónico.</p>
      <p style="text-align: left;">Saludos,<br>El equipo de Universitas</p>
    </div>
  </body>
  </html>
  `;
};

// --- Plantilla de Correo para Confirmar Eliminación de Cuenta ---
// `getDeletionEmailHTML`: Genera el HTML para el correo de confirmación de eliminación de cuenta.
//    - `name`: El nombre del usuario para personalizar el correo.
//    - `confirmationLink`: El enlace para confirmar la eliminación de la cuenta.
const getDeletionEmailHTML = (name, confirmationLink) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <style> .button:hover { opacity: 0.8; } </style>
  </head>
  <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f9f9f9;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border: 1px solid #ddd; border-radius: 8px; padding: 20px 40px;">
      <h2 style="color: #1d2342;">Confirmación de Eliminación de Cuenta</h2>
      <p style="text-align: left;">Hola ${name},</p>
      <p style="text-align: left;">Hemos recibido una solicitud para eliminar permanentemente tu cuenta y todos los datos asociados de la plataforma Manuales de Contrataciones Públicas.</p>
      <p style="text-align: left;">Si tú iniciaste esta solicitud, por favor haz clic en el siguiente botón para confirmar. Esta acción es irreversible.</p>
      
      <a href="${confirmationLink}" target="_blank" class="button" 
        style="display: inline-block; background-color: #e73746; color: #ffffff; padding: 15px 25px; margin: 20px 0; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; line-height: 1.4;">
        Eliminar mi cuenta permanentemente
      </a>
      
      <p style="font-size: 12px; color: #777;">Este enlace de confirmación es de un solo uso y expirará en 1 hora.</p>
      
      <p style="margin-top: 30px; text-align: left;">Si no solicitaste esta eliminación, puedes ignorar este correo electrónico de forma segura. No se realizará ninguna acción en tu cuenta.</p>
      <p style="text-align: left;">Saludos,<br>El equipo de Universitas</p>
    </div>
  </body>
  </html>
  `;
};

module.exports = {
  sendEmail,
  generateOtp,
  getPasswordResetHTML,
  getActivationEmailHTML,
  getDeletionEmailHTML,
};
