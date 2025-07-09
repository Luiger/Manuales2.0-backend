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
const getOtpEmailHTML = (otp, name) => {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; text-align: center; padding: 20px;">
      <h2 style="color: #3B82F6;">Recuperación de Contraseña</h2>
      <p>Hola ${name},</p>
      <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
      <p>Usa el siguiente código para continuar:</p>
      <div style="background-color: #f0f0f0; border-radius: 8px; padding: 15px; margin: 20px auto; width: fit-content;">
        <strong style="font-size: 24px; letter-spacing: 5px; color: #1F2937;">${otp}</strong>
      </div>
      <p>Este código expirará en 10 minutos.</p>
      <p>Si no solicitaste esto, por favor ignora este correo.</p>
      <p>Gracias,<br>El equipo de Manuales de Contrataciones</p>
    </div>
  `;
};


module.exports = {
  sendEmail,
  generateOtp,
  getOtpEmailHTML,
};
