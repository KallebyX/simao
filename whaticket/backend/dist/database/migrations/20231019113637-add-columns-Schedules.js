"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return Promise.all([
            queryInterface.addColumn("Schedules", "ticketUserId", {
                type: sequelize_1.DataTypes.INTEGER,
                references: { model: "Users", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "SET NULL"
            }),
            queryInterface.addColumn("Schedules", "whatsappId", {
                type: sequelize_1.DataTypes.INTEGER,
                references: { model: "Whatsapps", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "SET NULL"
            }),
            queryInterface.addColumn("Schedules", "queueId", {
                type: sequelize_1.DataTypes.INTEGER,
                references: { model: "Queues", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "SET NULL"
            }),
            queryInterface.addColumn("Schedules", "statusTicket", {
                type: sequelize_1.DataTypes.STRING,
                defaultValue: "closed"
            })
        ]);
    },
    down: (queryInterface) => {
        return Promise.all([
            queryInterface.removeColumn("Schedules", "ticketUserId"),
            queryInterface.removeColumn("Schedules", "queueId"),
            queryInterface.removeColumn("Schedules", "whatsappId"),
            queryInterface.removeColumn("Schedules", "statusTicket")
        ]);
    }
};
//# sourceMappingURL=20231019113637-add-columns-Schedules.js.map