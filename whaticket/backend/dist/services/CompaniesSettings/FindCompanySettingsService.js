"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CompaniesSettings_1 = __importDefault(require("../../models/CompaniesSettings"));
;
const FindCompanySettingsService = async ({ companyId }) => {
    const companySettings = await CompaniesSettings_1.default.findOne({
        where: { companyId }
    });
    return companySettings;
};
exports.default = FindCompanySettingsService;
//# sourceMappingURL=FindCompanySettingsService.js.map