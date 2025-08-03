"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.addColumn("Queues", "integrationId", {
            type: sequelize_1.DataTypes.INTEGER,
            references: { model: "QueueIntegrations", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "SET NULL"
        }),
            queryInterface.addColumn("Whatsapps", "integrationId", {
                type: sequelize_1.DataTypes.INTEGER,
                references: { model: "QueueIntegrations", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "SET NULL"
            });
    },
    down: (queryInterface) => {
        return queryInterface.removeColumn("Queues", "integrationId"),
            queryInterface.removeColumn("Whatsapps", "integrationId");
    }
};
//# sourceMappingURL=20230922212337-add-integrationId-Queues.js.map