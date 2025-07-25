const { google } = require('googleapis');
const GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;

const auth = new google.auth.GoogleAuth({  
  keyFile: GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

const getSheetData = async (spreadsheetId, sheetName) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetName,
    });
    return response.data.values;
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    return null;
  }
};

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
    console.error('Error appending sheet data:', error.response ? error.response.data : error.message);
    return false;
  }
};

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

const findUserByEmail = async (email) => {
  try {
    // Esta función ahora puede ser un caso específico de la nueva función genérica
    return await findRowByValueInColumn('Login', 'Usuario', email);
  } catch (error) {
    console.error('Error al buscar usuario por email:', error);
    return null;
  }
};

const findUserByResetToken = async (token) => {
    // ... (código existente sin cambios)
};


// --- NUEVA FUNCIÓN GENÉRICA ---
/**
 * Busca una fila en una hoja específica basándose en el valor de una columna.
 * @param {string} sheetName - El nombre de la hoja a buscar.
 * @param {string} columnName - El nombre de la columna (header) para buscar.
 * @param {string} valueToFind - El valor a encontrar en la columna especificada.
 * @returns {Promise<{user: object, rowIndex: number}|null>} - El objeto de datos y el índice de la fila, o null si no se encuentra.
 */
const findRowByValueInColumn = async (sheetName, columnName, valueToFind) => {
  try {
    const rows = await getSheetData(process.env.SPREADSHEET_ID, sheetName);
    if (!rows || rows.length <= 1) return null;

    const headers = rows[0];
    const dataRows = rows.slice(1);
    const columnIndex = headers.indexOf(columnName);

    if (columnIndex === -1) {
      console.error(`Error: La columna "${columnName}" no se encontró en la hoja "${sheetName}".`);
      return null;
    }

    const rowIndexInArray = dataRows.findIndex(row => row[columnIndex] === valueToFind);

    if (rowIndexInArray === -1) {
      return null; // No se encontró la fila
    }

    const rowData = dataRows[rowIndexInArray];
    const rowObject = {};
    headers.forEach((header, index) => {
      rowObject[header] = rowData[index] || '';
    });

    // Devolvemos el objeto y el número de la fila en la hoja (índice + 2)
    return { user: rowObject, rowIndex: rowIndexInArray + 2 };

  } catch (error) {
    console.error(`Error buscando por valor en la columna "${columnName}" en la hoja "${sheetName}":`, error);
    return null;
  }
};


module.exports = {
  getSheetData,
  appendSheetData,
  findUserByEmail,
  updateCell,
  findUserByResetToken,
  findRowByValueInColumn,
  sheets,
};
