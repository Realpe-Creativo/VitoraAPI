// index.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const http = require('http');
const { ApolloServer } = require('apollo-server-express');
require('./cron/cronIndex');

dotenv.config();

const { testConnection, sequelize } = require('./config/database');
const { syncModels } = require('./models');
require('./models');

const routes = require('./routes');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');

const app = express();
const PORT = process.env.PORT || 3000;

// —————— Middlewares generales ——————
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use((req, _res, next) => {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload;
    } catch (err) { /* si falla, seguimos sin req.user */ }
  }
  next();
});

async function initializeApp() {
  try {
    // 1) Conexión a DB
    await testConnection();
    // 2) Sincronizar modelos
    await syncModels();

    // 3) Crear y arrancar ApolloServer
    const apollo = new ApolloServer({
      typeDefs,
      resolvers,
      context: ({ req }) => ({ tokenUserId: req.user?.id }),
      introspection: true,
      playground: true
    });
    await apollo.start();
    apollo.applyMiddleware({ app, path: '/graphql' });

    // 4) Rutas REST
    app.use('/api', routes);
    app.get('/', (req, res) => {
      res.json({ message: 'Welcome to the Payment Management API', version: '1.0.0' });
    });

    // 5) Middlewares de error
    app.use(notFound);
    app.use(errorHandler);

    // 6) Levantar HTTP server
    const httpServer = http.createServer(app);
    httpServer.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`✅ GraphQL ready at http://localhost:${PORT}/graphql`);
    });
  } catch (err) {
    console.error('❌ Failed to initialize app:', err);
    process.exit(1);
  }
}

initializeApp();
