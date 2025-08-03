"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    up: (queryInterface) => {
        return Promise.all([
            queryInterface.addConstraint("Queues", ["color", "companyId"], {
                name: "Queues_color_key",
                type: 'unique'
            }),
            queryInterface.addConstraint("Queues", ["name", "companyId"], {
                name: "Queues_name_key",
                type: 'unique'
            }),
        ]);
    },
    down: (queryInterface) => {
        return Promise.all([
            queryInterface.removeConstraint("Queues", "Queues_color_key"),
            queryInterface.removeConstraint("Queues", "Queues_name_key"),
        ]);
    }
};
//# sourceMappingURL=20210818102608-add-unique-indexes-to-Queues-table.js.map