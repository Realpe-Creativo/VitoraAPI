/**
 * Seed: migra los productos del frontend a la base de datos.
 * Uso: node src/seeds/productoSeed.js
 */
require('dotenv').config();
const { syncModels, Producto, ProductoVariante, ProductoFaq, ProductoSeccionExtra, ProductoShort, sequelize } = require('../models');

const productos = [
  {
    id: '1',
    nombre: 'Citrato de Magnesio Polvo x 250gr',
    nombre_corto: 'Citrato de Magnesio',
    precio: 49900,
    moneda: 'COP',
    categoria: 'Nutrición',
    descripcion: 'Nuestro Citrato de Magnesio ofrece una forma altamente biodisponible de magnesio, ideal para apoyar la función muscular, la energía diaria, el sueño reparador y el equilibrio emocional. <br> Su textura fina y sin sabor lo convierte en un suplemento suave, versátil y fácil de integrar a tu rutina diaria, ya sea en mezclas calientes o frías.',
    imagenes: {
      main: '/img/products/citrato_1.png',
      hover: '/img/products/citrato_2.png',
      gallery: ['/img/products/citrato_1.png', '/img/products/citrato_2.png'],
      miniBanner: '/img/products/banner_citrato.png',
      url_img: 'https://res.cloudinary.com/dbwojwe12/image/upload/q_auto/f_auto/v1775664457/citrato_1.png_nx4oje.png'
    },
    beneficios: [
      'Mejora la calidad del sueño y favorece una relajación profunda.',
      'Ayuda a disminuir el cansancio y la fatiga.',
      'Apoya la función muscular y nerviosa.',
      'Contribuye al equilibrio del estado de ánimo.',
      'Alta biodisponibilidad: el cuerpo lo absorbe con mayor eficiencia.',
      'Sin saborizantes, sin azúcar, sin colorantes.'
    ],
    grupos_beneficios: null,
    iconos: [
      { icon: '🔊', description: 'Premium Sound' },
      { icon: '🔋', description: 'Long Battery' },
      { icon: '📶', description: 'Wireless' },
      { icon: '🎧', description: 'Comfort Fit' },
      { icon: '🛡️', description: 'Durable' }
    ],
    ids_relacionados: ['2', '3', '4'],
    activo: true,
    orden: 1,
    variantes: [
      { sku: 'WH-001-BK', nombre: 'Black', talla: 'Standard' }
    ],
    faqs: [
      { pregunta: '¿Para qué sirve el Citrato de Magnesio?', respuesta: 'Apoya el sueño, la relajación, la energía, la función muscular y el equilibrio emocional.' },
      { pregunta: '¿Por qué elegir el Citrato de Magnesio?', respuesta: 'Porque es una de las formas de magnesio con mejor absorción y menor irritación gastrointestinal.' },
      { pregunta: '¿Tiene sabor?', respuesta: 'No. Es completamente neutro.' },
      { pregunta: '¿Lo puedo mezclar con bebidas calientes?', respuesta: 'Sí, funciona tanto en preparaciones calientes como frías.' },
      { pregunta: '¿Sirve para calambres musculares?', respuesta: 'Sí. El magnesio es clave en la función muscular y ayuda a disminuir la tensión.' },
      { pregunta: '¿Lo pueden tomar hombres y mujeres?', respuesta: 'Sí, es adecuado tanto para hombres como para mujeres, salvo indicación médica específica.' }
    ],
    secciones_extra: [
      { titulo: '¿Qué hace diferente a Vitora?', contenido: '• Citrato de Magnesio de alta pureza y excelente absorción.<br/><br/>• Fórmula limpia: sin aditivos innecesarios ni mezclas que reduzcan eficacia.<br/><br/>• Calidad asegurada desde importación hasta empaque final.<br/><br/>• Procesos bajo normativa colombiana para ingredientes alimentarios. <br/><br/>• Transparencia total en origen, composición y calidad.' },
      { titulo: 'Ingredientes', contenido: 'Citrato de Magnesio (alta biodisponibilidad).<br/>Sin sabor, sin azúcar, sin conservantes.' },
      { titulo: 'Recomendaciones de conservación', contenido: '• Mantenerse en un lugar fresco, seco y alejado de la luz.<br/><br/>• Cerrar bien el envase después de cada uso.<br/><br/>• Evitar humedad para conservar su calidad.' },
      { titulo: 'Calidad y normativas', contenido: '• Producto alineado con los lineamientos del Artículo 37, literal 3, de la Resolución 2674 de 2013.<br/><br/>• Importado y empacado bajo procesos certificados para ingredientes alimentarios.<br/><br/>• Elaborado especialmente para Vitora por empresas con estándares de calidad.' },
      { titulo: 'Origen', contenido: 'Origen de la materia prima: Asia.<br/>Empacado en: Cali, Colombia.' },
      { titulo: 'Información legal', contenido: 'Importado y empacado por:<br/>Industria Colombiana de Mezclas S.A.S<br/>Cll 8 No. 42-78 – Cali, Colombia<br/><br/>Elaborado especialmente para: Vitora.' }
    ],
    shorts: [
      'https://www.youtube.com/shorts/6poO3oBeyEk',
      'https://www.youtube.com/shorts/-Xny9GYwUwg',
      'https://youtube.com/shorts/jG_UTsVRx4g?si=Qw2yh2R9awAW1CpA',
      'https://www.youtube.com/shorts/9oecOkWbTaw',
      'https://www.youtube.com/shorts/5yCjapEJADY',
      'https://www.youtube.com/shorts/2CUF-snwTmg'
    ]
  },
  {
    id: '2',
    nombre: 'Ashwagandha Polvo x 250gr',
    nombre_corto: 'Ashwagandha',
    precio: 94500,
    moneda: 'COP',
    categoria: 'Nutrición',
    descripcion: 'La Ashwagandha Vitora es un producto 100% puro, importado directamente desde la India, país de origen ancestral de esta planta adaptógena. <br>Ayuda a regular el estrés, mejorar la calidad del sueño, equilibrar el estado de ánimo y apoyar la energía diaria sin causar somnolencia. <br><br> Es suave, natural y perfecta para integrar en bebidas calientes o frías. Ideal para quienes buscan bienestar emocional y físico de forma sencilla y constante.',
    imagenes: {
      main: '/img/products/ashwagandha_2.png',
      hover: '/img/products/ashwagandha_1.png',
      gallery: ['/img/products/ashwagandha_2.png', '/img/products/ashwagandha_1.png'],
      miniBanner: '/img/products/banner_ashwagandha.png',
      url_img: 'https://res.cloudinary.com/dbwojwe12/image/upload/q_auto/f_auto/v1775664457/ashwagandha_1.png_fbaq4f.png'
    },
    beneficios: null,
    grupos_beneficios: [
      { title: 'Bienestar emocional y mental', items: ['Reduce el estrés y favorece una sensación de calma.', 'Ayuda a regular el cortisol (hormona del estrés).', 'Mejora enfoque, claridad mental y concentración.'] },
      { title: 'Sueño y relajación', items: ['Favorece un sueño más profundo y reparador.', 'Ayuda a calmar la mente en momentos de ansiedad.', 'No es sedante: equilibra el sistema nervioso de forma natural.'] },
      { title: 'Energía y rendimiento físico', items: ['Apoya niveles estables de energía durante el día.', 'Favorece la recuperación muscular y el rendimiento en ejercicio', 'Ayuda a disminuir la fatiga general.'] },
      { title: 'Equilibrio hormonal (hombres y mujeres)', items: ['Contribuye al balance del sistema endocrino.', 'Apoya la vitalidad, libido y estabilidad del estado de ánimo.'] },
      { title: 'Salud celular y longevidad', items: ['Fuente natural de compuestos antioxidantes.', 'Ayuda al cuerpo a adaptarse mejor al estrés físico y mental.', 'Favorece procesos de bienestar a largo plazo.'] }
    ],
    iconos: [
      { icon: '❤️', description: 'Heart Rate' },
      { icon: '📍', description: 'GPS Tracking' },
      { icon: '💧', description: 'Water Resistant' },
      { icon: '⚡', description: 'Fast Charge' },
      { icon: '📱', description: 'Smart Features' }
    ],
    ids_relacionados: ['1', '3', '4'],
    activo: true,
    orden: 2,
    variantes: [
      { sku: 'SW-002-S', nombre: 'Small', talla: '38mm' },
      { sku: 'SW-002-L', nombre: 'Large', talla: '42mm' }
    ],
    faqs: [
      { pregunta: '¿Para qué sirve la Ashwagandha?', respuesta: 'Para manejar el estrés, mejorar el sueño, aumentar energía y apoyar el bienestar emocional.' },
      { pregunta: '¿Es un sedante?', respuesta: 'No. Es un adaptógeno: ayuda al cuerpo a autorregularse.' },
      { pregunta: '¿Tiene sabor?', respuesta: 'La ashwagandha pura tiene un sabor herbal natural.' },
      { pregunta: '¿La pueden tomar hombres y mujeres?', respuesta: 'Sí, sus beneficios aplican para cualquier adulto.' },
      { pregunta: '¿Sirve para dormir mejor?', respuesta: 'Sí, favorece la relajación y el descanso profundo.' },
      { pregunta: '¿Ayuda al rendimiento físico?', respuesta: 'Sí, apoya energía, fuerza y recuperación muscular.' }
    ],
    secciones_extra: [
      { titulo: '¿Qué hace diferente a Vitora?', contenido: '• Ashwagandha pura, sin mezclas ni aditivos.<br/><br/>• Origen directo de India, respetando su calidad tradicional.<br/><br/>• Producto importado y empacado bajo normativa colombiana.<br/><br/>• Fórmula limpia, natural y transparente.<br/><br/>• Perfecto para el bienestar emocional, mental y físico diario.' },
      { titulo: 'Ingredientes', contenido: 'Ashwagandha pura (Withania somnifera), de origen India.<br/>Sin sabor, sin azúcar, sin aditivos.' },
      { titulo: 'Recomendaciones de conservación', contenido: '• Mantenerse en un lugar fresco, seco y alejado de la luz.<br/><br/>• Cerrar bien el envase después de cada uso.<br/><br/>• Evitar humedad para conservar su calidad.' },
      { titulo: 'Calidad y normativas', contenido: '• Producto alineado con los lineamientos del Artículo 37, literal 3, de la Resolución 2674 de 2013.<br/><br/>• Importado y empacado bajo procesos certificados para ingredientes alimentarios.<br/><br/>• Elaborado especialmente para Vitora por empresas con estándares de calidad.' },
      { titulo: 'Origen', contenido: 'Origen de la materia prima: India.<br/>Empacado en: Cali, Colombia.' },
      { titulo: 'Información legal', contenido: 'Importado y empacado por:<br/>Industria Colombiana de Mezclas S.A.S<br/>Cll 8 No. 42-78 – Cali, Colombia<br/><br/>Elaborado especialmente para: Vitora.' }
    ],
    shorts: []
  },
  {
    id: '3',
    nombre: 'Colágeno Hidrolizado Polvo x500gr',
    nombre_corto: 'Colágeno Hidrolizado',
    precio: 79900,
    moneda: 'COP',
    categoria: 'Nutrición',
    descripcion: '<strong>¿Qué significa "Tipo I"?</strong> <br> El colágeno tipo I es el tipo de colágeno más abundante en el cuerpo humano. Es el responsable principal de la firmeza de la piel, la resistencia del cabello y uñas, y la salud de tendones y articulaciones. <br> Que sea Tipo I significa que es un colágeno de alta calidad, ideal para resultados visibles en piel y tejidos conectivos. <br><br> Nuestro colágeno hidrolizado es bovino, proveniente de cartílagos cuidadosamente seleccionados, lo cual garantiza una proteína más pura, estable y de mejor biodisponibilidad que los colágenos de menor calidad obtenidos de subproductos óseos o mezclas de fuentes. <br><br> Se absorbe fácilmente y apoya la salud de la piel, articulaciones, cabello y uñas. Una fórmula fina, ligera y sin sabor, ideal para mezclas calientes o frías, perfecta para integrar a tu rutina de bienestar.',
    imagenes: {
      main: '/img/products/colageno_1.png',
      hover: '/img/products/colageno_2.png',
      gallery: ['/img/products/colageno_1.png', '/img/products/colageno_2.png'],
      miniBanner: '/img/products/banner_colageno.png',
      url_img: 'https://res.cloudinary.com/dbwojwe12/image/upload/q_auto/f_auto/v1775664457/colageno_1.png_dio4rg.png'
    },
    beneficios: [
      'Apoya la firmeza y elasticidad de la piel.',
      'Contribuye al cuidado de articulaciones, tendones y ligamentos.',
      'Mejora la resistencia del cabello y fortalece las uñas.',
      'Textura hidrolizada de fácil disolución: sin grumos y sin sabor.',
      'Ideal para mezclas calientes o frías.',
      'Bajo en calorías, sin azúcar y sin colorantes.'
    ],
    grupos_beneficios: null,
    iconos: [
      { icon: '📷', description: 'High Resolution' },
      { icon: '🎥', description: '4K Video' },
      { icon: '🔄', description: 'Stabilization' },
      { icon: '🌧️', description: 'Weather Sealed' },
      { icon: '⚡', description: 'Fast Focus' }
    ],
    ids_relacionados: ['1', '2', '4'],
    activo: true,
    orden: 3,
    variantes: [
      { sku: 'CAM-003-B', nombre: 'Body Only' },
      { sku: 'CAM-003-K', nombre: 'Kit with Lens', precio_variante: 1599 }
    ],
    faqs: [
      { pregunta: '¿Por qué el colágeno tipo I es mejor?', respuesta: 'Porque es el más compatible con la piel, articulaciones y tejidos conectivos. Su efecto es más visible en firmeza, elasticidad y confort articular.' },
      { pregunta: '¿Qué diferencia a un colágeno derivado de cartílago?', respuesta: 'Los cartílagos aportan una proteína más pura, estable y con mayor biodisponibilidad, a diferencia de colágenos obtenidos de mezclas óseas o subproductos de menor calidad.' },
      { pregunta: '¿Tiene sabor?', respuesta: 'No. Es completamente neutro.' },
      { pregunta: '¿Lo puedo mezclar con bebidas calientes?', respuesta: 'Sí, funciona tanto en preparaciones calientes como frías.' },
      { pregunta: '¿Se puede tomar a diario?', respuesta: 'Sí. El colágeno es seguro para consumo diario en adultos.' }
    ],
    secciones_extra: [
      { titulo: '¿Qué hace diferente a Vitora?', contenido: '• Colágeno tipo I de alta pureza, proveniente de cartílagos bovinos.<br/><br/>• Mejor biodisponibilidad y absorción frente a colágenos de menor calidad.<br/><br/>• Formulación limpia: sin aditivos, rellenos ni sabores artificiales.<br/><br/>• Procesos de importación y empaque bajo normativas colombianas vigentes.<br/><br/>• Transparencia total en origen, calidad y composición.' },
      { titulo: 'Ingredientes', contenido: 'Colágeno Hidrolizado Tipo I (bovino).<br/>Sin sabor, sin azúcar, sin conservantes.' },
      { titulo: 'Recomendaciones de conservación', contenido: '• Mantenerse en un lugar fresco, seco y alejado de la luz.<br/><br/>• Cerrar bien el envase después de cada uso.<br/><br/>• Evitar humedad para conservar su calidad.' },
      { titulo: 'Calidad y normativas', contenido: '• Producto alineado con los lineamientos del Artículo 37, literal 3, de la Resolución 2674 de 2013.<br/><br/>• Importado y empacado bajo procesos certificados para ingredientes alimentarios.<br/><br/>• Elaborado especialmente para Vitora por empresas con estándares de calidad.' },
      { titulo: 'Origen', contenido: 'Origen de la materia prima: Brasil.<br/>Empacado en: Cali, Colombia.' },
      { titulo: 'Información legal', contenido: 'Importado y empacado por:<br/>Industria Colombiana de Mezclas S.A.S<br/>Cll 8 No. 42-78 – Cali, Colombia<br/><br/>Elaborado especialmente para: Vitora.' }
    ],
    shorts: []
  },
  {
    id: '4',
    nombre: 'Creatina Monohidratada Polvo x250gr',
    nombre_corto: 'Creatina Monohidratada',
    precio: 89900,
    moneda: 'COP',
    categoria: 'Nutrición',
    descripcion: 'Nuestra Creatina Monohidratada es pura y de alta biodisponibilidad. <br> Apoya el rendimiento físico, la fuerza muscular, la energía y la recuperación diaria. Su textura fina, sin sabor y de fácil disolución la hace ideal para mezclas calientes o frías. <br><br> Además, investigaciones recientes han demostrado que la creatina también tiene efectos positivos en <strong>la función cognitiva, la longevidad celular y la preservación de masa muscular</strong>, que la convierte en uno de los suplementos más completos para el bienestar diario.',
    imagenes: {
      main: '/img/products/creatina_1.png',
      hover: '/img/products/creatina_2.png',
      gallery: ['/img/products/creatina_1.png', '/img/products/creatina_2.png'],
      miniBanner: '/img/products/banner_creatina.png',
      url_img: 'https://res.cloudinary.com/dbwojwe12/image/upload/q_auto/f_auto/v1775664457/creatina_1.png_nyjok4.png'
    },
    beneficios: null,
    grupos_beneficios: [
      { title: 'Beneficios físicos', items: ['Aumenta la fuerza y el rendimiento muscular.', 'Acelera la recuperación, permitiendo entrenamientos más constantes.', 'Mejora la resistencia y la capacidad de esfuerzo.', 'Favorece la hidratación celular y el volumen muscular saludable.'] },
      { title: 'Beneficios para la longevidad', items: ['Contribuye a mantener los niveles de energía celular (ATP), un factor clave en el envejecimiento saludable.', 'Apoya la función mitocondrial, que disminuye naturalmente con la edad.', 'Favorece la preservación de la masa muscular, una de las claves más importantes de la longevidad.', 'Actúa como amortiguador energético: ayuda al cuerpo a responder mejor al estrés metabólico.'] },
      { title: 'Beneficios cognitivos', items: ['Apoya funciones como la memoria de trabajo, el razonamiento y la concentración.', 'Puede ayudar en contextos de fatiga mental o falta de sueño.', 'Favorece la claridad mental al optimizar el uso de energía en el cerebro, un órgano que consume grandes cantidades de ATP.', 'Estudios han mostrado mejoras especialmente en personas con alto nivel de estrés, veganos y adultos mayores.'] },
      { title: 'Prevención de pérdida de masa muscular', items: ['Favorece la síntesis de energía muscular, ayudando a mantener masa magra incluso en etapas de menor actividad física.', 'Es uno de los suplementos más estudiados para prevenir sarcopenia (pérdida de masa muscular relacionada con la edad).', 'Ayuda a conservar fuerza funcional (independencia): caminar, levantarse, cargar peso.', 'Mejora la capacidad para mantener rutinas de ejercicio a largo plazo, esenciales para la salud muscular.'] }
    ],
    iconos: [
      { icon: '🪑', description: 'Ergonomic' },
      { icon: '🔄', description: 'Adjustable' },
      { icon: '💨', description: 'Breathable' },
      { icon: '🎯', description: 'Supportive' },
      { icon: '⭐', description: 'Premium' }
    ],
    ids_relacionados: ['1', '2', '3'],
    activo: true,
    orden: 4,
    variantes: [
      { sku: 'CH-004-BK', nombre: 'Black' },
      { sku: 'CH-004-GY', nombre: 'Gray' }
    ],
    faqs: [
      { pregunta: '¿La creatina ayuda al cerebro?', respuesta: 'Sí. La creatina participa en la producción energética del cerebro, apoyando memoria, enfoque y claridad mental.' },
      { pregunta: '¿Sirve para longevidad?', respuesta: 'Contribuye a mantener masa muscular, energía celular y función mitocondrial, tres pilares clave del envejecimiento saludable.' },
      { pregunta: '¿Ayuda a evitar la pérdida de masa muscular?', respuesta: 'Sí. Es uno de los suplementos más estudiados para prevenir sarcopenia, especialmente útil en adultos mayores y personas con baja actividad física.' },
      { pregunta: '¿Tiene sabor?', respuesta: 'No. Es completamente neutra' },
      { pregunta: '¿Se puede mezclar con bebidas calientes o frías?', respuesta: 'Sí, su estabilidad es excelente.' },
      { pregunta: '¿La pueden tomar hombres y mujeres?', respuesta: 'Sí, es segura para cualquier adulto.' }
    ],
    secciones_extra: [
      { titulo: '¿Qué hace diferente a Vitora?', contenido: '• Creatina Monohidratada pura para mejor absorción.<br/><br/>• Fórmula limpia: sin rellenos ni aditivos.<br/><br/>• Importada y empacada bajo normativa colombiana, garantizando seguridad y transparencia.<br/><br/>• Producto apto para todo tipo de rutinas: fuerza, funcional, cardio, HIIT, pilates, cross training y más.<br/><br/>• Enfoque integral: un suplemento útil para energía, mente y envejecimiento saludable.' },
      { titulo: 'Ingredientes', contenido: 'Creatina Monohidratada pura.<br/>Sin sabor, sin azúcar, sin aditivos.' },
      { titulo: 'Recomendaciones de conservación', contenido: '• Mantenerse en un lugar fresco, seco y alejado de la luz.<br/><br/>• Cerrar bien el envase después de cada uso.<br/><br/>• Evitar humedad para conservar su calidad.' },
      { titulo: 'Calidad y normativas', contenido: '• Producto alineado con los lineamientos del Artículo 37, literal 3, de la Resolución 2674 de 2013.<br/><br/>• Importado y empacado bajo procesos certificados para ingredientes alimentarios.<br/><br/>• Elaborado especialmente para Vitora por empresas con estándares de calidad.' },
      { titulo: 'Origen', contenido: 'Origen de la materia prima: Asia.<br/>Empacado en: Cali, Colombia.' },
      { titulo: 'Información legal', contenido: 'Importado y empacado por:<br/>Industria Colombiana de Mezclas S.A.S<br/>Cll 8 No. 42-78 – Cali, Colombia<br/><br/>Elaborado especialmente para: Vitora.' }
    ],
    shorts: []
  },
  {
    id: '5',
    nombre: 'Psyllium en Polvo x250gr',
    nombre_corto: 'Psyllium en Polvo',
    precio: 52000,
    moneda: 'COP',
    categoria: 'Nutrición',
    descripcion: 'Nuestro Psyllium en polvo es una fuente natural de fibra soluble de alta pureza, ideal para apoyar la digestión, mejorar el tránsito intestinal y generar sensación de saciedad. <br><br> Al entrar en contacto con líquidos, forma un gel suave que favorece el movimiento intestinal de forma natural, sin irritar el sistema digestivo. <br><br> <strong>Su textura fina y sin sabor lo hace perfecto para mezclar en agua, jugos, batidos o preparaciones diarias</strong>.',
    imagenes: {
      main: '/img/products/psyllium_1.png',
      hover: '/img/products/psyllium_2.png',
      gallery: ['/img/products/psyllium_1.png', '/img/products/psyllium_2.png'],
      miniBanner: '/img/products/banner_creatina.png',
      url_img: 'https://res.cloudinary.com/dbwojwe12/image/upload/q_auto/f_auto/v1775664457/psyllium_1.png_nlduc3.png'
    },
    beneficios: null,
    grupos_beneficios: [
      { title: 'Salud digestiva', items: ['Apoya el tránsito intestinal de forma natural.', 'Favorece una digestión más regular y equilibrada.', 'Ayuda a mantener un intestino limpio y funcional.'] },
      { title: 'Control del apetito', items: ['Genera sensación de saciedad.', 'Puede ayudar a reducir la ingesta excesiva de alimentos.'] },
      { title: 'Bienestar general', items: ['Contribuye al equilibrio del sistema digestivo.', 'Fuente natural de fibra soluble.'] },
      { title: 'Características del producto', items: ['Alta capacidad de absorción.', 'Fácil de mezclar: textura fina y sin sabor.', 'Sin azúcar, sin colorantes, sin aditivos.'] }
    ],
    iconos: [
      { icon: '🪑', description: 'Ergonomic' },
      { icon: '🔄', description: 'Adjustable' },
      { icon: '💨', description: 'Breathable' },
      { icon: '🎯', description: 'Supportive' },
      { icon: '⭐', description: 'Premium' }
    ],
    ids_relacionados: ['1', '2', '3'],
    activo: true,
    orden: 5,
    variantes: [
      { sku: 'CH-004-BK', nombre: 'Black' },
      { sku: 'CH-004-GY', nombre: 'Gray' }
    ],
    faqs: [
      { pregunta: '¿Para qué sirve el Psyllium?', respuesta: 'Apoya la digestión, mejora el tránsito intestinal y ayuda a generar sensación de saciedad.' },
      { pregunta: '¿Cómo se consume?', respuesta: 'Se puede mezclar con agua, jugos o batidos. Siempre acompañado de suficiente líquido.' },
      { pregunta: '¿Tiene sabor?', respuesta: 'No. Es completamente neutro.' },
      { pregunta: '¿Se puede tomar todos los días?', respuesta: 'Sí, es una fuente natural de fibra apta para consumo diario en adultos.' },
      { pregunta: '¿Ayuda al estreñimiento?', respuesta: 'Sí, favorece el movimiento intestinal de forma natural.' },
      { pregunta: '¿Lo pueden tomar hombres y mujeres?', respuesta: 'Sí, es apto para cualquier adulto.' }
    ],
    secciones_extra: [
      { titulo: '¿Qué hace diferente a Vitora?', contenido: '• Psyllium de alta pureza y excelente calidad.<br/><br/>• Fórmula limpia: sin rellenos ni mezclas innecesarias.<br/><br/>• Importado y empacado bajo normativa colombiana.<br/><br/>• Transparencia total en origen, calidad y composición.<br/><br/>• Ideal para integrar fácilmente en la rutina diaria.' },
      { titulo: 'Ingredientes', contenido: 'Psyllium en polvo (Plantago ovata).<br/>Sin sabor, sin azúcar, sin aditivos.' },
      { titulo: 'Recomendaciones de conservación', contenido: '• Mantenerse en un lugar fresco, seco y alejado de la luz.<br/><br/>• Cerrar bien el envase después de cada uso.<br/><br/>• Evitar humedad para conservar su calidad.' },
      { titulo: 'Calidad y normativas', contenido: '• Producto alineado con los lineamientos del Artículo 37, literal 3, de la Resolución 2674 de 2013.<br/><br/>• Importado y empacado bajo procesos certificados para ingredientes alimentarios.<br/><br/>• Elaborado especialmente para Vitora por empresas con estándares de calidad.' },
      { titulo: 'Origen', contenido: 'Origen de la materia prima: Asia.<br/>Empacado en: Cali, Colombia.' },
      { titulo: 'Información legal', contenido: 'Importado y empacado por:<br/>Industria Colombiana de Mezclas S.A.S<br/>Cll 8 No. 42-78 – Cali, Colombia<br/><br/>Elaborado especialmente para: Vitora.' }
    ],
    shorts: []
  },
  {
    id: '6',
    nombre: 'Té Matcha en Polvo x250gr',
    nombre_corto: 'Té Matcha Premium',
    precio: 145000,
    moneda: 'COP',
    categoria: 'Nutrición',
    descripcion: 'Nuestro Té Matcha es un polvo fino de alta calidad, obtenido de hojas de té verde cuidadosamente seleccionadas.<br>A diferencia del té tradicional, aquí consumes la hoja completa, lo que aporta una fuente más concentrada de antioxidantes y energía sostenida.<br>Brinda un impulso de energía más estable, sin picos bruscos, ideal para mejorar el enfoque, la productividad y acompañar tu rutina diaria.<br>Su sabor es suave y versátil, perfecto para bebidas calientes, frías o preparaciones como smoothies y recetas.',
    imagenes: {
      main: '/img/products/matcha_1.png',
      hover: '/img/products/matcha_2.png',
      gallery: ['/img/products/matcha_1.png', '/img/products/matcha_2.png'],
      miniBanner: '/img/products/banner_creatina.png',
      url_img: 'https://res.cloudinary.com/dbwojwe12/image/upload/q_auto/f_auto/v1775664457/matcha_1.png_ngv1yb.png'
    },
    beneficios: null,
    grupos_beneficios: [
      { title: 'Energía y enfoque', items: ['Aporta energía sostenida sin picos ni caídas bruscas.', 'Favorece la concentración y claridad mental.', 'Ideal para empezar el día o mantener productividad.'] },
      { title: 'Bienestar general', items: ['Fuente natural de antioxidantes.', 'Apoya el equilibrio del cuerpo de forma natural.', 'Alternativa más estable al café.'] },
      { title: 'Estilo de vida', items: ['Perfecto para rutinas saludables.', 'Se integra fácilmente en bebidas y recetas.'] },
      { title: 'Características del producto', items: ['Polvo fino de alta calidad.', 'Fácil disolución.', 'Sin azúcar, sin colorantes, sin aditivos.'] }
    ],
    iconos: [
      { icon: '🪑', description: 'Ergonomic' },
      { icon: '🔄', description: 'Adjustable' },
      { icon: '💨', description: 'Breathable' },
      { icon: '🎯', description: 'Supportive' },
      { icon: '⭐', description: 'Premium' }
    ],
    ids_relacionados: ['1', '2', '3'],
    activo: true,
    orden: 6,
    variantes: [
      { sku: 'CH-004-BK', nombre: 'Black' },
      { sku: 'CH-004-GY', nombre: 'Gray' }
    ],
    faqs: [
      { pregunta: '¿Para qué sirve el té matcha?', respuesta: 'Aporta energía, mejora el enfoque y es una fuente natural de antioxidantes.' },
      { pregunta: '¿En qué se diferencia del té verde tradicional?', respuesta: 'En el matcha consumes la hoja completa, lo que concentra más sus propiedades naturales.' },
      { pregunta: '¿Tiene cafeína?', respuesta: 'Sí, pero su efecto es más estable y progresivo que el café.' },
      { pregunta: '¿Se puede tomar todos los días?', respuesta: 'Sí, es ideal para consumo diario en adultos.' },
      { pregunta: '¿Tiene sabor fuerte?', respuesta: 'Tiene un sabor herbal suave, fácil de combinar en bebidas.' },
      { pregunta: '¿Se puede preparar frío o caliente?', respuesta: 'Sí, funciona perfectamente en ambas opciones.' }
    ],
    secciones_extra: [
      { titulo: '¿Qué hace diferente a Vitora?', contenido: '• Matcha de alta pureza y calidad seleccionada.<br/><br/>• Hoja completa molida: mayor concentración natural.<br/><br/>• Fórmula limpia: sin rellenos ni mezclas.<br/><br/>• Importado y empacado bajo normativa colombiana.<br/><br/>• Transparencia total en origen y composición.' },
      { titulo: 'Ingredientes', contenido: 'Té Matcha en polvo (Camellia sinensis).<br/>Sin azúcar, sin conservantes, sin aditivos.' },
      { titulo: 'Recomendaciones de conservación', contenido: '• Mantener en un lugar fresco, seco y protegido de la luz.<br/><br/>• Cerrar bien el envase después de cada uso.<br/><br/>• Evitar humedad para conservar su calidad.' },
      { titulo: 'Calidad y normativas', contenido: '• Producto acogido al Artículo 37, literal 3, de la Resolución 2674 de 2013.<br/><br/>• Importado y empacado bajo procesos certificados para ingredientes alimentarios.<br/><br/>• Elaborado especialmente para Vitora bajo estándares de calidad.' },
      { titulo: 'Origen', contenido: 'País de origen: China 🇨🇳<br/>Empacado en: Cali, Colombia.' },
      { titulo: 'Información legal', contenido: 'Importado y empacado por:<br/>Industria Colombiana de Mezclas S.A.S<br/>Cll 8 No. 42-78 – Cali, Colombia<br/><br/>Elaborado especialmente para: Vitora.' }
    ],
    shorts: []
  }
];

