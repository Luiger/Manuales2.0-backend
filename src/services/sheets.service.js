const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
  keyFile: 'service-account.json',
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

// --- Nueva Función para Actualizar una Celda ---
// `updateCell`: Escribe un valor en una celda específica de la hoja.
const updateCell = async (spreadsheetId, sheetName, range, value) => {
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!${range}`, // ej: Login!A5
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


// --- Función Modificada para Buscar Usuario por Email ---
// Ahora devuelve tanto el usuario como el índice de su fila.
const findUserByEmail = async (email) => {
  try {
    const rows = await getSheetData(process.env.SPREADSHEET_ID, 'Login');
    if (!rows || rows.length <= 1) return null;

    const headers = rows[0];
    const dataRows = rows.slice(1);
    const emailColumnIndex = headers.indexOf('Usuario');
    if (emailColumnIndex === -1) return null;

    // `findIndex` nos da la posición del elemento en el array.
    const userRowIndex = dataRows.findIndex(row => row[emailColumnIndex] === email);

    if (userRowIndex === -1) {
      return null; // Usuario no encontrado
    }

    const userRow = dataRows[userRowIndex];
    const user = {};
    headers.forEach((header, index) => {
      user[header] = userRow[index] || ''; // Aseguramos que el valor sea un string vacío si la celda está vacía
    });

    // Devolvemos el objeto de usuario y el número de la fila en la hoja.
    // Sumamos 2 porque los arrays empiezan en 0 y la primera fila es de encabezados.
    return { user, rowIndex: userRowIndex + 2 };

  } catch (error) {
    console.error('Error al buscar usuario por email:', error);
    return null;
  }
};


module.exports = {
  getSheetData,
  appendSheetData,
  findUserByEmail,
  updateCell,
};
