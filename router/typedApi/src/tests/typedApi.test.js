"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var appServer_1 = require("dev-in-prod-lib/src/appServer");
var next_1 = __importDefault(require("next"));
var client_1 = require("../client");
var schema_1 = require("../schema");
var path_1 = __importDefault(require("path"));
describe("typedApi", function () {
    var port = 4829;
    var closeable;
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, appServer_1.start(port, path_1.default.resolve(__dirname, "../../"), next_1.default)];
                case 1:
                    closeable = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, closeable.close()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    var client = new client_1.TypedClient("http://localhost:" + port + "/api/", schema_1.schema);
    test("sayHi", function () { return __awaiter(void 0, void 0, void 0, function () {
        var res1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.post("sayHi", { name: "Eve" })];
                case 1:
                    res1 = _a.sent();
                    if (res1.success) {
                        expect(res1.parsedBody.salute).toBe("Hi Eve");
                    }
                    else {
                        fail("Unexpected error");
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    test("divide works", function () { return __awaiter(void 0, void 0, void 0, function () {
        var res1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.post("divide", { num1: 15, num2: 5 })];
                case 1:
                    res1 = _a.sent();
                    if (res1.success) {
                        expect(res1.parsedBody.result).toBe(3);
                    }
                    else {
                        fail("Unexpected error");
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    test("divide error", function () { return __awaiter(void 0, void 0, void 0, function () {
        var res1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, client.post("divide", { num1: 15, num2: 0 })];
                case 1:
                    res1 = _b.sent();
                    if (res1.success) {
                        fail("Unexpected response");
                    }
                    else {
                        expect(res1.error).toBe("Can't divide by 0");
                        expect((_a = res1.response) === null || _a === void 0 ? void 0 : _a.status).toBe(400);
                    }
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=typedApi.test.js.map