// backend/src/controllers/redirect.controller.js

const handleRedirect = (req, res) => {
    // Obtenemos el OTP y el email de los parámetros de la URL
    const { otp, email } = req.query;

    if (!otp || !email) {
        return res.status(400).send('<h1>Error: Faltan parámetros para la redirección.</h1>');
    }

    // Construimos el enlace profundo que abrirá la app
    const appSchemeUrl = `manualesapp://forgot-password?otp=${otp}&email=${email}`;
    
    // Definimos una URL de respaldo si la app no está instalada
    const fallbackUrl = 'https://universitas.legal/';

    // Generamos el código HTML que hará la redirección
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Continuar en la Aplicación</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center; padding: 40px 20px; background-color: #f8f9fa; }
                .container { max-width: 400px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .button { display: inline-block; background-color: #1d2342; color: #ffffff; padding: 16px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
                .fallback-link { display: block; margin-top: 20px; font-size: 14px; color: #6c757d; }
            </style>
            <script type="text/javascript">
                // Opcional: Aún podemos intentar la redirección automática para los navegadores que lo permitan.
                window.onload = function() {
                    window.location.href = "${appSchemeUrl}";
                };
            </script>
        </head>
        <body>
            <div class="container">
                <h2>Casi listo</h2>
                <p>Presiona el botón para continuar en la aplicación y restablecer tu contraseña.</p>
                <a href="${appSchemeUrl}" class="button">Abrir en la aplicación</a>
                <a href="${fallbackUrl}" class="fallback-link">¿Problemas? Continúa en nuestro sitio web</a>
            </div>
        </body>
        </html>
    `;

    res.set('Content-Type', 'text/html');
    res.send(Buffer.from(html));
};

module.exports = { handleRedirect };