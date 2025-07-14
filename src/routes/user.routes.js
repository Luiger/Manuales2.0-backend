const { Router } = require('express');
const {
  getProfile,
  updateProfile,
  verifyPasswordController,
  changePasswordController
} = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = Router();

// Todas las rutas de perfil requieren que el usuario esté autenticado.
router.use(authenticateToken);

// Obtener y actualizar perfil
router.route('/profile')
  .get(getProfile)
  .put(updateProfile);

// Cambiar contraseña
router.post('/password/verify', verifyPasswordController);
router.put('/password/change', changePasswordController);

module.exports = router;
