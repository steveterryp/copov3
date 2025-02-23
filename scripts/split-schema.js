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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
var fs_1 = require("fs");
// Define domain categories and their models
var domainCategories = {
    auth: ['User', 'Role', 'RefreshToken'],
    team: ['Team', 'TeamMember'],
    pov: {
        core: ['POV', 'Phase'],
        crm: [], // Will be added in next phase
        workflow: [], // Will be added in next phase
        kpi: [] // Will be added in next phase
    },
    task: ['Task', 'Comment', 'Attachment', 'TaskActivity'],
    activity: ['Activity'],
    support: ['SupportRequest', 'FeatureRequest']
};
// Define enum categories
var enumCategories = {
    status: ['POVStatus', 'TaskStatus', 'UserStatus', 'PhaseStatus', 'SupportRequestStatus', 'FeatureRequestStatus'],
    priority: ['Priority', 'TaskPriority', 'SupportRequestPriority', 'FeatureRequestImpact'],
    roles: ['UserRole', 'TeamRole']
};
function extractModelDefinition(schema, modelName) {
    var modelStart = schema.indexOf("model ".concat(modelName));
    if (modelStart === -1)
        return '';
    var braceCount = 0;
    var index = modelStart;
    var found = false;
    while (index < schema.length) {
        if (schema[index] === '{') {
            braceCount++;
            found = true;
        }
        else if (schema[index] === '}') {
            braceCount--;
            if (found && braceCount === 0) {
                return schema.substring(modelStart, index + 1);
            }
        }
        index++;
    }
    return '';
}
function extractEnumDefinition(schema, enumName) {
    var enumStart = schema.indexOf("enum ".concat(enumName));
    if (enumStart === -1)
        return '';
    var braceCount = 0;
    var index = enumStart;
    var found = false;
    while (index < schema.length) {
        if (schema[index] === '{') {
            braceCount++;
            found = true;
        }
        else if (schema[index] === '}') {
            braceCount--;
            if (found && braceCount === 0) {
                return schema.substring(enumStart, index + 1);
            }
        }
        index++;
    }
    return '';
}
function createBaseTypes() {
    return "type Timestamps {\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}\n\ntype Metadata {\n  metadata Json?\n}\n";
}
function splitSchema() {
    return __awaiter(this, void 0, void 0, function () {
        var schema_1, configSection, mainSchema_1;
        return __generator(this, function (_a) {
            try {
                schema_1 = (0, fs_1.readFileSync)('prisma/schema.prisma', 'utf8');
                configSection = schema_1.substring(0, schema_1.indexOf('enum'));
                mainSchema_1 = configSection + '\n';
                mainSchema_1 += 'import "./common/base"\n';
                mainSchema_1 += 'import "./enums/status"\n';
                mainSchema_1 += 'import "./enums/priority"\n';
                mainSchema_1 += 'import "./enums/roles"\n\n';
                Object.keys(domainCategories).forEach(function (domain) {
                    var domainValue = domainCategories[domain];
                    if (typeof domainValue === 'object' && !Array.isArray(domainValue)) {
                        // We know this is POVDomain because it's the only non-array domain
                        var povDomain = domainValue;
                        Object.keys(povDomain).forEach(function (subdomain) {
                            mainSchema_1 += "import \"./domains/".concat(domain, "/").concat(subdomain, "\"\n");
                        });
                    }
                    else {
                        mainSchema_1 += "import \"./domains/".concat(domain, "\"\n");
                    }
                });
                (0, fs_1.writeFileSync)('prisma/schema.prisma', mainSchema_1);
                // Create base types
                (0, fs_1.writeFileSync)('prisma/common/base.prisma', createBaseTypes());
                // Split enums
                Object.entries(enumCategories).forEach(function (_a) {
                    var category = _a[0], enums = _a[1];
                    var enumContent = '';
                    enums.forEach(function (enumName) {
                        var enumDef = extractEnumDefinition(schema_1, enumName);
                        if (enumDef)
                            enumContent += enumDef + '\n\n';
                    });
                    (0, fs_1.writeFileSync)("prisma/enums/".concat(category, ".prisma"), enumContent);
                });
                // Split models by domain
                Object.entries(domainCategories).forEach(function (_a) {
                    var domain = _a[0], models = _a[1];
                    if (typeof models === 'object' && !Array.isArray(models)) {
                        // Handle nested domains (e.g., pov)
                        Object.entries(models).forEach(function (_a) {
                            var subdomain = _a[0], subModels = _a[1];
                            var domainContent = '';
                            subModels.forEach(function (modelName) {
                                var modelDef = extractModelDefinition(schema_1, modelName);
                                if (modelDef)
                                    domainContent += modelDef + '\n\n';
                            });
                            (0, fs_1.writeFileSync)("prisma/domains/".concat(domain, "/").concat(subdomain, ".prisma"), domainContent);
                        });
                    }
                    else {
                        // Handle flat domains
                        var domainContent_1 = '';
                        models.forEach(function (modelName) {
                            var modelDef = extractModelDefinition(schema_1, modelName);
                            if (modelDef)
                                domainContent_1 += modelDef + '\n\n';
                        });
                        (0, fs_1.writeFileSync)("prisma/domains/".concat(domain, ".prisma"), domainContent_1);
                    }
                });
                console.log('Schema split successfully');
            }
            catch (error) {
                console.error('Error splitting schema:', error);
            }
            return [2 /*return*/];
        });
    });
}
splitSchema();
