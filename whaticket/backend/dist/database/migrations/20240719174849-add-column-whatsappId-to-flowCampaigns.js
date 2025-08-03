"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.addColumn("FlowCampaigns", "whatsappId", {
            type: sequelize_1.DataTypes.INTEGER,
            references: {
                model: "Whatsapps",
                key: "id"
            },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
            allowNull: true
        });
    },
    down: (queryInterface) => {
        queryInterface.removeColumn("FlowCampaigns", "whatsappId");
    }
};
//# sourceMappingURL=20240719174849-add-column-whatsappId-to-flowCampaigns.js.map