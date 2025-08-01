"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    up: async (queryInterface) => {
        return queryInterface.sequelize.transaction(async (t) => {
            const planExists = await queryInterface.rawSelect("Plans", {
                where: { id: 1 }
            }, ["id"]);
            if (!planExists) {
                await queryInterface.bulkInsert("Plans", [{
                        id: 1,
                        name: "Plano 1",
                        users: 10,
                        connections: 10,
                        queues: 10,
                        amount: 100,
                        useWhatsapp: true,
                        useFacebook: true,
                        useInstagram: true,
                        useCampaigns: true,
                        useSchedules: true,
                        useInternalChat: true,
                        useExternalApi: true,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }], { transaction: t });
            }
            const companyExists = await queryInterface.rawSelect("Companies", {
                where: { id: 1 }
            }, ["id"]);
            if (!companyExists) {
                await queryInterface.bulkInsert("Companies", [{
                        name: "Empresa 1",
                        planId: 1,
                        dueDate: "2099-12-31 04:00:00+01",
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }], { transaction: t });
            }
        });
    },
    down: async (queryInterface) => {
        return queryInterface.sequelize.transaction(async (t) => {
            await queryInterface.bulkDelete("Companies", { id: 1 }, { transaction: t });
            await queryInterface.bulkDelete("Plans", { id: 1 }, { transaction: t });
        });
    }
};
