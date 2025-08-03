"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.removeColumn("Messages", "userId");
    },
    down: (queryInterface) => {
        return queryInterface.addColumn("Messages", "userId", {
            type: sequelize_1.DataTypes.INTEGER,
            references: { model: "Users", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "SET NULL"
        });
    }
};
//# sourceMappingURL=20200730153237-remove-user-association-from-messages.js.map