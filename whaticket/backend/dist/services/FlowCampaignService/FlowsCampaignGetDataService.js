"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FlowCampaign_1 = require("../../models/FlowCampaign");
const FlowsCampaignGetDataService = async ({ companyId, }) => {
    try {
        const { count, rows } = await FlowCampaign_1.FlowCampaignModel.findAndCountAll({
            where: {
                companyId: companyId,
            }
        });
        const flowResult = [];
        rows.forEach((flow) => {
            flowResult.push(flow.toJSON());
        });
        return {
            flow: flowResult
        };
    }
    catch (error) {
        console.error('Erro ao consultar Fluxo:', error);
    }
};
exports.default = FlowsCampaignGetDataService;
//# sourceMappingURL=FlowsCampaignGetDataService.js.map