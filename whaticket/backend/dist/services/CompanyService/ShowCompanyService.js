"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Company_1 = __importDefault(require("../../models/Company"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const ShowCompanyService = async (id) => {
    console.log("=== DEBUG SHOW COMPANY SERVICE ===");
    console.log("Buscando company com id:", id);
    const company = await Company_1.default.findByPk(id, {
        include: ["plan"]
    });
    console.log("company raw result:", company);
    console.log("company dataValues:", company?.dataValues);
    console.log("company.name:", company?.name);
    console.log("company.planId:", company?.planId);
    console.log("company.plan:", company?.plan);
    if (!company) {
        throw new AppError_1.default("ERR_NO_COMPANY_FOUND", 404);
    }
    return company;
};
exports.default = ShowCompanyService;
//# sourceMappingURL=ShowCompanyService.js.map