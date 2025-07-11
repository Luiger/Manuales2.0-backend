// --- Explicación del Archivo ---
// Este controlador maneja la lógica para recibir y validar los datos del formulario
// de "Manual de Contrataciones". Sigue las buenas prácticas del auth.controller.

const manualesService = require('../services/manuales.service');

const submitManualContratacionesForm = async (req, res) => {
  try {
    // 1. Destructuramos explícitamente los campos esperados del body.
    // Usamos los nombres largos que envía el frontend.
    const {
      'Dirección de correo electrónico': emailPrincipal,
      'Nombre de la Institución / Ente / Órgano': nombreInstitucion,
      'Acrónimo y/o siglas de la Institución / Ente / Órgano': siglasInstitucion,
      'Nombre de la Unidad / Gerencia y/u Oficina responsable de la Gestión Administrativa y Financiera de la Institución / Ente / Órgano': unidadGestion,
      'Nombre de la Unidad / Gerencia y/u Oficina responsable del Área de Sistema y Tecnología de la Institución / Ente / Órgano': unidadSistemas,
      'Nombre de la Unidad / Gerencia y/u Oficina que cumple funciones de Unidad Contratante en la Institución / Ente / Órgano': unidadContratante,
      'Persona de contacto': personaContacto,
      'Teléfono': telefono,
      'Correo electrónico': emailContacto,
    } = req.body;

    // 2. Validación de campos obligatorios.
    if (!emailPrincipal || !nombreInstitucion || !personaContacto) {
      return res.status(400).json({ message: 'Los campos "Correo electrónico", "Nombre de Institución" y "Persona de contacto" son requeridos.' });
    }

    // 3. Creamos un objeto de datos limpio para enviar al servicio.
    // Esto evita que se filtren campos no deseados al servicio.
    const formData = {
      emailPrincipal,
      nombreInstitucion,
      siglasInstitucion: siglasInstitucion || '', // Aseguramos que los opcionales sean strings vacíos
      unidadGestion: unidadGestion || '',
      unidadSistemas: unidadSistemas || '',
      unidadContratante: unidadContratante || '',
      personaContacto,
      telefono: telefono || '',
      emailContacto: emailContacto || '',
    };

    // 4. Llamamos a la función específica del servicio.
    const success = await manualesService.saveOrUpdateManualContrataciones(formData);

    if (success) {
      return res.status(200).json({ success: true, message: 'Formulario procesado exitosamente.' });
    } else {
      return res.status(500).json({ success: false, error: 'Error al guardar los datos en la hoja de cálculo.' });
    }

  } catch (error) {
    console.error('Error en el controlador submitManualContratacionesForm:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = {
  submitManualContratacionesForm,
};
