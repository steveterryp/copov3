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
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcryptjs_1 = require("bcryptjs");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var adminUser, _a, _b, rikaUser, _c, _d, chrisUser, _e, _f, emeaTeam, apacTeam, rikaPOVs, chrisPOVs;
        var _g, _h, _j, _k, _l, _m;
        return __generator(this, function (_o) {
            switch (_o.label) {
                case 0:
                    console.log('Creating dummy data...');
                    // Clean existing data
                    return [4 /*yield*/, prisma.taskAssignee.deleteMany()];
                case 1:
                    // Clean existing data
                    _o.sent();
                    return [4 /*yield*/, prisma.task.deleteMany()];
                case 2:
                    _o.sent();
                    return [4 /*yield*/, prisma.phase.deleteMany()];
                case 3:
                    _o.sent();
                    return [4 /*yield*/, prisma.pOV.deleteMany()];
                case 4:
                    _o.sent();
                    return [4 /*yield*/, prisma.teamMember.deleteMany()];
                case 5:
                    _o.sent();
                    return [4 /*yield*/, prisma.team.deleteMany()];
                case 6:
                    _o.sent();
                    return [4 /*yield*/, prisma.refreshToken.deleteMany()];
                case 7:
                    _o.sent();
                    return [4 /*yield*/, prisma.user.deleteMany()];
                case 8:
                    _o.sent();
                    console.log('Creating users...');
                    _b = (_a = prisma.user).create;
                    _g = {};
                    _h = {
                        email: 'admin@example.com',
                        name: 'Admin User'
                    };
                    return [4 /*yield*/, (0, bcryptjs_1.hash)('admin123', 10)];
                case 9: return [4 /*yield*/, _b.apply(_a, [(_g.data = (_h.password = _o.sent(),
                            _h.role = client_1.UserRole.ADMIN,
                            _h),
                            _g)])];
                case 10:
                    adminUser = _o.sent();
                    _d = (_c = prisma.user).create;
                    _j = {};
                    _k = {
                        email: 'rika@example.com',
                        name: 'Rika Terry'
                    };
                    return [4 /*yield*/, (0, bcryptjs_1.hash)('rikrik123', 10)];
                case 11: return [4 /*yield*/, _d.apply(_c, [(_j.data = (_k.password = _o.sent(),
                            _k.role = client_1.UserRole.USER,
                            _k),
                            _j)])];
                case 12:
                    rikaUser = _o.sent();
                    _f = (_e = prisma.user).create;
                    _l = {};
                    _m = {
                        email: 'chris@example.com',
                        name: 'Chris Terry'
                    };
                    return [4 /*yield*/, (0, bcryptjs_1.hash)('chris123', 10)];
                case 13: return [4 /*yield*/, _f.apply(_e, [(_l.data = (_m.password = _o.sent(),
                            _m.role = client_1.UserRole.USER,
                            _m),
                            _l)])];
                case 14:
                    chrisUser = _o.sent();
                    console.log('Creating teams...');
                    return [4 /*yield*/, prisma.team.create({
                            data: {
                                name: 'EMEA',
                                members: {
                                    create: [
                                        {
                                            userId: rikaUser.id,
                                            role: client_1.TeamRole.OWNER,
                                        },
                                        {
                                            userId: chrisUser.id,
                                            role: client_1.TeamRole.MEMBER,
                                        },
                                    ],
                                },
                            },
                        })];
                case 15:
                    emeaTeam = _o.sent();
                    return [4 /*yield*/, prisma.team.create({
                            data: {
                                name: 'APAC',
                                members: {
                                    create: [
                                        {
                                            userId: chrisUser.id,
                                            role: client_1.TeamRole.OWNER,
                                        },
                                        {
                                            userId: rikaUser.id,
                                            role: client_1.TeamRole.MEMBER,
                                        },
                                    ],
                                },
                            },
                        })];
                case 16:
                    apacTeam = _o.sent();
                    console.log('Creating POVs...');
                    return [4 /*yield*/, Promise.all([
                            prisma.pOV.create({
                                data: {
                                    title: 'EMEA Market Analysis',
                                    description: 'Comprehensive market analysis for EMEA region',
                                    status: client_1.POVStatus.IN_PROGRESS,
                                    priority: client_1.Priority.HIGH,
                                    startDate: new Date(),
                                    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                                    ownerId: rikaUser.id,
                                    teamId: emeaTeam.id,
                                },
                            }),
                            prisma.pOV.create({
                                data: {
                                    title: 'EMEA Customer Feedback',
                                    description: 'Analysis of customer feedback from EMEA region',
                                    status: client_1.POVStatus.DRAFT,
                                    priority: client_1.Priority.MEDIUM,
                                    startDate: new Date(),
                                    endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
                                    ownerId: rikaUser.id,
                                    teamId: emeaTeam.id,
                                },
                            }),
                            prisma.pOV.create({
                                data: {
                                    title: 'EMEA Sales Strategy',
                                    description: 'Sales strategy development for EMEA region',
                                    status: client_1.POVStatus.COMPLETED,
                                    priority: client_1.Priority.HIGH,
                                    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                                    endDate: new Date(),
                                    ownerId: rikaUser.id,
                                    teamId: emeaTeam.id,
                                },
                            }),
                        ])];
                case 17:
                    rikaPOVs = _o.sent();
                    return [4 /*yield*/, Promise.all([
                            prisma.pOV.create({
                                data: {
                                    title: 'APAC Growth Strategy',
                                    description: 'Strategic plan for APAC market expansion',
                                    status: client_1.POVStatus.IN_PROGRESS,
                                    priority: client_1.Priority.URGENT,
                                    startDate: new Date(),
                                    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
                                    ownerId: chrisUser.id,
                                    teamId: apacTeam.id,
                                },
                            }),
                            prisma.pOV.create({
                                data: {
                                    title: 'APAC Partner Network',
                                    description: 'Development of partner network in APAC region',
                                    status: client_1.POVStatus.DRAFT,
                                    priority: client_1.Priority.HIGH,
                                    startDate: new Date(),
                                    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
                                    ownerId: chrisUser.id,
                                    teamId: apacTeam.id,
                                },
                            }),
                        ])];
                case 18:
                    chrisPOVs = _o.sent();
                    // Create a POV where Rika is a team member on Chris's project
                    return [4 /*yield*/, prisma.pOV.create({
                            data: {
                                title: 'Cross-Region Collaboration',
                                description: 'Joint EMEA-APAC market opportunity analysis',
                                status: client_1.POVStatus.IN_PROGRESS,
                                priority: client_1.Priority.HIGH,
                                startDate: new Date(),
                                endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
                                ownerId: chrisUser.id,
                                teamId: emeaTeam.id, // Rika's team
                            },
                        })];
                case 19:
                    // Create a POV where Rika is a team member on Chris's project
                    _o.sent();
                    // Create a POV where Chris is a team member on Rika's project
                    return [4 /*yield*/, prisma.pOV.create({
                            data: {
                                title: 'Global Market Strategy',
                                description: 'Combined EMEA-APAC market strategy',
                                status: client_1.POVStatus.DRAFT,
                                priority: client_1.Priority.URGENT,
                                startDate: new Date(),
                                endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days from now
                                ownerId: rikaUser.id,
                                teamId: apacTeam.id, // Chris's team
                            },
                        })];
                case 20:
                    // Create a POV where Chris is a team member on Rika's project
                    _o.sent();
                    console.log('Dummy data creation completed!');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('Error creating dummy data:', e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
