const userService = require('../services/user.service');

const getProfile = async (req, res) => {
  try {
    const profile = await userService.getProfileByEmail(req.user.email);
    if (!profile) {
      return res.status(404).json({ message: 'Perfil no encontrado.' });
    }
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { Nombre, Apellido, Telefono, Institucion, Cargo } = req.body;
    if (!Nombre || !Apellido || !Telefono || !Institucion || !Cargo) {
      // Si algún campo viene vacío, se rechaza la petición.
      return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }
    // Llama al servicio y espera el resultado
    const success = await userService.updateProfileByEmail(req.user.email, req.body);
    if (!success) {
      return res.status(404).json({ message: 'Usuario no encontrado para actualizar.' });
    }
    res.json({ success: true, message: 'Perfil actualizado exitosamente.' });
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Controlador para obtener todos los usuarios
const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Controlador para actualizar el rol de un usuario
const updateUserRole = async (req, res) => {
  try {
    const { email, newRole } = req.body;
    const success = await userService.updateUserRole(email, newRole);
    if (!success) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    res.json({ success: true, message: 'Rol actualizado exitosamente.' });
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const verifyPasswordController = async (req, res) => {
  try {
    const { currentPassword } = req.body;
    if (!currentPassword) {
      return res.status(400).json({ message: 'La contraseña actual es requerida.' });
    }
    const isMatch = await userService.verifyCurrentPassword(req.user.email, currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'La contraseña actual es incorrecta.' });
    }
    res.json({ success: true, message: 'Contraseña verificada.' });
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const changePasswordController = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ message: 'La nueva contraseña es requerida.' });
    }
    // Llama al servicio y espera el resultado
    const result = await userService.changePassword(req.user.email, newPassword);

    if (result.success) {
      res.json({ success: true, message: 'Contraseña cambiada exitosamente.' });
    } else {
      // Si la contraseña es la misma, envía un error 409 (Conflicto)
      res.status(409).json({ success: false, message: result.error });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};
module.exports = {
  getProfile,
  updateProfile,
  verifyPasswordController,
  changePasswordController,
  getAllUsers,
  updateUserRole,
};
