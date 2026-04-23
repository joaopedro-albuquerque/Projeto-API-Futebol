const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const jogadoresRoutes = require('./routes/jogadores');
const timesRoutes = require('./routes/times');
const rodadasRoutes = require('./routes/rodadas');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const { testConnection, initDatabase } = require('./database/postgres');
const openApiSpec = require('./docs/openapi');

const app = express();

app.use(cors({
  origin: 'https://brasileirao-stats-backend.up.railway.app/',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(requestLogger);
app.use(express.json());

app.use('/api/jogadores', jogadoresRoutes);
app.use('/api/times', timesRoutes);
app.use('/api/rodadas', rodadasRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.get('/api-docs.json', (req, res) => {
  res.json(openApiSpec);
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await testConnection();
  await initDatabase();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
