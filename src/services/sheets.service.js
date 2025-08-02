const { google } = require('googleapis');

// La librería de Google busca esta variable de entorno por defecto.
const auth = new google.auth.GoogleAuth({  
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

/**
 * Obtiene datos de un rango específico de una hoja.
 * @param {string} spreadsheetId - El ID de la hoja de cálculo.
 * @param {string} range - El rango a obtener (ej: 'MiHoja!A1:Z100').
 * @returns {Promise<Array<Array<string>>|null>}
 */
const getSheetData = async (spreadsheetId, range) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range, // Usa el 'range' que incluye el nombre de la hoja
    });
    return response.data.values;
  } catch (error) {
    console.error(`Error fetching sheet data for range ${range}:`, error.message);
    return null;
  }
};

/**
 * Añade una nueva fila de datos al final de una hoja.
 * @param {string} spreadsheetId - El ID de la hoja de cálculo.
 * @param {string} sheetName - El nombre de la hoja.
 * @param {Array<string>} rowData - Los datos de la fila a añadir.
 * @returns {Promise<boolean>}
 */
const appendSheetData = async (spreadsheetId, sheetName, rowData) => {
  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: sheetName,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });
    return response.status === 200;
  } catch (error) {
    console.error('Error appending sheet data:', error);
    return false;
  }
};

/**
 * Actualiza el valor de una celda específica.
 * @param {string} spreadsheetId - El ID de la hoja de cálculo.
 * @param {string} sheetName - El nombre de la hoja.
 * @param {string} range - La celda a actualizar (ej: 'A1').
 * @param {string} value - El nuevo valor.
 * @returns {Promise<boolean>}
 */
const updateCell = async (spreadsheetId, sheetName, range, value) => {
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!${range}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[value]],
      },
    });
    return true;
  } catch (error) {
    console.error('Error updating cell:', error);
    return false;
  }
};

/**
 * VERSIÓN OPTIMIZADA Y CORREGIDA
 * Busca una fila basándose en el valor de una columna de forma eficiente.
 */
const findRowByValueInColumn = async (sheetName, columnName, valueToFind) => {
  try {
    const spreadsheetId = process.env.SPREADSHEET_ID;

    // 1. Obtiene los encabezados para encontrar el índice de la columna
    const headerResponse = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${sheetName}!1:1` });
    if (!headerResponse.data.values) {
        throw new Error(`La hoja "${sheetName}" está vacía o no tiene encabezados.`);
    }
    const headers = headerResponse.data.values[0];
    const columnIndex = headers.indexOf(columnName);

    if (columnIndex === -1) {
      throw new Error(`La columna "${columnName}" no fue encontrada en "${sheetName}".`);
    }

    const columnLetter = String.fromCharCode('A'.charCodeAt(0) + columnIndex);

    // 2. Obtiene solo la columna de búsqueda para ser rápido
    const columnResponse = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${sheetName}!${columnLetter}2:${columnLetter}` });
    const columnValues = columnResponse.data.values;

    if (!columnValues) return null;

    // 3. Busca el valor en memoria
    const rowIndexInArray = columnValues.findIndex(row => row[0] === valueToFind);
    if (rowIndexInArray === -1) return null;
    
    const sheetRowIndex = rowIndexInArray + 2;

    // 4. Si lo encuentra, obtiene solo los datos de esa fila específica
    const rowResponse = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${sheetName}!${sheetRowIndex}:${sheetRowIndex}` });
    const rowData = rowResponse.data.values[0];

    const userObject = {};
    headers.forEach((header, index) => {
      userObject[header] = rowData[index] || '';
    });

    return { user: userObject, rowIndex: sheetRowIndex };

  } catch (error) {
    console.error(`Error en la búsqueda optimizada en "${sheetName}":`, error);
    return null;
  }
};

/**
 * Función específica para buscar un usuario por su email en la hoja "Login".
 * @param {string} email - El email a buscar.
 */
const findUserByEmail = async (email) => {
  try {
    return await findRowByValueInColumn('Login', 'Usuario', email);
  } catch (error) {
    console.error('Error al buscar usuario por email:', error);
    return null;
  }
};

/**
 * Función específica para buscar un usuario por su token de reseteo.
 * @param {string} token - El token a buscar.
 */
const findUserByResetToken = async (token) => {
    try {
        return await findRowByValueInColumn('Login', 'resetToken', token);
    } catch (error) {
        console.error('Error al buscar usuario por token de reseteo:', error);
        return null;
    }
};

/**
 * Elimina una fila específica de una hoja de cálculo.
 * @param {string} spreadsheetId - El ID de la hoja de cálculo.
 * @param {string} sheetName - El nombre de la hoja.
 * @param {number} rowIndex - El índice de la fila a eliminar.
 * @returns {Promise<boolean>}
 */
const deleteRow = async (spreadsheetId, sheetName, rowIndex) => {
  try {
    // Para obtener el sheetId correcto, que es un número.
    const sheetMetadata = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = sheetMetadata.data.sheets.find(s => s.properties.title === sheetName);
    if (!sheet) throw new Error(`Hoja "${sheetName}" no encontrada.`);
    const sheetId = sheet.properties.sheetId;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex - 1, // Los índices de la API son base 0
                endIndex: rowIndex,
              },
            },
          },
        ],
      },
    });
    return true;
  } catch (error) {
    console.error('Error al eliminar la fila:', error);
    return false;
  }
}; 

module.exports = {
  getSheetData,
  appendSheetData,
  findUserByEmail,
  updateCell,
  findUserByResetToken,
  findRowByValueInColumn,
  sheets, // Se exporta para ser usado en otros servicios
  deleteRow,
};