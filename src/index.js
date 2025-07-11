require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Importamos cors

// Importamos las rutas existentes y las nuevas
const formRoutes = require('./routes/form.routes');
const authRoutes = require('./routes/auth.routes'); // Nuevas rutas de autenticación
// Importamos las nuevas rutas de formularios
const form2Routes = require('./routes/form2.routes');

const manualesRoutes = require('./routes/manuales.routes');

const app = express();
const port = process.env.PORT || 3000;

// --- Middlewares ---
// Habilitamos CORS para permitir peticiones desde el frontend
app.use(cors());
// Habilitamos el parseo de JSON que ya estaba
app.use(express.json());

// --- Rutas ---
// Mantenemos la ruta existente para los formularios
app.use('/api/form', formRoutes);
// Añadimos la nueva ruta para la autenticación
app.use('/api/auth', authRoutes);
// Registramos las nuevas rutas bajo un prefijo común para formularios
app.use('/api/forms', form2Routes);
// Añadimos las rutas para el formulario de "Manual de Contrataciones"
app.use('/api/manuales', manualesRoutes);

// Ruta de bienvenida para verificar que el servidor funciona
app.get('/', (req, res) => {
  res.send('El backend de Manuales 2.0 está funcionando!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
