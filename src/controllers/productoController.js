const { Producto, ProductoVariante, ProductoFaq, ProductoSeccionExtra, ProductoShort, sequelize } = require('../models');

const INCLUDE_ALL = [
  { model: ProductoVariante, as: 'variantes', order: [['orden', 'ASC']] },
  { model: ProductoFaq, as: 'faqs', order: [['orden', 'ASC']] },
  { model: ProductoSeccionExtra, as: 'secciones_extra', order: [['orden', 'ASC']] },
  { model: ProductoShort, as: 'shorts', order: [['orden', 'ASC']] }
];

// GET /productos
const listar = async (req, res) => {
  try {
    const { activo } = req.query;
    const where = {};
    if (activo !== undefined) where.activo = activo === 'true';

    const productos = await Producto.findAll({
      where,
      include: INCLUDE_ALL,
      order: [['orden', 'ASC']]
    });
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /productos/:id
const obtener = async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id, { include: INCLUDE_ALL });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /productos
const crear = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { variantes = [], faqs = [], secciones_extra = [], shorts = [], ...datos } = req.body;

    const producto = await Producto.create(datos, { transaction: t });

    if (variantes.length) {
      await ProductoVariante.bulkCreate(
        variantes.map((v, i) => ({ ...v, producto_id: producto.id, orden: i })),
        { transaction: t }
      );
    }
    if (faqs.length) {
      await ProductoFaq.bulkCreate(
        faqs.map((f, i) => ({ ...f, producto_id: producto.id, orden: i })),
        { transaction: t }
      );
    }
    if (secciones_extra.length) {
      await ProductoSeccionExtra.bulkCreate(
        secciones_extra.map((s, i) => ({ ...s, producto_id: producto.id, orden: i })),
        { transaction: t }
      );
    }
    if (shorts.length) {
      await ProductoShort.bulkCreate(
        shorts.map((url, i) => ({ url, producto_id: producto.id, orden: i })),
        { transaction: t }
      );
    }

    await t.commit();
    const resultado = await Producto.findByPk(producto.id, { include: INCLUDE_ALL });
    res.status(201).json(resultado);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
};

// PUT /productos/:id
const actualizar = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const producto = await Producto.findByPk(req.params.id, { transaction: t });
    if (!producto) {
      await t.rollback();
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const { variantes, faqs, secciones_extra, shorts, ...datos } = req.body;

    await producto.update(datos, { transaction: t });

    // Reemplaza colecciones si vienen en el body
    if (variantes !== undefined) {
      await ProductoVariante.destroy({ where: { producto_id: producto.id }, transaction: t });
      if (variantes.length) {
        await ProductoVariante.bulkCreate(
          variantes.map((v, i) => ({ ...v, producto_id: producto.id, orden: i })),
          { transaction: t }
        );
      }
    }
    if (faqs !== undefined) {
      await ProductoFaq.destroy({ where: { producto_id: producto.id }, transaction: t });
      if (faqs.length) {
        await ProductoFaq.bulkCreate(
          faqs.map((f, i) => ({ ...f, producto_id: producto.id, orden: i })),
          { transaction: t }
        );
      }
    }
    if (secciones_extra !== undefined) {
      await ProductoSeccionExtra.destroy({ where: { producto_id: producto.id }, transaction: t });
      if (secciones_extra.length) {
        await ProductoSeccionExtra.bulkCreate(
          secciones_extra.map((s, i) => ({ ...s, producto_id: producto.id, orden: i })),
          { transaction: t }
        );
      }
    }
    if (shorts !== undefined) {
      await ProductoShort.destroy({ where: { producto_id: producto.id }, transaction: t });
      if (shorts.length) {
        await ProductoShort.bulkCreate(
          shorts.map((url, i) => ({ url, producto_id: producto.id, orden: i })),
          { transaction: t }
        );
      }
    }

    await t.commit();
    const resultado = await Producto.findByPk(producto.id, { include: INCLUDE_ALL });
    res.json(resultado);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
};

// DELETE /productos/:id
const eliminar = async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    await producto.destroy();
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { listar, obtener, crear, actualizar, eliminar };
