"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.addColumn("Plans", "useFacebook", {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: true
        });
    },
    down: (queryInterface) => {
        return queryInterface.removeColumn("Plans", "useFacebook");
    }
};
//# sourceMappingURL=20230105164900-add-useFacebook-Plans.js.map