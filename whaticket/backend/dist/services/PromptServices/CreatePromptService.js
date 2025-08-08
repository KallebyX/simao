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
const Prompt_1 = __importDefault(require("../../models/Prompt"));
const ShowPromptService_1 = __importDefault(require("./ShowPromptService"));
const CreatePromptService = async (promptData) => {
    const { name, apiKey, prompt, queueId, maxMessages, companyId } = promptData;
    const promptSchema = Yup.object().shape({
        name: Yup.string().required("ERR_PROMPT_NAME_INVALID"),
        prompt: Yup.string().required("ERR_PROMPT_INTELLIGENCE_INVALID"),
        apiKey: Yup.string().required("ERR_PROMPT_APIKEY_INVALID"),
        queueId: Yup.number().required("ERR_PROMPT_QUEUEID_INVALID"),
        maxMessages: Yup.number().required("ERR_PROMPT_MAX_MESSAGES_INVALID"),
        companyId: Yup.number().required("ERR_PROMPT_companyId_INVALID")
    });
    try {
        await promptSchema.validate({ name, apiKey, prompt, queueId, maxMessages, companyId });
    }
    catch (err) {
        throw new AppError_1.default(`${JSON.stringify(err, undefined, 2)}`);
    }
    let promptTable = await Prompt_1.default.create({
        ...promptData,
        companyId: Number(promptData.companyId),
        queueId: promptData.queueId ? Number(promptData.queueId) : undefined,
        maxMessages: promptData.maxMessages ? Number(promptData.maxMessages) : undefined,
        maxTokens: promptData.maxTokens ? Number(promptData.maxTokens) : undefined,
        temperature: promptData.temperature ? Number(promptData.temperature) : undefined,
        promptTokens: promptData.promptTokens ? Number(promptData.promptTokens) : undefined,
        completionTokens: promptData.completionTokens ? Number(promptData.completionTokens) : undefined,
        totalTokens: promptData.totalTokens ? Number(promptData.totalTokens) : undefined
    });
    promptTable = await (0, ShowPromptService_1.default)({ promptId: promptTable.id, companyId });
    return promptTable;
};
exports.default = CreatePromptService;
//# sourceMappingURL=CreatePromptService.js.map