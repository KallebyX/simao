"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.addColumn("CompaniesSettings", "showNotificationPending", {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        });
    },
    down: (queryInterface) => {
        return queryInterface.removeColumn("CompaniesSettings", "showNotificationPending");
    }
};
//# sourceMappingURL=20240425223411-add-showNotificationPending-to-CompaniesSettings.js.map