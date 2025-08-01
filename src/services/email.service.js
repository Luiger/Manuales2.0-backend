// --- Explicación del Archivo ---
// Este servicio encapsula toda la lógica para el envío de correos electrónicos
// utilizando la librería Nodemailer y el servicio SMTP de Gmail.

const nodemailer = require('nodemailer');

// --- Configuración del Transportador de Nodemailer ---
// `transporter`: Es el objeto que se encargará de enviar los correos.
// Lo configuramos una vez y lo reutilizamos en toda la aplicación.
const transporter = nodemailer.createTransport({
  // `host`: El servidor SMTP de Gmail.
  host: process.env.EMAIL_HOST,
  // `port`: El puerto estándar para conexiones seguras (SSL/TLS).
  port: 465,
  // `secure`: `true` porque estamos usando el puerto 465, que requiere una conexión segura.
  secure: true,
  // `auth`: Aquí van las credenciales de la cuenta de Gmail.
  auth: {
    // `user`: Tu dirección de correo de Gmail, cargada desde las variables de entorno.
    user: process.env.EMAIL_USER,
    // `pass`: Tu "Contraseña de aplicación" de Google, también desde las variables de entorno.
    pass: process.env.EMAIL_PASS,
  },
});

// --- Función para Enviar Correo ---
// `sendEmail`: Una función asíncrona que toma los detalles del correo y lo envía.
//    - `to`: La dirección de correo del destinatario.
//    - `subject`: El asunto del correo.
//    - `html`: El contenido del correo en formato HTML.
const sendEmail = async (to, subject, html) => {
  try {
    // `await transporter.sendMail(...)`: Envía el correo usando la configuración del transportador.
    await transporter.sendMail({
      // `from`: La dirección desde la que se envía el correo.
      // Es buena práctica incluir el nombre de tu aplicación.
      from: `"Manuales de Contrataciones" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log('Correo enviado exitosamente a:', to);
    return true;
  } catch (error) {
    // Si ocurre un error durante el envío, lo capturamos y lo mostramos en la consola.
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
//    - `otp`: El código de 6 dígitos.
//    - `name`: El nombre del usuario para personalizar el correo.
const getPasswordResetHTML = (name, resetLink) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      .button:hover {
        opacity: 0.8;
      }
    </style>
  </head>
  <body style="font-family: Arial, sans-serif; color: #333; text-align: center; padding: 20px; background-color: #f9f9f9;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border: 1px solid #ddd; border-radius: 8px; padding: 20px 40px;">
      <h2 style="color: #1d2342;">Recuperación de Contraseña</h2>
      <p style="text-align: left;">Hola ${name},</p>
      <p style="text-align: left;">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
      <p style="text-align: left;">Para crear una nueva contraseña, por favor haz clic en el siguiente botón:</p>
      
      <a href="${resetLink}" target="_blank" class="button" style="display: inline-block; background-color: #1d2342; color: #ffffff; padding: 15px 25px; margin: 20px 0; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Crear nueva contraseña
      </a>
      
      <p style="font-size: 12px; color: #777;">Por tu seguridad, este enlace es de un solo uso y expirará en 10 minutos.</p>
      <p style="font-size: 12px; color: #777; margin-top: 20px;">Si el botón anterior no funciona, por favor copia y pega el siguiente enlace en tu navegador:</p>
      <p style="font-size: 12px; word-break: break-all;">
        <a href="${resetLink}" target="_blank" style="color: #1f3c87;">${resetLink}</a>
      </p>
      
      <p style="margin-top: 30px; text-align: left;">Si no solicitaste este cambio, puedes ignorar este correo electrónico sin problemas.</p>
      <p style="text-align: left;">Saludos,<br>El equipo de Manuales de Contrataciones</p>
    </div>
  </body>
  </html>
  `;
};

module.exports = {
  sendEmail,
  generateOtp,
  getPasswordResetHTML,
};
