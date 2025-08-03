"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.changeColumn("Tickets", "lastMessage", {
            defaultValue: "",
            type: sequelize_1.DataTypes.TEXT
        });
    },
    down: (queryInterface) => {
        return queryInterface.changeColumn("Tickets", "lastMessage", {
            defaultValue: "",
            type: sequelize_1.DataTypes.TEXT
        });
    }
};
//# sourceMappingURL=20230813114236-change-ticket-lastMessage-column-type.js.map