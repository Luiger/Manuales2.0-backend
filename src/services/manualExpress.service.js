const { updateCell, appendSheetData, findRowByValueInColumn } = require('./sheets.service');

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = 'CONCURSO ABIERTO SIMINISTRO DE BIENES APP.COD';

// El COLUMN_MAP se mantiene igual, define la estructura de la hoja.
const COLUMN_MAP = {
  'Marca temporal': 'A',
  'Indique el Nombre de la Institución / Ente / Órgano.': 'B',
  'Indique el Acrónimo y/o siglas de la Institución / Ente / Órgano.': 'C',
  'Indique el Nombre de la Unidad / Gerencia y/u Oficina responsable de la Gestión Administrativa y Financiera de la Institución / Ente / Órgano.': 'D',
  'Indique el Nombre de la Unidad / Gerencia y/u Oficina responsable del Área de Sistema y Tecnología de la Institución / Ente / Órgano.': 'E',
  'UsuarioRegistradoEmail': 'F', 
  'Llenado': 'G',
};

const saveOrUpdateManualExpress = async (formData, userEmail) => {
  try {
    const existingEntry = await findRowByValueInColumn(SHEET_NAME, 'UsuarioRegistradoEmail', userEmail);

    // ✅ MEJORA: Se extraen explícitamente los campos esperados del formData.
    // Esto hace el código más seguro y legible.
    const nombreInstitucion = formData['Indique el Nombre de la Institución / Ente / Órgano.'];
    const siglas = formData['Indique el Acrónimo y/o siglas de la Institución / Ente / Órgano.'];
    const unidadGestion = formData['Indique el Nombre de la Unidad / Gerencia y/u Oficina responsable de la Gestión Administrativa y Financiera de la Institución / Ente / Órgano.'];
    const unidadSistemas = formData['Indique el Nombre de la Unidad / Gerencia y/u Oficina responsable del Área de Sistema y Tecnología de la Institución / Ente / Órgano.'];

    if (existingEntry) {
      // Si ya existe, actualiza la fila existente de forma explícita.
      const { rowIndex } = existingEntry;
      const updatePromises = [
        updateCell(SPREADSHEET_ID, SHEET_NAME, `B${rowIndex}`, nombreInstitucion),
        updateCell(SPREADSHEET_ID, SHEET_NAME, `C${rowIndex}`, siglas),
        updateCell(SPREADSHEET_ID, SHEET_NAME, `D${rowIndex}`, unidadGestion),
        updateCell(SPREADSHEET_ID, SHEET_NAME, `E${rowIndex}`, unidadSistemas),
        updateCell(SPREADSHEET_ID, SHEET_NAME, `G${rowIndex}`, 'TRUE'),
        updateCell(SPREADSHEET_ID, SHEET_NAME, `A${rowIndex}`, new Date().toISOString()),
      ];
      await Promise.all(updatePromises);
    } else {
      // Si no existe, crea una nueva fila.
      const newRow = [
        new Date().toISOString(), // Columna A
        nombreInstitucion,        // Columna B
        siglas,                   // Columna C
        unidadGestion,            // Columna D
        unidadSistemas,           // Columna E
        userEmail,                // Columna F
        'TRUE',                   // Columna G
      ];
      await appendSheetData(SPREADSHEET_ID, SHEET_NAME, newRow);
    }
    return true;
  } catch (error) {
    console.error('Error en saveOrUpdateManualExpress:', error);
    return false;
  }
};

module.exports = {
  saveOrUpdateManualExpress,
};