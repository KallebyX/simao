"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Webhook_1 = require("../../models/Webhook");
const ListWebHookService = async ({ companyId, }) => {
    try {
        const { count, rows } = await Webhook_1.WebhookModel.findAndCountAll({
            where: {
                company_id: companyId
            }
        });
        const hooks = [];
        rows.forEach((usuario) => {
            hooks.push(usuario.toJSON());
        });
        return {
            webhooks: hooks,
            hasMore: true,
            count: count
        };
    }
    catch (error) {
        console.error('Erro ao consultar usuários:', error);
    }
};
exports.default = ListWebHookService;
//# sourceMappingURL=ListWebHookService.js.map