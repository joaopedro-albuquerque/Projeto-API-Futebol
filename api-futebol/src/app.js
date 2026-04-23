const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const jogadoresRoutes = require('./routes/jogadores');
const timesRoutes = require('./routes/times');
const rodadasRoutes = require('./routes/rodadas');
const partidasRoutes = require('./routes/partidas');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const { testConnection, initDatabase } = require('./database/postgres');
const openApiSpec = require('./docs/openapi');
const { buildOpenApiSpec } = require('./docs/buildOpenApi');

const app = express();

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));
app.use(requestLogger);
app.use(express.json());

app.use('/api/jogadores', jogadoresRoutes);
app.use('/api/times', timesRoutes);
app.use('/api/rodadas', rodadasRoutes);
app.use('/api/partidas', partidasRoutes);

app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', (req, res, next) => {
  const spec = buildOpenApiSpec(openApiSpec);
  const swaggerHandler = swaggerUi.setup(spec);
  return swaggerHandler(req, res, next);
});

app.get('/api-docs.json', (req, res) => {
  const spec = buildOpenApiSpec(openApiSpec);
  res.json(spec);
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
