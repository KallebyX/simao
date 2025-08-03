"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    up: (queryInterface) => {
        return Promise.all([
            queryInterface.addIndex("Tickets", ["uuid"], {
                name: "tickets_uuid_idx"
            })
        ]);
    },
    down: (queryInterface) => {
        return Promise.all([
            queryInterface.removeIndex("Tickets", "tickets_uuid_idx"),
        ]);
    }
};
//# sourceMappingURL=20230925112401-create-Indexes%20Tickets.js.map