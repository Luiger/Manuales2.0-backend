// Import the submitForm service
const { submitForm } = require('../services/form.service');

// Define the form structure and metadata for "MANUAL CONTRATACIONES valor agregado ESCALA"
const formDefinition = [
  { name: 'Marca temporal', type: 'datetime' }, // Not visible to user, auto-filled
  { name: 'Dirección de correo electrónico', type: 'string' },
  { name: 'Nombre de la Institución / Ente / Órgano', type: 'string' },
  { name: 'Acrónimo y/o siglas de la Institución / Ente / Órgano', type: 'string' },
  { name: 'Nombre de la Unidad / Gerencia y/u Oficina responsable de la Gestión Administrativa y Financiera de la Institución / Ente / Órgano', type: 'string' },
  { name: 'Nombre de la Unidad / Gerencia y/u Oficina responsable del Área de Sistema y Tecnología de la Institución / Ente / Órgano', type: 'string' },
  { name: 'Nombre de la Unidad / Gerencia y/u Oficina que cumple funciones de Unidad Contratante en la Institución / Ente / Órgano', type: 'string' },
  { name: 'Persona de contacto', type: 'string' },
  { name: 'Teléfono', type: 'string' },
  { name: 'Correo electrónico', type: 'string' },
];

// Define the sheet name and unique identifier field for this form
const sheetName = 'MANUAL CONTRATACIONES valor agregado ESCALA';
const uniqueIdentifierField = 'Dirección de correo electrónico'; // Using email as the unique identifier

/**
 * Controller to handle the submission of the "MANUAL CONTRATACIONES" form.
 * It receives form data, validates it, and uses the submitForm service to save it to the Google Sheet.
 *
 * @param {object} req - Express request object. Expects form data in req.body.
 * @param {object} res - Express response object.
 */
const submitManualContratacionesForm = async (req, res) => {
  try {
    const { body: formData } = req; // Get the form data from the request body

    // Basic validation: Ensure the unique identifier is present in the submitted data
    if (!formData[uniqueIdentifierField]) {
      return res.status(400).json({ message: `El campo "${uniqueIdentifierField}" es requerido.` });
    }

    // Call the reusable submitForm service
    const success = await submitForm(
      process.env.SPREADSHEET_ID, // Spreadsheet ID from environment variables
      sheetName,
      formData,
      uniqueIdentifierField,
      formDefinition
    );

    if (success) {
      res.status(200).json({ message: 'Formulario enviado exitosamente.' });
    } else {
      res.status(500).json({ message: 'Error al procesar el formulario. Por favor, intente de nuevo.' });
    }

  } catch (error) {
    console.error('Error en submitManualContratacionesForm controller:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Export the controller function
module.exports = {
  submitManualContratacionesForm,
};
