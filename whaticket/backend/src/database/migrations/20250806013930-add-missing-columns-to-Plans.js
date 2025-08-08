"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Plans", "useIntegrations", {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: true
    });

    await queryInterface.addColumn("Plans", "useOpenAi", {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: true
    });

    await queryInterface.addColumn("Plans", "useKanban", {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Plans", "useIntegrations");
    await queryInterface.removeColumn("Plans", "useOpenAi");
    await queryInterface.removeColumn("Plans", "useKanban");
  }
};