"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    up: (queryInterface) => {
        return Promise.all([
            queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "unaccent"')
        ]);
    },
    down: (queryInterface) => {
        return queryInterface.sequelize.query('DROP EXTENSION IF EXISTS "unaccent"');
    }
};
//# sourceMappingURL=20230911113900-add-unaccent-extension.js.map