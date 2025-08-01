const { updateCell, appendSheetData, findRowByValueInColumn } = require('./sheets.service');

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = 'MANUAL CONTRATACIONES valor agregado APP.COD';

// Mapeo de columnas, incluyendo las nuevas
const COLUMN_MAP = {
  'Marca temporal': 'A',
  'Indique el Nombre de la Institución / Ente / Órgano.': 'B',
  'Indique el Acrónimo y/o siglas de la Institución / Ente / Órgano.': 'C',
  'Indique el Nombre de la Unidad / Gerencia y/u Oficina responsable de la Gestión Administrativa y Financiera de la Institución / Ente / Órgano.': 'D',
  'Indique el Nombre de la Unidad / Gerencia y/u Oficina responsable del Área de Sistema y Tecnología de la Institución / Ente / Órgano.': 'E',
  'Indique el Nombre de la Unidad / Gerencia y/u Oficina que cumple funciones de Unidad Contratante en la Institución / Ente / Órgano.': 'F',
  'Correo electrónico (Opcional)': 'G',
  'UsuarioRegistradoEmail': 'H',
  'Llenado': 'I',
};
/**
 * Guarda o actualiza una entrada, vinculada al usuario autenticado.
 * @param {object} formData - Los datos del formulario.
 * @param {string} userEmail - El email del usuario autenticado (desde el token JWT).
 * @returns {Promise<boolean>}
 */
const saveOrUpdateManualContrataciones = async (formData, userEmail) => {
  try {
    // Busca si el USUARIO LOGUEADO ya tiene una entrada en este formulario.
    const existingEntry = await findRowByValueInColumn(
      SHEET_NAME,
      'UsuarioRegistradoEmail', // Busca en la columna de control
      userEmail                 // con el email del usuario autenticado
    );

    if (existingEntry) {
      // Si ya existe, actualiza la fila existente.
      const { rowIndex } = existingEntry;
      console.log(`Actualizando fila ${rowIndex} para el usuario ${userEmail}`);
      
      const updatePromises = [
        updateCell(SPREADSHEET_ID, SHEET_NAME, `${COLUMN_MAP['Indique el Nombre de la Institución / Ente / Órgano.']}${rowIndex}`, formData.nombreInstitucion),
        updateCell(SPREADSHEET_ID, SHEET_NAME, `${COLUMN_MAP['Indique el Acrónimo y/o siglas de la Institución / Ente / Órgano.']}${rowIndex}`, formData.siglasInstitucion),
        updateCell(SPREADSHEET_ID, SHEET_NAME, `${COLUMN_MAP['Indique el Nombre de la Unidad / Gerencia y/u Oficina responsable de la Gestión Administrativa y Financiera de la Institución / Ente / Órgano.']}${rowIndex}`, formData.unidadGestion),
        updateCell(SPREADSHEET_ID, SHEET_NAME, `${COLUMN_MAP['Indique el Nombre de la Unidad / Gerencia y/u Oficina responsable del Área de Sistema y Tecnología de la Institución / Ente / Órgano.']}${rowIndex}`, formData.unidadSistemas),
        updateCell(SPREADSHEET_ID, SHEET_NAME, `${COLUMN_MAP['Indique el Nombre de la Unidad / Gerencia y/u Oficina que cumple funciones de Unidad Contratante en la Institución / Ente / Órgano.']}${rowIndex}`, formData.unidadContratante),
        updateCell(SPREADSHEET_ID, SHEET_NAME, `${COLUMN_MAP['Correo electrónico (Opcional)']}${rowIndex}`, formData.emailAdicional),
        updateCell(SPREADSHEET_ID, SHEET_NAME, `${COLUMN_MAP['Llenado']}${rowIndex}`, 'TRUE'),
        updateCell(SPREADSHEET_ID, SHEET_NAME, `${COLUMN_MAP['Marca temporal']}${rowIndex}`, new Date().toISOString()),
      ];

      await Promise.all(updatePromises);

    } else {
      // Si no existe, crea una nueva fila.
      console.log(`Creando nueva fila para el usuario ${userEmail}`);
      const newRow = [
        new Date().toISOString(),
        formData.nombreInstitucion,
        formData.siglasInstitucion,
        formData.unidadGestion,
        formData.unidadSistemas,
        formData.unidadContratante,
        formData.emailAdicional,
        userEmail, // Email del usuario autenticado
        'TRUE',    // Estado de llenado
      ];
      await appendSheetData(SPREADSHEET_ID, SHEET_NAME, newRow);
    }
    return true;
  } catch (error) {
    console.error('Error en saveOrUpdateManualContrataciones:', error);
    return false;
  }
};

module.exports = {
  saveOrUpdateManualContrataciones,
};
