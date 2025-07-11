// --- Explicación del Archivo ---
// Este servicio contiene la lógica de negocio para interactuar con la hoja de cálculo
// "MANUAL CONTRATACIONES". Reemplaza al antiguo servicio genérico de formularios.

const { updateCell, appendSheetData, findRowByValueInColumn } = require('./sheets.service');

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = 'MANUAL CONTRATACIONES valor agregado ESCALA';

// --- MAPA DE COLUMNAS ---
// Mapea los nombres de los campos a las letras de las columnas correspondientes en la hoja.
// Esto hace que el código sea robusto ante cambios en el orden de las columnas.
const COLUMN_MAP = {
  'Marca temporal': 'A',
  'Dirección de correo electrónico': 'B',
  'Nombre de la Institución / Ente / Órgano': 'C',
  'Acrónimo y/o siglas de la Institución / Ente / Órgano': 'D',
  'Nombre de la Unidad / Gerencia y/u Oficina responsable de la Gestión Administrativa y Financiera de la Institución / Ente / Órgano': 'E',
  'Nombre de la Unidad / Gerencia y/u Oficina responsable del Área de Sistema y Tecnología de la Institución / Ente / Órgano': 'F',
  'Nombre de la Unidad / Gerencia y/u Oficina que cumple funciones de Unidad Contratante en la Institución / Ente / Órgano': 'G',
  'Persona de contacto': 'H',
  'Teléfono': 'I',
  'Correo electrónico': 'J',
};

/**
 * Guarda o actualiza una entrada en la hoja de "Manual Contrataciones".
 * @param {object} formData - Los datos limpios y validados del controlador.
 * @returns {Promise<boolean>} - True si la operación fue exitosa.
 */
const saveOrUpdateManualContrataciones = async (formData) => {
  try {
    // Usamos la nueva función genérica para buscar si ya existe un registro con ese email.
    const existingEntry = await findRowByValueInColumn(
      SHEET_NAME,
      'Dirección de correo electrónico', // Nombre de la columna a buscar
      formData.emailPrincipal           // Valor a encontrar
    );

    if (existingEntry) {
      // --- SI EXISTE: ACTUALIZAMOS LA FILA ---
      const { rowIndex } = existingEntry;
      console.log(`Actualizando fila existente ${rowIndex} para ${formData.emailPrincipal}`);

      const updatePromises = [
        updateCell(SPREADSHEET_ID, SHEET_NAME, `${COLUMN_MAP['Nombre de la Institución / Ente / Órgano']}${rowIndex}`, formData.nombreInstitucion),
        updateCell(SPREADSHEET_ID, SHEET_NAME, `${COLUMN_MAP['Acrónimo y/o siglas de la Institución / Ente / Órgano']}${rowIndex}`, formData.siglasInstitucion),
        updateCell(SPREADSHEET_ID, SHEET_NAME, `${COLUMN_MAP['Nombre de la Unidad / Gerencia y/u Oficina responsable de la Gestión Administrativa y Financiera de la Institución / Ente / Órgano']}${rowIndex}`, formData.unidadGestion),
        updateCell(SPREADSHEET_ID, SHEET_NAME, `${COLUMN_MAP['Nombre de la Unidad / Gerencia y/u Oficina responsable del Área de Sistema y Tecnología de la Institución / Ente / Órgano']}${rowIndex}`, formData.unidadSistemas),
        updateCell(SPREADSHEET_ID, SHEET_NAME, `${COLUMN_MAP['Nombre de la Unidad / Gerencia y/u Oficina que cumple funciones de Unidad Contratante en la Institución / Ente / Órgano']}${rowIndex}`, formData.unidadContratante),
        updateCell(SPREADSHEET_ID, SHEET_NAME, `${COLUMN_MAP['Persona de contacto']}${rowIndex}`, formData.personaContacto),
        updateCell(SPREADSHEET_ID, SHEET_NAME, `${COLUMN_MAP['Teléfono']}${rowIndex}`, formData.telefono),
        updateCell(SPREADSHEET_ID, SHEET_NAME, `${COLUMN_MAP['Correo electrónico']}${rowIndex}`, formData.emailContacto),
      ];
      await Promise.all(updatePromises);

    } else {
      // --- SI NO EXISTE: AÑADIMOS UNA NUEVA FILA ---
      console.log(`Creando nueva fila para ${formData.emailPrincipal}`);
      const newRow = [
        new Date().toISOString(), // Marca temporal
        formData.emailPrincipal,
        formData.nombreInstitucion,
        formData.siglasInstitucion,
        formData.unidadGestion,
        formData.unidadSistemas,
        formData.unidadContratante,
        formData.personaContacto,
        formData.telefono,
        formData.emailContacto,
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
