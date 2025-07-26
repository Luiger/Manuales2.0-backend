const { updateCell, appendSheetData, findRowByValueInColumn } = require('./sheets.service');

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = 'CONCURSO ABIERTO SIMINISTRO DE BIENES APP.COD';

// El COLUMN_MAP ahora se usará correctamente
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

    // Se extraen las claves de las columnas para usarlas
    const nombreKey = 'Indique el Nombre de la Institución / Ente / Órgano.';
    const siglasKey = 'Indique el Acrónimo y/o siglas de la Institución / Ente / Órgano.';
    const gestionKey = 'Indique el Nombre de la Unidad / Gerencia y/u Oficina responsable de la Gestión Administrativa y Financiera de la Institución / Ente / Órgano.';
    const sistemasKey = 'Indique el Nombre de la Unidad / Gerencia y/u Oficina responsable del Área de Sistema y Tecnología de la Institución / Ente / Órgano.';

    if (existingEntry) {
      const { rowIndex } = existingEntry;
      // ✅ CORRECCIÓN: Se usa el COLUMN_MAP para encontrar la letra de la columna dinámicamente
      const updatePromises = [
        updateCell(SPREADSHEET_ID, SHEET_NAME, `${COLUMN_MAP[nombreKey]}${rowIndex}`, formData[nombreKey]),
        updateCell(SPREADSHEET_ID, SHEET_NAME, `${COLUMN_MAP[siglasKey]}${rowIndex}`, formData[siglasKey]),
        updateCell(SPREADSHEET_ID, SHEET_NAME, `${COLUMN_MAP[gestionKey]}${rowIndex}`, formData[gestionKey]),
        updateCell(SPREADSHEET_ID, SHEET_NAME, `${COLUMN_MAP[sistemasKey]}${rowIndex}`, formData[sistemasKey]),
        updateCell(SPREADSHEET_ID, SHEET_NAME, `${COLUMN_MAP['Llenado']}${rowIndex}`, 'TRUE'),
        updateCell(SPREADSHEET_ID, SHEET_NAME, `${COLUMN_MAP['Marca temporal']}${rowIndex}`, new Date().toISOString()),
      ];
      await Promise.all(updatePromises);
    } else {
      // Para la creación de una nueva fila, el orden es lo importante, y ya estaba correcto.
      const newRow = [
        new Date().toISOString(),
        formData[nombreKey],
        formData[siglasKey],
        formData[gestionKey],
        formData[sistemasKey],
        userEmail,
        'TRUE',
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