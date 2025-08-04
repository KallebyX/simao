"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const sequelize_1 = require("sequelize");
const dbConfig = require("../../config/database");
const env = process.env.NODE_ENV || "development";
const config = dbConfig[env];
const sequelize = new sequelize_typescript_1.Sequelize({
    database: config.database,
    username: config.username,
    password: config.password,
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging,
    pool: config.pool,
    define: config.define,
    timezone: config.timezone
});
const ListMessagesServiceAll = async ({ companyId, fromMe, dateStart, dateEnd }) => {
    let ticketsCounter;
    if (dateStart && dateEnd) {
        if (fromMe) {
            ticketsCounter = await sequelize.query(`select COUNT(*) from "Messages" m where "companyId" = ${companyId} and "fromMe" = ${fromMe} and "createdAt"  between '${dateStart} 00:00:00' and '${dateEnd} 23:59:59'`, {
                type: sequelize_1.QueryTypes.SELECT
            });
        }
        else {
            ticketsCounter = await sequelize.query(`select COUNT(*) from "Messages" m where "companyId" = ${companyId} and "createdAt" between '${dateStart} 00:00:00' and '${dateEnd} 23:59:59'`, {
                type: sequelize_1.QueryTypes.SELECT
            });
        }
    }
    else {
        if (fromMe) {
            ticketsCounter = await sequelize.query(`select COUNT(*) from "Messages" m where "companyId" = ${companyId} and "fromMe" = ${fromMe}`, {
                type: sequelize_1.QueryTypes.SELECT
            });
        }
        else {
            ticketsCounter = await sequelize.query(`select COUNT(*) from "Messages" m where "companyId" = ${companyId}`, {
                type: sequelize_1.QueryTypes.SELECT
            });
        }
    }
    return {
        count: ticketsCounter,
    };
};
exports.default = ListMessagesServiceAll;
//# sourceMappingURL=ListMessagesServiceAll.js.map