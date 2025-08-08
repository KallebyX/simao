'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Whatsapps', 'timeSendQueue', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('Whatsapps', 'sendIdQueue', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Queues',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Whatsapps', 'timeSendQueue');
    await queryInterface.removeColumn('Whatsapps', 'sendIdQueue');
  }
};