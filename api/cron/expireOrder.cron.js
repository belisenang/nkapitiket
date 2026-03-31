const cron = require("node-cron");

const expireOrderService = require(
    "../services/fe/expireOrder.service"
);
module.exports = async function expireOrderCron() {
    cron.schedule("*/2 * * * *", async () => {

        await expireOrderService.releaseExpiredOrders();

    });
};