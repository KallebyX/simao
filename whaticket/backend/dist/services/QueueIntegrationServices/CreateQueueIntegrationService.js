"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Yup = __importStar(require("yup"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const QueueIntegrations_1 = __importDefault(require("../../models/QueueIntegrations"));
const CreateQueueIntegrationService = async ({ type, name, projectName, jsonContent, language, urlN8N, companyId, typebotExpires, typebotKeywordFinish, typebotSlug, typebotUnknownMessage, typebotDelayMessage, typebotKeywordRestart, typebotRestartMessage }) => {
    const schema = Yup.object().shape({
        name: Yup.string()
            .required()
            .min(2)
            .test("Check-name", "This integration name is already used.", async (value) => {
            if (!value)
                return false;
            const nameExists = await QueueIntegrations_1.default.findOne({
                where: { name: value, companyId }
            });
            return !nameExists;
        })
    });
    try {
        await schema.validate({ type, name, projectName, jsonContent, language, urlN8N, companyId });
    }
    catch (err) {
        throw new AppError_1.default(err.message);
    }
    const queueIntegration = await QueueIntegrations_1.default.create({
        type,
        name,
        projectName,
        jsonContent,
        language,
        urlN8N,
        companyId,
        typebotExpires,
        typebotKeywordFinish,
        typebotSlug,
        typebotUnknownMessage,
        typebotDelayMessage,
        typebotKeywordRestart,
        typebotRestartMessage
    });
    return queueIntegration;
};
exports.default = CreateQueueIntegrationService;
//# sourceMappingURL=CreateQueueIntegrationService.js.map