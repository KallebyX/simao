"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.addColumn("TicketTraking", "chatbotAt", {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true
        });
    },
    down: (queryInterface) => {
        return queryInterface.removeColumn("TicketTraking", "chatbotAt");
    }
};
//# sourceMappingURL=20230623133903-add-chatbotAt-ticket-tracking.js.map