"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.addColumn("Whatsapps", "flowIdWelcome", {
            type: sequelize_1.DataTypes.INTEGER,
            references: {
                model: "FlowBuilders",
                key: "id"
            },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
            allowNull: true
        });
    },
    down: (queryInterface) => {
        queryInterface.removeColumn("Whatsapps", "flowIdWelcome");
    }
};
//# sourceMappingURL=20240719130841-add-column-flowIdWelcome-to-whatsapp.js.map