module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Migration stub - constraints únicos já existem na definição original da tabela
    // Esta migration é desnecessária mas mantida para completar a sequência
    return Promise.resolve();
  },

  down: async (queryInterface, Sequelize) => {
    // Nada para reverter
    return Promise.resolve();
  }
};