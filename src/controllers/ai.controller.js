const aiService = require('../services/ai.service');
const { logChatMessage } = require('../services/chatLog.service');
const { getProfileByEmail } = require('../services/user.service');

const handleMessage = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!message || !sessionId) {
      return res.status(400).json({ error: 'Faltan los parámetros "message" o "sessionId".' });
    }
    
    // Llamamos a nuestro servicio para obtener la respuesta del bot
    const botResponse = await aiService.detectIntentText(message, sessionId);
    
    // --- Lógica para registrar la conversación ---
    // Esta lógica se ejecuta después de obtener la respuesta y antes de enviarla al usuario,
    // para no afectar la velocidad de respuesta percibida por el cliente.
    
    // 1. Obtenemos el email del usuario desde el token JWT que ya fue verificado por el middleware.
    const userEmail = req.user.email;
    
    // 2. Usamos el email para buscar el perfil completo del usuario y obtener su nombre.
    const userProfile = await getProfileByEmail(userEmail);
    const userName = userProfile ? `${userProfile.Nombre} ${userProfile.Apellido}` : userEmail; // Si no se encuentra el nombre, usamos el email como fallback.

    // 3. Llamamos al servicio de registro. No usamos 'await' aquí a propósito.
    // Esto se conoce como "fire-and-forget" (dispara y olvida).
    // La respuesta se envía al usuario INMEDIATAMENTE, y el registro en la hoja de cálculo
    // se realiza en segundo plano. Así, si el guardado tarda o falla, no retrasa al usuario.
    logChatMessage(userName, message, botResponse)
        .catch(err => {
            // Si el guardado falla, solo lo mostramos en la consola del servidor.
            console.error("Error en el proceso de log en segundo plano:", err)
        });

    // --- Fin ---

    res.status(200).json({ reply: botResponse });
    
  } catch (error) {
    console.error('Error en el controlador de IA:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

module.exports = { 
  handleMessage 
};