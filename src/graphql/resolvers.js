// graphql/resolvers.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Usuario, Cliente, Transaccion, EstadoTransaccion, OrdenCargue } = require('../models');
const { Op } = require('sequelize');
require('dotenv').config();

const resolvers = {
  Query: {
    // Devuelve el usuario según el ID extraído del token JWT (ctx.tokenUserId)
    me: async (_, __, ctx) => {
      if (!ctx.tokenUserId) return null;

      // Busca al usuario en Sequelize por PK
      const user = await Usuario.findByPk(ctx.tokenUserId, {
        attributes: ['id_user', 'email', 'nombre']
      });
      if (!user) return null;

      return {
        id: user.id_user,
        email: user.email,
        nombre: user.nombre
      };
    },
    clientes: async () => {
      return await Cliente.findAll();
    },
    cliente: async (_parent, { id }) => {
      return await Cliente.findByPk(id);
    },
    transacciones: async (_, { fecha }) => {
      const whereEstado = {};

      if (fecha) {
        const [year, month, day] = fecha.split('-').map(Number);
        const startOfDay = new Date(Date.UTC(year, month - 1, day));
        const endOfDay = new Date(Date.UTC(year, month - 1, day + 1));

        whereEstado.fecha_hora_estado = {
          [Op.gte]: startOfDay,
          [Op.lt]: endOfDay
        };
      }

      const transacciones = await Transaccion.findAll({
        include: [
          {
            model: EstadoTransaccion,
            as: 'estados',
            where: whereEstado,
            order: [['id_estado', 'ASC']]
          },
          {
            include: ['cliente']
          }
        ]
      });

      // 🔁 Post-procesar para convertir timestamps a ISO strings
      return transacciones.map(tx => {
        // Clonar estados para evitar modificar referencias internas
        const estados = tx.estados?.map(est => ({
          ...est.get({ plain: true }),
          fecha_hora_estado: new Date(est.fecha_hora_estado).toISOString()
        })) || [];

        const estadoActual = estados[estados.length - 1] || null;

        return {
          ...tx.get({ plain: true }),
          estados,
          estadoActual
        };
      });
    }
  },

  Transaccion: {
    id_transaccion: tx => tx.id_transaccion.toString(),
    id_orden_pago: tx => tx.id_orden_pago.toString(),
    ultimo_estado: tx => tx.ultimo_estado?.toString(),
    valor_de_pago: tx => tx.valor_de_pago?.toString(),

    estados: async (tx) => {
      const estados = await EstadoTransaccion.findAll({
        where: { id_transaccion: tx.id_transaccion },
        order: [['id_estado', 'ASC']]
      });

      return estados.map(est => {
        const plain = est.get({ plain: true });
        return {
          ...plain,
          fecha_hora_estado: new Date(plain.fecha_hora_estado).toISOString()
        };
      });
    },

    estadoActual: async (tx) => {
      if (!tx.ultimo_estado) return null;

      const estado = await EstadoTransaccion.findByPk(tx.ultimo_estado);
      if (!estado) return null;

      const plain = estado.get({ plain: true });

      return {
        ...plain,
        fecha_hora_estado: new Date(plain.fecha_hora_estado).toISOString()
      };
    }
  },

  Mutation: {
    // Login: recibe email + password, compara con Sequelize + bcrypt, retorna JWT
    login: async (_, { email, password }) => {
      const user = await Usuario.findOne({ where: { email } });
      if (!user) {
        throw new Error('Credenciales inválidas');
      }

      // validPassword es el método que definiste en el modelo Usuario
      const isValid = await user.validPassword(password);
      if (!isValid) {
        throw new Error('Credenciales inválidas');
      }

      // Payload mínimo que incluimos en el JWT
      const payload = {
        id: user.id_user,
        email: user.email,
        nombre: user.nombre
      };

      // Firmamos el token
      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION || '1d' }
      );

      return {
        token,
        user: {
          id: user.id_user,
          email: user.email,
          nombre: user.nombre
        }
      };
    },
  }
};

module.exports = resolvers;
