const { SessionsClient } = require('@google-cloud/dialogflow-cx');
const { v4: uuidv4 } = require('uuid'); // Para generar IDs de sesión

const projectId = process.env.DIALOGFLOW_PROJECT_ID;
const location = process.env.DIALOGFLOW_LOCATION;
const agentId = process.env.DIALOGFLOW_AGENT_ID;

// Creamos un cliente de sesión de Dialogflow
const client = new SessionsClient();

/**
 * Envía un texto a Dialogflow CX y devuelve la respuesta del agente.
 * @param {string} text - El mensaje del usuario.
 * @param {string} sessionId - Un identificador único para la conversación.
 * @returns {Promise<string>} - La respuesta de texto del agente.
 */
async function detectIntentText(text, sessionId) {
  // Construimos la ruta de la sesión
  const sessionPath = client.projectLocationAgentSessionPath(
    projectId,
    location,
    agentId,
    sessionId
  );

  // Creamos la petición que enviaremos a Dialogflow
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: text,
      },
      languageCode: 'es', // El código de lenguaje de tu agente
    },
  };

  try {
    // Enviamos la petición
    const [response] = await client.detectIntent(request);
    let botResponse = '';

    // Extraemos el texto de las respuestas del agente
    for (const message of response.queryResult.responseMessages) {
      if (message.text) {
        botResponse += message.text.text.join(' ');
      }
    }
    
    return botResponse || "No he podido entender eso. ¿Puedes decirlo de otra forma?";
  } catch (error) {
    console.error('Error al contactar con Dialogflow CX:', error);
    return 'Lo siento, estoy teniendo problemas para conectarme. Por favor, inténtalo más tarde.';
  }
}

module.exports = { detectIntentText, uuidv4 };