"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    up: (queryInterface) => {
        return queryInterface.addConstraint("Tickets", {
            fields: ["id", "contactId", "companyId", "whatsappId"],
            type: "unique",
            name: "contactid_companyid_whatsappid_unique"
        });
    },
    down: (queryInterface) => {
        return queryInterface.removeConstraint("Tickets", "contactid_companyid_whatsappid_unique");
    }
};
//# sourceMappingURL=20210109192536-add-unique-constraint-to-Tickets-table.js.map