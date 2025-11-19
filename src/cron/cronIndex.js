const cron = require('node-cron');
const { processPendingEmailOrders } = require('./emailCron');

cron.schedule('*/3 * * * *', async () => {
  try {
    console.log("VA A EJECUTAR EL CRON");
    await processPendingEmailOrders();
  } catch (e) {
    console.error('[cron:emails] Error general del job:', e?.message || e);
  }
});
