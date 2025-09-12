const { appendSheetData } = require('./sheets.service');

// El ID de la hoja de cálculo donde se guardarán los logs.
const CHAT_SPREADSHEET_ID = process.env.CHAT_SPREADSHEET_ID;
// El nombre de la hoja donde se guardarán los logs.
const CHAT_SHEET_NAME = process.env.CHAT_SHEET_NAME;

/**
 * Registra un intercambio de mensajes entre un usuario y la IA en Google Sheets.
 * @param {string} userName - El nombre del usuario que envía el mensaje.
 * @param {string} userMessage - El mensaje enviado por el usuario.
 * @param {string} botResponse - La respuesta generada por el asistente de IA.
 * @returns {Promise<void>}
 */
const logChatMessage = async (userName, userMessage, botResponse) => {
  try {
    // 1. Verificamos que las variables necesarias estén presentes.
    if (!CHAT_SPREADSHEET_ID) {
      console.error('La variable de entorno CHAT_SPREADSHEET_ID no está configurada.');
      return;
    }
    
    // 2. Generamos la fecha y hora actual en la zona horaria de Venezuela.
    const timestamp = new Date().toLocaleString('es-VE', {
      timeZone: 'America/Caracas',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: true
    });

    // 3. Preparamos la fila con los datos en el orden correcto de las columnas.
    const rowData = [
      timestamp,       // Columna A: Tiempo
      userName,        // Columna B: Nombre de Usuario
      userMessage,     // Columna C: Mensaje del Usuario
      botResponse      // Columna D: Respuesta del Asistente
    ];

    // 4. Llamamos al servicio existente para añadir la nueva fila a la hoja de cálculo.
    await appendSheetData(CHAT_SPREADSHEET_ID, CHAT_SHEET_NAME, rowData);

  } catch (error) {
    // Si algo sale mal, lo registramos en la consola del servidor sin detener la aplicación.
    console.error('Error al registrar el mensaje del chat en Google Sheets:', error);
  }
};

module.exports = {
  logChatMessage,
};