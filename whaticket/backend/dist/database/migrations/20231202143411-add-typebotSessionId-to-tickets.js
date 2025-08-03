"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.addColumn("Tickets", "typebotSessionId", {
            type: sequelize_1.DataTypes.STRING,
            defaultValue: null,
            allowNull: true,
        });
    },
    down: (queryInterface) => {
        return queryInterface.removeColumn("Tickets", "typebotSessionId");
    }
};
//# sourceMappingURL=20231202143411-add-typebotSessionId-to-tickets.js.map