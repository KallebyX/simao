"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.addColumn("Invoices", "linkInvoice", {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            defaultValue: ""
        });
    },
    down: (queryInterface) => {
        return queryInterface.removeColumn("Invoices", "linkInvoice");
    }
};
//# sourceMappingURL=20240206110037-add-linkInvoice-to-Invoices.js.map