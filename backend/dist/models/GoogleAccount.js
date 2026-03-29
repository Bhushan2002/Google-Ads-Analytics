"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAccount = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const googleAccountSchema = new mongoose_1.default.Schema({
    userId: { type: String, required: true, unique: true },
    refreshToken: { type: String, required: true },
    connectedAt: { type: Date, default: Date.now }
});
exports.GoogleAccount = mongoose_1.default.model('GoogleAccount', googleAccountSchema);
