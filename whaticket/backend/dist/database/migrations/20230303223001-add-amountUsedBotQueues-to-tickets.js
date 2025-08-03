"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.addColumn("Tickets", "amountUsedBotQueues", {
            type: sequelize_1.DataTypes.INTEGER
        });
    },
    down: (queryInterface) => {
        return queryInterface.removeColumn("Tickets", "amountUsedBotQueues");
    }
};
//# sourceMappingURL=20230303223001-add-amountUsedBotQueues-to-tickets.js.map