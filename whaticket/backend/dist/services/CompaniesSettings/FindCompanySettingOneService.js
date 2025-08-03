"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../../database"));
const FindCompanySettingOneService = async ({ companyId, column }) => {
    const [results, metadata] = await database_1.default.query(`SELECT "${column}" FROM "CompaniesSettings" WHERE "companyId"=${companyId}`);
    return results;
};
exports.default = FindCompanySettingOneService;
//# sourceMappingURL=FindCompanySettingOneService.js.map