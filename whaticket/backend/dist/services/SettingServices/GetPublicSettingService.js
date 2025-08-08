"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../../database"));
const publicSettingsKeys = [
    "allowSignup",
    "primaryColorLight",
    "primaryColorDark",
    "appLogoLight",
    "appLogoDark",
    "appLogoFavicon",
    "appName"
];
const GetPublicSettingService = async ({ key }) => {
    console.log("|======== GetPublicSettingService ========|");
    console.log("key", key);
    console.log("|=========================================|");
    if (!publicSettingsKeys.includes(key)) {
        return null;
    }
    try {
        const result = await database_1.default.query('SELECT value FROM "Settings" WHERE "companyId" = 1 AND key = :key LIMIT 1', {
            replacements: { key },
            type: sequelize_1.QueryTypes.SELECT
        });
        return result[0]?.value || null;
    }
    catch (error) {
        console.log("Error fetching setting:", error);
        return null;
    }
};
exports.default = GetPublicSettingService;
//# sourceMappingURL=GetPublicSettingService.js.map