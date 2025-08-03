"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.changeColumn("QuickMessages", "message", {
            type: sequelize_1.DataTypes.TEXT
        });
    },
    down: (queryInterface) => {
        return queryInterface.changeColumn("QuickMessages", "message", {
            type: sequelize_1.DataTypes.STRING
        });
    }
};
//# sourceMappingURL=20210109192528-change-column-message-to-quick-messages-table.js.map