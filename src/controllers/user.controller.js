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
    const success = await userService.updateProfileByEmail(req.user.email, req.body);
    if (!success) {
      return res.status(404).json({ message: 'Usuario no encontrado para actualizar.' });
    }
    res.json({ success: true, message: 'Perfil actualizado exitosamente.' });
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
        await userService.changePassword(req.user.email, newPassword);
        res.json({ success: true, message: 'Contraseña cambiada exitosamente.' });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

module.exports = {
  getProfile,
  updateProfile,
  verifyPasswordController,
  changePasswordController,
};
