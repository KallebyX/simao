'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Companies', 'folderSize', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: '0'
    });
    
    await queryInterface.addColumn('Companies', 'numberFileFolder', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: '0'
    });
    
    await queryInterface.addColumn('Companies', 'updatedAtFolder', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Companies', 'folderSize');
    await queryInterface.removeColumn('Companies', 'numberFileFolder');
    await queryInterface.removeColumn('Companies', 'updatedAtFolder');
  }
};