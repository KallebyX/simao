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
const Files_1 = __importDefault(require("../../models/Files"));
const FilesOptions_1 = __importDefault(require("../../models/FilesOptions"));
const ShowService_1 = __importDefault(require("./ShowService"));
const CreateService = async ({ name, message, companyId, options }) => {
    const schema = Yup.object().shape({
        name: Yup.string()
            .required()
            .min(3)
            .test("Check-unique-name", "ERR_RATING_NAME_ALREADY_EXISTS", async (value) => {
            if (value) {
                const tagWithSameName = await Files_1.default.findOne({
                    where: { name: value, companyId }
                });
                return !tagWithSameName;
            }
            return false;
        })
    });
    try {
        await schema.validate({ name });
    }
    catch (err) {
        throw new AppError_1.default(err.message);
    }
    let fileList = await Files_1.default.create({
        name,
        message,
        companyId
    });
    if (options && options.length > 0) {
        await Promise.all(options.map(async (info) => {
            await FilesOptions_1.default.upsert({ ...info, fileId: fileList.id });
        }));
    }
    fileList = await (0, ShowService_1.default)(fileList.id, companyId);
    return fileList;
};
exports.default = CreateService;
//# sourceMappingURL=CreateService.js.map