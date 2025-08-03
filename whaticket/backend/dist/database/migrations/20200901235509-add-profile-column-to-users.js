"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.addColumn("Users", "profile", {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            defaultValue: "admin"
        });
    },
    down: (queryInterface) => {
        return queryInterface.removeColumn("Users", "profile");
    }
};
//# sourceMappingURL=20200901235509-add-profile-column-to-users.js.map