"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FlowBuilder_1 = require("../../models/FlowBuilder");
const GetFlowBuilderService = async ({ companyId, idFlow }) => {
    try {
        const { count, rows } = await FlowBuilder_1.FlowBuilderModel.findAndCountAll({
            where: {
                company_id: companyId,
                id: idFlow
            }
        });
        let flow = rows[0];
        return {
            flow: flow
        };
    }
    catch (error) {
        console.error('Erro ao consultar usuários:', error);
    }
};
exports.default = GetFlowBuilderService;
//# sourceMappingURL=GetFlowBuilderService.js.map