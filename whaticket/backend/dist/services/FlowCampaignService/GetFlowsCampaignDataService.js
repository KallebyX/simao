"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FlowCampaign_1 = require("../../models/FlowCampaign");
const GetFlowsCampaignDataService = async ({ companyId, idFlow }) => {
    try {
        const { count, rows } = await FlowCampaign_1.FlowCampaignModel.findAndCountAll({
            where: {
                id: idFlow
            }
        });
        let hook = rows[0];
        return {
            details: hook
        };
    }
    catch (error) {
        console.error('Erro ao consultar Fluxo:', error);
    }
};
exports.default = GetFlowsCampaignDataService;
//# sourceMappingURL=GetFlowsCampaignDataService.js.map