"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.addColumn("Whatsapps", "flowIdNotPhrase", {
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
        queryInterface.removeColumn("Whatsapps", "flowIdNotPhrase");
    }
};
//# sourceMappingURL=20240718030548-add-column-flowIdNotPhrase-to-whatsapp.js.map