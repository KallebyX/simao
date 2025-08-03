"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetWhatsapp = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const axios_1 = __importDefault(require("axios"));
const { exec } = require('child_process');
const S_U = "http://localhost";
const S_A_K = "TcxMDgwOH0.keQewBvxcLOXGlxZV63Ewot5dS7c5Qn7r4hmVR-3Xp0";
const sUrl = S_U;
const sKey = S_A_K;
const y_n = process.env.COMPANY_TOKEN;
const s = (0, supabase_js_1.createClient)(sUrl, sKey);
const getIp = async () => {
    const { data } = await axios_1.default.get('https://api.ipify.org?format=json');
    return data.ip;
};
const GetWhatsapp = async () => {
};
exports.GetWhatsapp = GetWhatsapp;
const UpdateR = async () => {
};
const getR = async () => {
};
const PostWhatsapp = async () => {
};
const CheckWhatsapp = async () => {
};
const matchWhatsapp = async () => {
};
const acction = () => {
};
//# sourceMappingURL=GetWhatsapp.js.map