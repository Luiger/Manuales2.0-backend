const aiService = require('../services/ai.service');

const handleMessage = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!message || !sessionId) {
      return res.status(400).json({ error: 'Faltan los parámetros "message" o "sessionId".' });
    }
    
    // Llamamos a nuestro servicio para obtener la respuesta del bot
    const botResponse = await aiService.detectIntentText(message, sessionId);
    
    res.status(200).json({ reply: botResponse });
    
  } catch (error) {
    console.error('Error en el controlador de IA:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

module.exports = { handleMessage };