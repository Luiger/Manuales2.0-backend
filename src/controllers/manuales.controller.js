const manualesService = require('../services/manuales.service');
const { findRowByValueInColumn } = require('../services/sheets.service');

const SHEET_NAME = 'MANUAL CONTRATACIONES valor agregado ESCALA';

const submitManualContratacionesForm = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const formData = req.body;

    if (!formData['Dirección de correo electrónico'] || !formData['Persona de contacto']) {
      return res.status(400).json({ message: 'Faltan campos requeridos en el formulario.' });
    }

    const success = await manualesService.saveOrUpdateManualContrataciones(formData, userEmail);

    if (success) {
      return res.status(200).json({ success: true, message: 'Formulario procesado exitosamente.' });
    } else {
      return res.status(500).json({ success: false, error: 'Error al guardar los datos.' });
    }
  } catch (error) {
    console.error('Error en submitManualContratacionesForm:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const checkSubmissionStatus = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const existingSubmission = await findRowByValueInColumn(
      SHEET_NAME,
      'UsuarioRegistradoEmail',
      userEmail
    );

    if (existingSubmission && existingSubmission.user.Llenado === 'TRUE') {
      return res.status(200).json({ hasSubmitted: true });
    } else {
      return res.status(200).json({ hasSubmitted: false });
    }
  } catch (error) {
    console.error('Error en checkSubmissionStatus:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = {
  submitManualContratacionesForm,
  checkSubmissionStatus,
};
