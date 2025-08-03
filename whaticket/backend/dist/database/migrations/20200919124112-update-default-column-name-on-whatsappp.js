"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    up: (queryInterface) => {
        return queryInterface.renameColumn("Whatsapps", "default", "isDefault");
    },
    down: (queryInterface) => {
        return queryInterface.renameColumn("Whatsapps", "isDefault", "default");
    }
};
//# sourceMappingURL=20200919124112-update-default-column-name-on-whatsappp.js.map