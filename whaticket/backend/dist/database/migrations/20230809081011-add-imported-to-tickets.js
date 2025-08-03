"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.addColumn("Tickets", "imported", {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        });
    },
    down: (queryInterface) => {
        return queryInterface.removeColumn("Tickets", "imported");
    }
};
//# sourceMappingURL=20230809081011-add-imported-to-tickets.js.map