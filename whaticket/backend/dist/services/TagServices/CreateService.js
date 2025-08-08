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
const Tag_1 = __importDefault(require("../../models/Tag"));
const CreateService = async ({ name, color = "#A4CCCC", kanban, companyId, timeLane = null, nextLaneId = null, greetingMessageLane = "", rollbackLaneId = null }) => {
    const schema = Yup.object().shape({
        name: Yup.string().required().min(3)
    });
    try {
        await schema.validate({ name });
    }
    catch (err) {
        throw new AppError_1.default(err.message);
    }
    const [tag] = await Tag_1.default.findOrCreate({
        where: { name, color, kanban: Number(kanban), companyId },
        defaults: {
            name, color, kanban: Number(kanban), companyId,
            timeLane,
            nextLaneId: String(nextLaneId) === "" ? null : nextLaneId,
            greetingMessageLane,
            rollbackLaneId: String(rollbackLaneId) === "" ? null : rollbackLaneId,
        }
    });
    await tag.reload();
    return tag;
};
exports.default = CreateService;
//# sourceMappingURL=CreateService.js.map