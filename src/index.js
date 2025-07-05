require('dotenv').config();
const express = require('express');
const formRoutes = require('./routes/form.routes');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use('/api/form', formRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
