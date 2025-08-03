"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.addColumn("Messages", "quotedMsgId", {
            type: sequelize_1.DataTypes.STRING,
            references: { model: "Messages", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "SET NULL"
        });
    },
    down: (queryInterface) => {
        return queryInterface.removeColumn("Messages", "quotedMsgId");
    }
};
//# sourceMappingURL=20201028124427-add-quoted-msg-to-messages.js.map