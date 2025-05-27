// database.js
const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

// En producción: Postgres “normal” desde variables de entorno
// En desarrollo/test: SQLite local
const sequelize = isProd
  ? new Sequelize(
      process.env.DB_NAME,        // nombre de la base de datos
      process.env.DB_USER,        // usuario
      process.env.DB_PASSWORD,    // contraseña
      {
        host: process.env.DB_HOST,   // host en la nube
        port: process.env.DB_PORT,   // puerto (p.ej. 5432)
        dialect: 'postgres',
        logging: false,              // desactiva logs en prod
        dialectOptions: process.env.DB_SSL === 'true' ? {
          ssl: {
            require: true,
            rejectUnauthorized: false, // si tu proveedor usa certificado auto-firmado
          },
        } : {},
      }
    )
  : new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '../../database.sqlite'),
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
    });

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(
      `Conexión ${
        isProd ? 'Postgres' : 'SQLite'
      } establecida correctamente.`
    );
  } catch (err) {
    console.error('❌  No se pudo conectar a la base de datos:', err);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  testConnection,
};
