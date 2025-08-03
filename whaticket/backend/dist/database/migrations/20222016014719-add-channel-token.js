"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.addColumn("Whatsapps", "facebookUserToken", {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true
        });
    },
    down: (queryInterface) => {
        return queryInterface.removeColumn("Whatsapps", "facebookUserToken");
    }
};
//# sourceMappingURL=20222016014719-add-channel-token.js.map