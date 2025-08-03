"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    up: async (queryInterface, Sequelize) => {
        const constraints = await queryInterface.showConstraint('Chatbots');
        if (constraints.some(constraint => constraint.constraintName === 'Chatbots_optIntegrationId_fkey')) {
            await queryInterface.removeConstraint('Chatbots', 'Chatbots_optIntegrationId_fkey');
        }
        await queryInterface.addConstraint('Chatbots', {
            fields: ['optIntegrationId'],
            type: 'foreign key',
            name: 'Chatbots_optIntegrationId_fkey',
            references: {
                table: 'QueueIntegrations',
                field: 'id'
            }
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeConstraint('Chatbots', 'Chatbots_optIntegrationId_fkey');
    }
};
//# sourceMappingURL=20240718084127-recriate-constraint-integracoes.js.map