const seed = async () => {
  try {
    await syncModels();

    for (const p of productos) {
      const { variantes, faqs, secciones_extra, shorts, ...datosProd } = p;

      const [producto, created] = await Producto.findOrCreate({
        where: { id: datosProd.id },
        defaults: datosProd
      });

      if (!created) {
        await producto.update(datosProd);
      }

      // Reemplaza relaciones
      await ProductoVariante.destroy({ where: { producto_id: producto.id } });
      await ProductoFaq.destroy({ where: { producto_id: producto.id } });
      await ProductoSeccionExtra.destroy({ where: { producto_id: producto.id } });
      await ProductoShort.destroy({ where: { producto_id: producto.id } });

      if (variantes.length) {
        await ProductoVariante.bulkCreate(
          variantes.map((v, i) => ({ ...v, producto_id: producto.id, orden: i }))
        );
      }
      if (faqs.length) {
        await ProductoFaq.bulkCreate(
          faqs.map((f, i) => ({ ...f, producto_id: producto.id, orden: i }))
        );
      }
      if (secciones_extra.length) {
        await ProductoSeccionExtra.bulkCreate(
          secciones_extra.map((s, i) => ({ ...s, producto_id: producto.id, orden: i }))
        );
      }
      if (shorts.length) {
        await ProductoShort.bulkCreate(
          shorts.map((url, i) => ({ url, producto_id: producto.id, orden: i }))
        );
      }

      console.log(`✓ Producto "${producto.nombre}" (${created ? 'creado' : 'actualizado'})`);
    }

    console.log('\n✅ Seed completado: 6 productos migrados.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en seed:', err);
    process.exit(1);
  }
};

seed();
