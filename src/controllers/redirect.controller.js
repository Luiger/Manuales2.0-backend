// backend/src/controllers/redirect.controller.js

const handleRedirect = (req, res) => {
    // Obtenemos el OTP y el email de los parámetros de la URL
    const { type, token, otp, email } = req.query;
    let appSchemeUrl = ''; // La dejaremos vacía para llenarla según el caso.
    const fallbackUrl = 'https://universitas.legal/';

    if (!otp || !email) {
        return res.status(400).send('<h1>Error: Faltan parámetros para la redirección.</h1>');
    }

    // 2. Revisamos qué tipo de enlace hemos recibido.
    // Si la URL contiene 'type=verify' y un 'token', es un enlace de activación.
    if (type === 'verify' && token) {
        appSchemeUrl = `manualesapp://verify-account?token=${token}`;
    } 
    // Si no, si contiene 'otp' y 'email', es un enlace de recuperación de contraseña.
    else if (otp && email) {
        appSchemeUrl = `manualesapp://forgot-password?otp=${otp}&email=${email}`;
    } 
    // Si no es ninguno de los dos, los parámetros son incorrectos.
    else {
        return res.status(400).send('<h1>Error: Parámetros inválidos para la redirección.</h1>');
    }

    // Generamos el código HTML que hará la redirección
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Abriendo la aplicación...</title>
            <meta charset="UTF-8">
            <style>
                body { font-family: sans-serif; text-align: center; padding-top: 50px; }
            </style>
            <script type="text/javascript">
                window.onload = function() {
                    window.location.href = "${appSchemeUrl}";
                    setTimeout(function() {
                        window.location.href = "${fallbackUrl}";
                    }, 500);
                };
            </script>
        </head>
        <body>
            <p>Redirigiendo a la aplicación...</p>
            <p>Si la aplicación no se abre, haz clic <a href="${appSchemeUrl}">aquí</a>.</p>
        </body>
        </html>
    `;

    res.set('Content-Type', 'text/html');
    res.send(Buffer.from(html));
};

module.exports = { handleRedirect };