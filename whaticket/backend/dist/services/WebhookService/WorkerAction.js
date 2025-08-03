"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const ActionsWebhookService_1 = require("./ActionsWebhookService");
worker_threads_1.parentPort.on("message", async (data) => {
    const { idFlowDb, companyId, nodes, connects, nextStage, dataWebhook, details, hashWebhookId, pressKey, idTicket, numberPhrase } = data;
    if (typeof data === 'object') {
        await (0, ActionsWebhookService_1.ActionsWebhookService)(idFlowDb, companyId, nodes, connects, nextStage, dataWebhook, details, hashWebhookId, pressKey, idTicket, numberPhrase);
    }
    worker_threads_1.parentPort.postMessage("Olá, thread principal!");
});
//# sourceMappingURL=WorkerAction.js.map