const manualesService = require('../services/manuales.service');
const manualExpressService = require('../services/manualExpress.service');
const { findRowByValueInColumn } = require('../services/sheets.service');

const SHEET_NAME = 'MANUAL CONTRATACIONES valor agregado ESCALA';

const submitManualContratacionesForm = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const formData = req.body;

    if (!formData['Dirección de correo electrónico']) {
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

// --- NUEVO CONTROLLER ---
const submitManualExpressForm = async (req, res) => {
  try {
    const userEmail = req.user.email;

    // ✅ VERIFICACIÓN CONDICIONAL
    // Solo si la variable de entorno está en 'true', hacemos la validación.
    if (process.env.ENABLE_SINGLE_SUBMISSION_CHECK === 'true') {
      const existingSubmission = await findRowByValueInColumn('CONCURSO ABIERTO SIMINISTRO DE BIENES ESCALA', 'UsuarioRegistradoEmail', userEmail);
      if (existingSubmission) {
        return res.status(403).json({ success: false, error: 'Ya has llenado este formulario.' });
      }
    }
    
    // El resto de la lógica para guardar los datos continúa igual...
    const formData = req.body;
    const success = await manualExpressService.saveOrUpdateManualExpress(formData, userEmail);
    if (success) {
      return res.status(200).json({ success: true, message: 'Formulario Express procesado exitosamente.' });
    } else {
      return res.status(500).json({ success: false, error: 'Error al guardar los datos.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const checkExpressSubmissionStatus = async (req, res) => {
  try {
    const isRestrictionActive = process.env.ENABLE_SINGLE_SUBMISSION_CHECK === 'true';
    let hasSubmitted = false;

    // Si la restricción está activa, verificamos en la base de datos.
    if (isRestrictionActive) {
      const userEmail = req.user.email;
      const existingSubmission = await findRowByValueInColumn('CONCURSO ABIERTO SIMINISTRO DE BIENES ESCALA', 'UsuarioRegistradoEmail', userEmail);
      if (existingSubmission && existingSubmission.user.Llenado === 'TRUE') {
        hasSubmitted = true;
      }
    }
    
    // ✅ Le informamos al frontend si la restricción está activa y si el usuario ya ha enviado.
    return res.status(200).json({ isRestrictionActive, hasSubmitted });

  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = {
  submitManualContratacionesForm,
  checkSubmissionStatus,
  submitManualExpressForm, // <-- NUEVO
  checkExpressSubmissionStatus, // <-- NUEVO
};