"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.addColumn("Contacts", "lgpdAcceptedAt", {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: null,
            allowNull: true
        });
    },
    down: (queryInterface) => {
        return queryInterface.removeColumn("Contacts", "lgpdAcceptedAt");
    }
};
//# sourceMappingURL=20230731331007-add-lgpdAccept-Contact.js.map