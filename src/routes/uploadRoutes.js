const express = require('express');
const multer = require('multer');
const path = require('path');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { s3, BUCKET } = require('../config/s3');
const { authenticateToken } = require('../middlewares/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|avif/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
                allowed.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error('Solo se permiten imágenes'));
  }
});

const router = express.Router();

router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });

  const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const filename = unique + path.extname(req.file.originalname).toLowerCase();

  try {
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: `img/products/${filename}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }));

    const base = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    res.json({ url: `${base}/img/products/${filename}` });
  } catch (err) {
    res.status(500).json({ error: 'Error subiendo la imagen' });
  }
});

module.exports = router;
