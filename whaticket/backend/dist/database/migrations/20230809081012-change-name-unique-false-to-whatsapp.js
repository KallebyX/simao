"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    up: async (queryInterface) => {
        const [results] = await queryInterface.sequelize.query(`
      SELECT *
      FROM information_schema.table_constraints
      WHERE constraint_name = 'Whatsapps_name_key'
        AND table_name = 'Whatsapps'
    `);
        if (results) {
            await queryInterface.removeConstraint("Whatsapps", "Whatsapps_name_key");
            console.log(`A constraint Whatsapps_name_key foi removida da tabela Whatsapps.`);
        }
        else {
            console.log(`A constraint Whatsapps_name_key NÃO existe na tabela Whatsapps.`);
        }
    },
    down: async () => {
    }
};
//# sourceMappingURL=20230809081012-change-name-unique-false-to-whatsapp.js.map