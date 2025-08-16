require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Importamos cors

// Importamos las rutas existentes y las nuevas
const authRoutes = require('./src/routes/auth.routes'); // Rutas de autenticación
// Importamos las nuevas rutas de formularios
const manualesRoutes = require('./src/routes/manuales.routes');
const userRoutes = require('./src/routes/user.routes'); // Rutas de usuario
const aiRoutes = require('./src/routes/ai.routes');
const redirectRoutes = require('./src/routes/redirect.routes')

const app = express();
const port = process.env.PORT || 3000;

// --- Middlewares ---
// Habilitamos CORS para permitir peticiones desde el frontend
app.use(cors());
// Habilitamos el parseo de JSON que ya estaba
app.use(express.json());

// --- Rutas ---
// Añadimos la nueva ruta para la autenticación
app.use('/api/auth', authRoutes);
// Añadimos las rutas para el formula  rio de "Manual de Contrataciones"
app.use('/api/manuales', manualesRoutes);
// Añadimos las nuevas rutas de usuario
app.use('/api/user', userRoutes);
// Añadimos las rutas del chatbot de IA
app.use('/api/ai', aiRoutes);
// Añadimos las rutas de redirección
app.use('/api/redirect', redirectRoutes);

// Ruta de bienvenida para verificar que el servidor funciona
app.get('/', (req, res) => {
  res.send('El backend de Manuales 2.0 está funcionando!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
