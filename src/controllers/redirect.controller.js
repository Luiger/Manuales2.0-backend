const crypto = require('crypto');
const { updateCell, findRowByValueInColumn, findUserByEmail } = require('../services/sheets.service');

const handleRedirect = async (req, res) => {
    const { type, token, otp, email } = req.query;
    const fallbackUrl = 'https://universitas.legal/';

    // --- Caso 1: VERIFICACIÓN DE CUENTA (Lógica Inteligente) ---
    if (type === 'verify' && token) {
        try {
            const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
            const result = await findRowByValueInColumn('Login', 'resetToken', hashedToken);

            let statusTitle = '';
            let statusMessage = '';
            let appRedirectUrl = 'manualesapp://login';

            if (!result || new Date(result.user.resetTokenExpiry).getTime() < Date.now()) {
                statusTitle = 'Enlace Inválido o Expirado';
                statusMessage = 'Este enlace de verificación ya no es válido. Por favor, intenta registrarte de nuevo.';
                appRedirectUrl += '?error=verification_failed';
            } else if (result.user.ID) {
                statusTitle = 'Cuenta Ya Verificada';
                statusMessage = 'Tu cuenta ya ha sido verificada anteriormente. Ya puedes iniciar sesión.';
                appRedirectUrl += '?verified=true';
            } else {
                const newId = crypto.randomUUID();
                await Promise.all([
                    updateCell(process.env.SPREADSHEET_ID, 'Login', `A${result.rowIndex}`, newId),
                    updateCell(process.env.SPREADSHEET_ID, 'Login', `I${result.rowIndex}`, ''),
                    updateCell(process.env.SPREADSHEET_ID, 'Login', `J${result.rowIndex}`, ''),
                ]);
                statusTitle = '¡Cuenta Verificada!';
                statusMessage = 'Tu cuenta ha sido confirmada exitosamente. Ya puedes iniciar sesión en la aplicación móvil.';
                appRedirectUrl += '?verified=true';
            }
            
            // Enviamos la página HTML de respuesta final
            const htmlResponse = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${statusTitle}</title>
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
                        <div class="logo">Manual de Contrataciones</div>
                        <h1 class="title">${statusTitle}</h1>
                        <p class="message">${statusMessage}</p>
                    </div>
                    <script>
                        (function() {
                            // Detecta si es un dispositivo móvil común.
                            var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                            
                            // Solo intenta redirigir a la app si es un móvil.
                            if (isMobile) {
                                window.location.href = "${appRedirectUrl}";
                            }
                        })();
                    </script>
                </body>
                </html>
            `;
            return res.set('Content-Type', 'text/html').send(Buffer.from(htmlResponse));

        } catch (error) {
            console.error('Error en la verificación vía web:', error);
            return res.status(500).send('<h1>Error del Servidor</h1><p>Ocurrió un error al procesar tu solicitud.</p>');
        }
    }
    // --- Caso 2: RECUPERAR CONTRASEÑA (Redirección Simple) ---
    else if (otp && email) {
        try {
            const result = await findUserByEmail(email);

            // VALIDAMOS EL TOKEN ANTES DE REDIRIGIR
            // Si el usuario no existe o el token en la base de datos está vacío (ya fue usado),
            // mostramos una página de error/informativa.
            if (!result || !result.user.resetToken) {
                const statusTitle = 'Enlace Inválido';
                const statusMessage = 'Este enlace de recuperación de contraseña ya ha sido utilizado o ha expirado. Por favor, solicita uno nuevo si lo necesitas.';
                
                const htmlResponse = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>${statusTitle}</title>
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
                            <div class="logo">Manual de Contrataciones</div>
                            <h1 class="title">${statusTitle}</h1>
                            <p class="message">${statusMessage}</p>
                        </div>
                    </body>
                    </html>
                `;
                
                return res.set('Content-Type', 'text/html').send(Buffer.from(htmlResponse));
            }

            // SI EL TOKEN ES VÁLIDO, REDIRIGIMOS A LA APP
            // Esta parte solo se ejecuta si el token existe en la base de datos.
            const appSchemeUrl = `manualesapp://forgot-password?otp=${otp}&email=${email}`;
            const htmlRedirect = `
                <!DOCTYPE html><html><head><title>Redirigiendo...</title><script type="text/javascript">window.onload = function() { window.location.href = "${appSchemeUrl}"; setTimeout(function() { window.location.href = "${fallbackUrl}"; }, 500); };</script></head><body><p>Redirigiendo a la aplicación...</p></body></html>`;
            
            return res.set('Content-Type', 'text/html').send(Buffer.from(htmlRedirect));

        } catch (error) {
            console.error('Error en la redirección de reseteo:', error);
            return res.status(500).send('<h1>Error del Servidor</h1>');
        }
    }
    // --- Caso 3: Error de Parámetros ---
    else {
        return res.status(400).send('<h1>Error: Parámetros inválidos para la redirección.</h1>');
    }
};

module.exports = { handleRedirect };