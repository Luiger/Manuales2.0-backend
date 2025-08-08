// backend/src/controllers/redirect.controller.js

const crypto = require('crypto');
const { updateCell, findRowByValueInColumn } = require('../services/sheets.service');

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
                <!DOCTYPE html><html><head><title>${statusTitle}</title><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:sans-serif;text-align:center;padding:40px 20px;} .container{max-width:500px;margin:auto;background-color:#fff;padding:30px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);} h1{color:#1d2342;}</style><script>window.location.replace("${appRedirectUrl}");</script></head><body><div class="container"><h1>${statusTitle}</h1><p>${statusMessage}</p></div></body></html>`;
            return res.set('Content-Type', 'text/html').send(Buffer.from(htmlResponse));

        } catch (error) {
            console.error('Error en la verificación vía web:', error);
            return res.status(500).send('<h1>Error del Servidor</h1>');
        }
    }
    // --- Caso 2: RECUPERAR CONTRASEÑA (Redirección Simple) ---
    else if (otp && email) {
        const appSchemeUrl = `manualesapp://forgot-password?otp=${otp}&email=${email}`;
        const htmlRedirect = `
            <!DOCTYPE html><html><head><title>Redirigiendo...</title><script type="text/javascript">window.onload = function() { window.location.href = "${appSchemeUrl}"; setTimeout(function() { window.location.href = "${fallbackUrl}"; }, 500); };</script></head><body><p>Redirigiendo a la aplicación...</p></body></html>`;
        return res.set('Content-Type', 'text/html').send(Buffer.from(htmlRedirect));
    }
    // --- Caso 3: Error de Parámetros ---
    else {
        return res.status(400).send('<h1>Error: Parámetros inválidos para la redirección.</h1>');
    }
};

module.exports = { handleRedirect };