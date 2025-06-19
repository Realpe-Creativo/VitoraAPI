// graphql/resolvers.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Usuario, Debt, OrdenPago, Cliente, Transaccion, EstadoTransaccion, OrdenCargue } = require('../models');
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

    // Lista todas las deudas en la tabla `deudas`
    debts: async () => {
      const rows = await Debt.findAll();
      return rows.map(d => ({
        id: d.id,
        amount: d.amount,
        date: d.date.toISOString().split('T')[0], // --> "YYYY-MM-DD"
        concept: d.concept,
        paymentUrl: d.paymentUrl
      }));
    },

    // Devuelve una sola deuda por su ID
    debt: async (_, { id }) => {
      const d = await Debt.findByPk(id);
      if (!d) return null;
      return {
        id: d.id,
        amount: d.amount,
        date: d.date.toISOString().split('T')[0],
        concept: d.concept,
        paymentUrl: d.paymentUrl
      };
    },

    ordenesPago: async () => {
      try {
        // Retorna todas las órdenes, puedes ordenar por fecha si quieres:
        const lista = await OrdenPago.findAll({
          order: [['fecha_creacion', 'DESC']],
        });

        return lista;
      } catch (error) {
        console.error('Error en resolver ordenesPago:', error);
        throw new Error('No se pudieron cargar las órdenes de pago');
      }
    },
    clientes: async () => {
      return await Cliente.findAll();
    },
    cliente: async (_parent, { id }) => {
      return await Cliente.findByPk(id);
    },
  },

  Cliente: {
    // Este campo enlaza cada Cliente con sus Órdenes de Pago
    ordenesPago: async (parent) => {
      return await OrdenPago.findAll({
        where: { cliente_id: parent.id }
      });
    }
  },

  // **Resolvers de campo** para OrdenPago:
  OrdenPago: {
    fecha_creacion: (orden) => {
      const ms = Number(orden.fecha_creacion);
      return new Date(ms).toISOString();
    },

    fecha_vencimiento: (orden) => {
      const ms = Number(orden.fecha_vencimiento);
      return new Date(ms).toISOString();
    },

    // Relación con Cliente por cliente_id
    cliente: async (orden) => {
      return await Cliente.findByPk(orden.cliente_id);
    },

    // Último intento de pago: la transacción más reciente para esta orden
    ultimo_intento_pago: async (orden) => {
      return await Transaccion.findOne({
        where: { id_orden_pago: orden.order_id },
      });
    },

    usuario_cargue: async (orden) => {
      let userId = null;

      if (orden.forma_cargue === 'manual') {
        userId = orden.usuario_crea_manual;
      } else if (orden.forma_cargue === 'archivo' && orden.orden_cargue_archivo) {
        const ordenCargue = await OrdenCargue.findByPk(orden.orden_cargue_archivo);
        if (ordenCargue) {
          userId = ordenCargue.usuario_que_cargo;
        }
      }

      if (!userId) return null;

      const user = await Usuario.findByPk(userId, {
        attributes: ['id_user', 'email', 'nombre']
      });

      return user
        ? {
          id: user.id_user,
          nombre: user.nombre,
          email: user.email
        }
        : null;
    }
  },

  Transaccion: {
    // tus mapeos anteriores…
    id_transaccion: tx => tx.id_transaccion.toString(),
    id_orden_pago: tx => tx.id_orden_pago.toString(),
    ultimo_estado: tx => tx.ultimo_estado?.toString(),
    valor_de_pago: tx => tx.valor_de_pago?.toString(),

    // <-- aquí el nuevo resolver:
    estados: async (tx) => {
      return await EstadoTransaccion.findAll({
        where: { id_transaccion: tx.id_transaccion },
        order: [['id_estado', 'ASC']]   // opcional: orden cronológico
      });
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

    // Crea una nueva deuda en la tabla de Sequelize
    createDebt: async (_, { amount, date, concept, paymentUrl }, ctx) => {
      // Si deseas que solo usuarios autenticados puedan crear:
      // if (!ctx.tokenUserId) {
      //   throw new Error('No autenticado');
      // }

      const newDebt = await Debt.create({
        amount,
        date,         // Sequelize convierte "YYYY-MM-DD" a Date
        concept,
        paymentUrl    // Sequelize asigna al campo payment_url
      });

      return {
        id: newDebt.id,
        amount: newDebt.amount,
        date: newDebt.date.toISOString().split('T')[0],
        concept: newDebt.concept,
        paymentUrl: newDebt.paymentUrl
      };
    }
  }
};

module.exports = resolvers;
