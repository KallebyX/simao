"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.addColumn("Chatbots", "optIntegrationId", {
            type: sequelize_1.DataTypes.INTEGER,
            references: { model: "QueueIntegrations", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "SET NULL"
        });
    },
    down: (queryInterface) => {
        return queryInterface.removeColumn("QueueIntegrations", "optIntegrationId");
    }
};
//# sourceMappingURL=20230603212337-add-QueueIntegrations-integrationId-Chatbots.js.map