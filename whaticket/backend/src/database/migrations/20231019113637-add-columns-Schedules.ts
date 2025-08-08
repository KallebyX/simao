import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addColumn("Schedules", "ticketUserId", {
        type: DataTypes.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      }),
      queryInterface.addColumn("Schedules", "whatsappId", {
        type: DataTypes.INTEGER,
        references: { model: "Whatsapps", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      }),
      queryInterface.addColumn("Schedules", "queueId", {
        type: DataTypes.INTEGER,
        references: { model: "Queues", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      }),
      queryInterface.addColumn("Schedules", "statusTicket", {
        type: DataTypes.STRING,
        defaultValue: "closed"
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("Schedules", "ticketUserId"),
      queryInterface.removeColumn("Schedules", "queueId"),
      queryInterface.removeColumn("Schedules", "whatsappId"),
      queryInterface.removeColumn("Schedules", "statusTicket")
    ]);
  }
};