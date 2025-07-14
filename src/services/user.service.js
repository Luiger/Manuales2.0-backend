const bcrypt = require('bcryptjs');
const { findUserByEmail, updateCell } = require('./sheets.service');

// Columnas relevantes en la hoja "Login"
const COLUMNS = {
  NOMBRE: 'D',
  APELLIDO: 'E',
  TELEFONO: 'F',
  INSTITUCION: 'G',
  CARGO: 'H',
  PASSWORD: 'C',
};

/**
 * Obtiene los datos del perfil de un usuario por su email.
 * @param {string} email - El email del usuario.
 * @returns {Promise<object|null>}
 */
const getProfileByEmail = async (email) => {
  const result = await findUserByEmail(email);
  if (!result) return null;

  const { user } = result;
  // ✅ CORRECCIÓN: Nos aseguramos de devolver TODOS los campos necesarios.
  return {
    Nombre: user.Nombre,
    Apellido: user.Apellido,
    Telefono: user.Telefono,
    Institucion: user.Institucion,
    Cargo: user.Cargo,
    Email: user.Usuario,
  };
};

/**
 * Actualiza los datos del perfil de un usuario.
 * @param {string} email - El email del usuario a actualizar.
 * @param {object} profileData - Objeto con los nuevos datos.
 * @returns {Promise<boolean>}
 */
const updateProfileByEmail = async (email, profileData) => {
  const result = await findUserByEmail(email);
  if (!result) return false;

  const { rowIndex } = result;
  
  const updatePromises = [
    updateCell(process.env.SPREADSHEET_ID, 'Login', `${COLUMNS.NOMBRE}${rowIndex}`, profileData.Nombre),
    updateCell(process.env.SPREADSHEET_ID, 'Login', `${COLUMNS.APELLIDO}${rowIndex}`, profileData.Apellido),
    updateCell(process.env.SPREADSHEET_ID, 'Login', `${COLUMNS.TELEFONO}${rowIndex}`, profileData.Telefono),
    updateCell(process.env.SPREADSHEET_ID, 'Login', `${COLUMNS.INSTITUCION}${rowIndex}`, profileData.Institucion),
    updateCell(process.env.SPREADSHEET_ID, 'Login', `${COLUMNS.CARGO}${rowIndex}`, profileData.Cargo),
  ];
  
  await Promise.all(updatePromises);
  return true;
};

/**
 * Verifica la contraseña actual de un usuario.
 * @param {string} email - El email del usuario.
 * @param {string} currentPassword - La contraseña actual a verificar.
 * @returns {Promise<boolean>}
 */
const verifyCurrentPassword = async (email, currentPassword) => {
    const result = await findUserByEmail(email);
    if (!result) return false;
    
    return bcrypt.compareSync(currentPassword, result.user.Contraseña);
};

/**
 * Cambia la contraseña de un usuario.
 * @param {string} email - El email del usuario.
 * @param {string} newPassword - La nueva contraseña.
 * @returns {Promise<boolean>}
 */
const changePassword = async (email, newPassword) => {
    const result = await findUserByEmail(email);
    if (!result) return false;

    const { rowIndex } = result;
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    await updateCell(process.env.SPREADSHEET_ID, 'Login', `${COLUMNS.PASSWORD}${rowIndex}`, hashedPassword);
    return true;
};

module.exports = {
  getProfileByEmail,
  updateProfileByEmail,
  verifyCurrentPassword,
  changePassword,
};
