const { Router } = require('express');
const {
  getProfile,
  updateProfile,
  verifyPasswordController,
  changePasswordController,
  getAllUsers,
  updateUserRole
} = require('../controllers/user.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth.middleware');

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

// --- RUTAS SOLO PARA ADMINS ---
// Estas rutas requieren un token válido Y que el rol sea 'Admin'
router.get('/admin/users', [authenticateToken, isAdmin], getAllUsers);
router.put('/admin/role', [authenticateToken, isAdmin], updateUserRole);

module.exports = router;
