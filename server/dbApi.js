var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { createPublicKey, randomUUID, verify } from 'node:crypto';
import mssql from 'mssql';
import { createRole, createUser, deleteRole, deleteUser, getRoles, getRotaShifts, getServiceUsers, getUsers, pingDatabase, syncRoles, updateRole, updateUser } from '@halo/hub-db';
function writeJson(res, statusCode, payload) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(payload));
}
function getPathname(req) {
    if (!req.url) {
        return null;
    }
    var url = new URL(req.url, 'http://127.0.0.1');
    return url.pathname;
}
function normalizeDate(date) {
    return date.toISOString().split('T')[0];
}
function uniqueSorted(values) {
    return Array.from(new Set(values
        .map(function (value) { return value.trim(); })
        .filter(Boolean))).sort(function (left, right) { return left.localeCompare(right); });
}
function readString(value) {
    return typeof value === 'string' ? value.trim() : '';
}
function sanitizeCreateUserBody(body) {
    return {
        id: readString(body.id),
        name: readString(body.name),
        email: readString(body.email),
        phone: readString(body.phone),
        role: readString(body.role),
        status: readString(body.status),
        lineManager: readString(body.lineManager),
        isLineManager: Boolean(body.isLineManager)
    };
}
function sanitizeUpdateUserBody(body) {
    var payload = {};
    if ('name' in body)
        payload.name = readString(body.name);
    if ('email' in body)
        payload.email = readString(body.email);
    if ('phone' in body)
        payload.phone = readString(body.phone);
    if ('role' in body)
        payload.role = readString(body.role);
    if ('status' in body)
        payload.status = readString(body.status);
    if ('lineManager' in body)
        payload.lineManager = readString(body.lineManager);
    if ('isLineManager' in body)
        payload.isLineManager = Boolean(body.isLineManager);
    return payload;
}
function readJsonBody(req) {
    return __awaiter(this, void 0, void 0, function () {
        var chunks, chunk, e_1_1, raw, parsed;
        var _a, req_1, req_1_1;
        var _b, e_1, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    chunks = [];
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 6, 7, 12]);
                    _a = true, req_1 = __asyncValues(req);
                    _e.label = 2;
                case 2: return [4 /*yield*/, req_1.next()];
                case 3:
                    if (!(req_1_1 = _e.sent(), _b = req_1_1.done, !_b)) return [3 /*break*/, 5];
                    _d = req_1_1.value;
                    _a = false;
                    chunk = _d;
                    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                    _e.label = 4;
                case 4:
                    _a = true;
                    return [3 /*break*/, 2];
                case 5: return [3 /*break*/, 12];
                case 6:
                    e_1_1 = _e.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 12];
                case 7:
                    _e.trys.push([7, , 10, 11]);
                    if (!(!_a && !_b && (_c = req_1.return))) return [3 /*break*/, 9];
                    return [4 /*yield*/, _c.call(req_1)];
                case 8:
                    _e.sent();
                    _e.label = 9;
                case 9: return [3 /*break*/, 11];
                case 10:
                    if (e_1) throw e_1.error;
                    return [7 /*endfinally*/];
                case 11: return [7 /*endfinally*/];
                case 12:
                    if (chunks.length === 0) {
                        return [2 /*return*/, {}];
                    }
                    try {
                        raw = Buffer.concat(chunks).toString('utf8');
                        parsed = JSON.parse(raw);
                        return [2 /*return*/, parsed && typeof parsed === 'object' ? parsed : {}];
                    }
                    catch (_f) {
                        throw Object.assign(new Error('Invalid JSON body'), { code: 'JSON_PARSE_ERROR' });
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function getRoleNameFromPath(pathname) {
    var match = pathname.match(/^\/api\/db\/roles\/([^/]+)$/);
    if (!match) {
        return null;
    }
    return decodeURIComponent(match[1]);
}
function getUserIdFromPath(pathname) {
    var match = pathname.match(/^\/api\/db\/users\/([^/]+)$/);
    if (!match) {
        return null;
    }
    return decodeURIComponent(match[1]);
}
function getCompanyUserIdFromPath(pathname) {
    var match = pathname.match(/^\/api\/db\/company-users\/([^/]+)$/);
    if (!match) {
        return null;
    }
    return decodeURIComponent(match[1]);
}
function isPrismaUnavailable(errorCode) {
    return errorCode === 'P1001' || errorCode === 'P1002' || errorCode === 'P1008';
}
var authSessions = new Map();
var AUTH_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
var OPENID_KEYS_URL = 'https://login.microsoftonline.com/common/discovery/v2.0/keys';
var jwksCache = new Map();
var azureSqlPoolPromise = null;
function getAzureSqlConnectionString() {
    return readString(process.env.AZURE_SQL_CONNECTION_STRING || process.env.SQLSERVER_CONNECTION_STRING);
}
function getAzureSqlPool() {
    return __awaiter(this, void 0, void 0, function () {
        var connectionString;
        return __generator(this, function (_a) {
            connectionString = getAzureSqlConnectionString();
            if (!connectionString) {
                throw Object.assign(new Error('Server missing AZURE_SQL_CONNECTION_STRING'), { code: 'AZURE_SQL_CONFIG_MISSING' });
            }
            if (!azureSqlPoolPromise) {
                azureSqlPoolPromise = mssql.connect(connectionString).catch(function (error) {
                    azureSqlPoolPromise = null;
                    throw Object.assign(error, { code: error.code || 'AZURE_SQL_UNAVAILABLE' });
                });
            }
            return [2 /*return*/, azureSqlPoolPromise];
        });
    });
}
function decodeBase64Url(input) {
    return Buffer.from(input, 'base64url').toString('utf8');
}
function parseJwt(token) {
    var parts = token.split('.');
    if (parts.length !== 3) {
        throw Object.assign(new Error('Invalid token format'), { code: 'AUTH_INVALID_TOKEN' });
    }
    try {
        var header = JSON.parse(decodeBase64Url(parts[0]));
        var payload = JSON.parse(decodeBase64Url(parts[1]));
        return {
            header: header,
            payload: payload,
            signed: "".concat(parts[0], ".").concat(parts[1]),
            signature: Buffer.from(parts[2], 'base64url')
        };
    }
    catch (_a) {
        throw Object.assign(new Error('Unable to decode token'), { code: 'AUTH_INVALID_TOKEN' });
    }
}
function getJwksKey(kid) {
    return __awaiter(this, void 0, void 0, function () {
        var response, body, _i, _a, key;
        var _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    if (jwksCache.has(kid)) {
                        return [2 /*return*/, (_b = jwksCache.get(kid)) !== null && _b !== void 0 ? _b : null];
                    }
                    return [4 /*yield*/, fetch(OPENID_KEYS_URL)];
                case 1:
                    response = _e.sent();
                    if (!response.ok) {
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    body = (_e.sent());
                    for (_i = 0, _a = (_c = body.keys) !== null && _c !== void 0 ? _c : []; _i < _a.length; _i++) {
                        key = _a[_i];
                        if (key.kid) {
                            jwksCache.set(key.kid, key);
                        }
                    }
                    return [2 /*return*/, (_d = jwksCache.get(kid)) !== null && _d !== void 0 ? _d : null];
            }
        });
    });
}
function validateMicrosoftIdToken(idToken) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, header, payload, signed, signature, key, publicKey, validSignature, now, expectedAudience, validIssuerPrefix;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = parseJwt(idToken), header = _a.header, payload = _a.payload, signed = _a.signed, signature = _a.signature;
                    if (!header.kid || header.alg !== 'RS256') {
                        throw Object.assign(new Error('Unsupported token header'), { code: 'AUTH_INVALID_TOKEN' });
                    }
                    return [4 /*yield*/, getJwksKey(header.kid)];
                case 1:
                    key = _b.sent();
                    if (!key) {
                        throw Object.assign(new Error('Signing key not found'), { code: 'AUTH_INVALID_TOKEN' });
                    }
                    publicKey = createPublicKey({ key: key, format: 'jwk' });
                    validSignature = verify('RSA-SHA256', Buffer.from(signed), publicKey, signature);
                    if (!validSignature) {
                        throw Object.assign(new Error('Invalid token signature'), { code: 'AUTH_INVALID_TOKEN' });
                    }
                    now = Math.floor(Date.now() / 1000);
                    if (!payload.exp || payload.exp < now) {
                        throw Object.assign(new Error('Token expired'), { code: 'AUTH_INVALID_TOKEN' });
                    }
                    expectedAudience = process.env.AZURE_CLIENT_ID || process.env.VITE_AZURE_CLIENT_ID;
                    if (!expectedAudience) {
                        throw Object.assign(new Error('Server missing AZURE_CLIENT_ID (or VITE_AZURE_CLIENT_ID)'), { code: 'AUTH_CONFIG_MISSING' });
                    }
                    if (payload.aud !== expectedAudience) {
                        throw Object.assign(new Error('Token audience mismatch'), { code: 'AUTH_INVALID_TOKEN' });
                    }
                    if (!payload.tid || !payload.oid) {
                        throw Object.assign(new Error('Token missing tenant or object id'), { code: 'AUTH_INVALID_TOKEN' });
                    }
                    validIssuerPrefix = "https://login.microsoftonline.com/".concat(payload.tid, "/v2.0");
                    if (!payload.iss || payload.iss !== validIssuerPrefix) {
                        throw Object.assign(new Error('Token issuer mismatch'), { code: 'AUTH_INVALID_TOKEN' });
                    }
                    return [2 /*return*/, payload];
            }
        });
    });
}
function extractLoginEmail(payload) {
    return readString(payload.preferred_username) || readString(payload.upn) || readString(payload.email);
}
function parseAuthHeader(req) {
    var header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return null;
    }
    return header.slice('Bearer '.length).trim();
}
function removeExpiredSessions() {
    var now = Date.now();
    authSessions.forEach(function (session, token) {
        if (session.expiresAt <= now)
            authSessions.delete(token);
    });
}
function getActiveSession(req) {
    removeExpiredSessions();
    var token = parseAuthHeader(req);
    if (!token)
        return null;
    var session = authSessions.get(token);
    if (!session || session.expiresAt <= Date.now())
        return null;
    return session;
}
function sanitizeCompanyUserBody(body) {
    return {
        name: readString(body.name),
        email: readString(body.email),
        phone: readString(body.phone),
        role: readString(body.role),
        status: readString(body.status),
        lineManager: readString(body.lineManager),
        isLineManager: Boolean(body.isLineManager)
    };
}
function splitName(fullName) {
    var parts = fullName
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    if (parts.length === 0)
        return { firstName: 'Team', lastName: 'Member' };
    if (parts.length === 1)
        return { firstName: parts[0], lastName: '' };
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}
function normalizeStatus(status) {
    var accountStatus = status.toLowerCase() === 'inactive' ? 'Inactive' : 'Active';
    return { accountStatus: accountStatus, isActive: accountStatus === 'Active' ? 1 : 0 };
}
function loadCompanyUsers(companyId, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var pool, request, userFilter, users;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getAzureSqlPool()];
                case 1:
                    pool = _a.sent();
                    request = pool.request().input('companyId', mssql.Int, companyId);
                    userFilter = typeof userId === 'number' ? 'AND ua.UserID = @userId' : '';
                    if (typeof userId === 'number') {
                        request.input('userId', mssql.Int, userId);
                    }
                    return [4 /*yield*/, request.query("\n      SELECT\n        CAST(ua.UserID AS NVARCHAR(50)) AS id,\n        LTRIM(RTRIM(CONCAT(ISNULL(s.FirstName, N''), N' ', ISNULL(s.LastName, N'')))) AS name,\n        ISNULL(rolePick.RoleName, N'Carer') AS role,\n        CASE\n          WHEN ISNULL(ua.AccountStatus, N'Active') = N'Active' AND ISNULL(s.ActiveStatus, 1) = 1\n            THEN N'active'\n          ELSE N'inactive'\n        END AS status,\n        ISNULL(NULLIF(managerPick.ManagerName, N''), N'Unassigned') AS lineManager,\n        ISNULL(NULLIF(s.Email, N''), ua.Username) AS email,\n        ISNULL(NULLIF(s.MobilePhone, N''), ISNULL(NULLIF(s.Phone, N''), N'')) AS phone,\n        CASE\n          WHEN EXISTS (\n            SELECT 1\n            FROM Auth.UserRoleAssignment ura2\n            INNER JOIN Auth.UserRole ur2\n              ON ur2.RoleID = ura2.RoleID\n             AND ur2.CompanyID = ura2.CompanyID\n            WHERE ura2.UserID = ua.UserID\n              AND ura2.CompanyID = ua.CompanyID\n              AND ISNULL(ur2.IsActive, 1) = 1\n              AND ur2.RoleName IN (N'Line Manager', N'Manager')\n          ) THEN 1\n          ELSE 0\n        END AS isLineManager\n      FROM Auth.UserAccount ua\n      LEFT JOIN People.Staff s ON s.StaffID = ua.StaffID\n      OUTER APPLY (\n        SELECT TOP 1 ur.RoleName\n        FROM Auth.UserRoleAssignment ura\n        INNER JOIN Auth.UserRole ur\n          ON ur.RoleID = ura.RoleID\n         AND ur.CompanyID = ura.CompanyID\n        WHERE ura.UserID = ua.UserID\n          AND ura.CompanyID = ua.CompanyID\n          AND (ura.ExpiryDate IS NULL OR ura.ExpiryDate >= CAST(SYSUTCDATETIME() AS date))\n          AND ISNULL(ur.IsActive, 1) = 1\n        ORDER BY ura.AssignedDate DESC, ura.AssignmentID DESC\n      ) rolePick\n      OUTER APPLY (\n        SELECT TOP 1 LTRIM(RTRIM(CONCAT(ISNULL(ms.FirstName, N''), N' ', ISNULL(ms.LastName, N'')))) AS ManagerName\n        FROM Auth.UserRoleAssignment mura\n        INNER JOIN Auth.UserRole mur\n          ON mur.RoleID = mura.RoleID\n         AND mur.CompanyID = mura.CompanyID\n        INNER JOIN Auth.UserAccount mua\n          ON mua.UserID = mura.UserID\n         AND mua.CompanyID = mura.CompanyID\n        LEFT JOIN People.Staff ms ON ms.StaffID = mua.StaffID\n        WHERE mura.CompanyID = ua.CompanyID\n          AND ISNULL(mur.IsActive, 1) = 1\n          AND mur.RoleName IN (N'Line Manager', N'Manager')\n        ORDER BY mura.AssignedDate DESC, mura.AssignmentID DESC\n      ) managerPick\n      WHERE ua.CompanyID = @companyId\n      ".concat(userFilter, "\n      ORDER BY name ASC\n    "))];
                case 2:
                    users = (_a.sent()).recordset.map(function (row) { return (__assign(__assign({}, row), { name: row.name || row.email || "User ".concat(row.id) })); });
                    return [2 /*return*/, users];
            }
        });
    });
}
function resolveRoleId(tx, companyId, roleName) {
    return __awaiter(this, void 0, void 0, function () {
        var roleRows;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, new mssql.Request(tx)
                        .input('companyId', mssql.Int, companyId)
                        .input('roleName', mssql.NVarChar(128), roleName)
                        .query("\n        SELECT TOP 1 ur.RoleID AS roleId\n        FROM Auth.UserRole ur\n        WHERE ur.CompanyID = @companyId\n          AND ur.RoleName = @roleName\n          AND ISNULL(ur.IsActive, 1) = 1\n      ")];
                case 1:
                    roleRows = (_c.sent()).recordset;
                    return [2 /*return*/, (_b = (_a = roleRows[0]) === null || _a === void 0 ? void 0 : _a.roleId) !== null && _b !== void 0 ? _b : null];
            }
        });
    });
}
function createCompanyUser(session, payload) {
    return __awaiter(this, void 0, void 0, function () {
        var email, pool, tx, duplicateRows, _a, firstName, lastName, _b, accountStatus, isActive, roleNames, staffRows, staffId, userRows, userId, _i, roleNames_1, roleName, roleId, created, error_1;
        var _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    email = payload.email.toLowerCase();
                    if (!email) {
                        throw Object.assign(new Error('Email is required'), { code: 'VALIDATION_ERROR' });
                    }
                    if (!payload.role) {
                        throw Object.assign(new Error('Role is required'), { code: 'VALIDATION_ERROR' });
                    }
                    return [4 /*yield*/, getAzureSqlPool()];
                case 1:
                    pool = _e.sent();
                    tx = new mssql.Transaction(pool);
                    return [4 /*yield*/, tx.begin()];
                case 2:
                    _e.sent();
                    _e.label = 3;
                case 3:
                    _e.trys.push([3, 14, , 16]);
                    return [4 /*yield*/, new mssql.Request(tx)
                            .input('companyId', mssql.Int, session.companyId)
                            .input('username', mssql.NVarChar(320), email)
                            .query("\n          SELECT TOP 1 ua.UserID AS userId\n          FROM Auth.UserAccount ua\n          WHERE ua.CompanyID = @companyId\n            AND LOWER(ua.Username) = LOWER(@username)\n        ")];
                case 4:
                    duplicateRows = (_e.sent()).recordset;
                    if (duplicateRows.length > 0) {
                        throw Object.assign(new Error('A user with this email already exists'), { code: 'VALIDATION_ERROR' });
                    }
                    _a = splitName(payload.name || email), firstName = _a.firstName, lastName = _a.lastName;
                    _b = normalizeStatus(payload.status), accountStatus = _b.accountStatus, isActive = _b.isActive;
                    roleNames = uniqueSorted(__spreadArray([payload.role], (payload.isLineManager ? ['Line Manager'] : []), true));
                    return [4 /*yield*/, new mssql.Request(tx)
                            .input('firstName', mssql.NVarChar(128), firstName)
                            .input('lastName', mssql.NVarChar(128), lastName)
                            .input('email', mssql.NVarChar(320), email)
                            .input('phone', mssql.NVarChar(64), payload.phone)
                            .input('isActive', mssql.Bit, isActive)
                            .query("\n          INSERT INTO People.Staff (FirstName, LastName, Email, MobilePhone, Phone, ActiveStatus)\n          VALUES (@firstName, @lastName, @email, @phone, @phone, @isActive);\n          SELECT CAST(SCOPE_IDENTITY() AS INT) AS staffId;\n        ")];
                case 5:
                    staffRows = (_e.sent()).recordset;
                    staffId = (_c = staffRows[0]) === null || _c === void 0 ? void 0 : _c.staffId;
                    if (!staffId) {
                        throw Object.assign(new Error('Failed to create staff record'), { code: 'VALIDATION_ERROR' });
                    }
                    return [4 /*yield*/, new mssql.Request(tx)
                            .input('companyId', mssql.Int, session.companyId)
                            .input('staffId', mssql.Int, staffId)
                            .input('username', mssql.NVarChar(320), email)
                            .input('accountStatus', mssql.NVarChar(64), accountStatus)
                            .query("\n          INSERT INTO Auth.UserAccount (CompanyID, StaffID, Username, AccountStatus, AuthProvider, EntraObjectID, LastModifiedDate)\n          VALUES (@companyId, @staffId, @username, @accountStatus, N'Microsoft', NULL, SYSUTCDATETIME());\n          SELECT CAST(SCOPE_IDENTITY() AS INT) AS userId;\n        ")];
                case 6:
                    userRows = (_e.sent()).recordset;
                    userId = (_d = userRows[0]) === null || _d === void 0 ? void 0 : _d.userId;
                    if (!userId) {
                        throw Object.assign(new Error('Failed to create user account record'), { code: 'VALIDATION_ERROR' });
                    }
                    _i = 0, roleNames_1 = roleNames;
                    _e.label = 7;
                case 7:
                    if (!(_i < roleNames_1.length)) return [3 /*break*/, 11];
                    roleName = roleNames_1[_i];
                    return [4 /*yield*/, resolveRoleId(tx, session.companyId, roleName)];
                case 8:
                    roleId = _e.sent();
                    if (!roleId)
                        return [3 /*break*/, 10];
                    return [4 /*yield*/, new mssql.Request(tx)
                            .input('userId', mssql.Int, userId)
                            .input('companyId', mssql.Int, session.companyId)
                            .input('roleId', mssql.Int, roleId)
                            .query("\n          INSERT INTO Auth.UserRoleAssignment (UserID, CompanyID, RoleID, AssignedDate, ExpiryDate)\n          VALUES (@userId, @companyId, @roleId, CAST(SYSUTCDATETIME() AS date), NULL);\n        ")];
                case 9:
                    _e.sent();
                    _e.label = 10;
                case 10:
                    _i++;
                    return [3 /*break*/, 7];
                case 11: return [4 /*yield*/, tx.commit()];
                case 12:
                    _e.sent();
                    return [4 /*yield*/, loadCompanyUsers(session.companyId, userId)];
                case 13:
                    created = _e.sent();
                    if (!created[0]) {
                        throw Object.assign(new Error('Created user could not be loaded'), { code: 'VALIDATION_ERROR' });
                    }
                    return [2 /*return*/, created[0]];
                case 14:
                    error_1 = _e.sent();
                    return [4 /*yield*/, tx.rollback()];
                case 15:
                    _e.sent();
                    throw error_1;
                case 16: return [2 /*return*/];
            }
        });
    });
}
function updateCompanyUser(session, userId, payload) {
    return __awaiter(this, void 0, void 0, function () {
        var email, pool, tx, existingRows, staffId, _a, firstName, lastName, _b, accountStatus, isActive, roleNames, _i, roleNames_2, roleName, roleId, updated, error_2;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    email = payload.email.toLowerCase();
                    if (!email) {
                        throw Object.assign(new Error('Email is required'), { code: 'VALIDATION_ERROR' });
                    }
                    if (!payload.role) {
                        throw Object.assign(new Error('Role is required'), { code: 'VALIDATION_ERROR' });
                    }
                    return [4 /*yield*/, getAzureSqlPool()];
                case 1:
                    pool = _c.sent();
                    tx = new mssql.Transaction(pool);
                    return [4 /*yield*/, tx.begin()];
                case 2:
                    _c.sent();
                    _c.label = 3;
                case 3:
                    _c.trys.push([3, 16, , 18]);
                    return [4 /*yield*/, new mssql.Request(tx)
                            .input('companyId', mssql.Int, session.companyId)
                            .input('userId', mssql.Int, userId)
                            .query("\n          SELECT TOP 1 ua.StaffID AS staffId\n          FROM Auth.UserAccount ua\n          WHERE ua.CompanyID = @companyId\n            AND ua.UserID = @userId\n        ")];
                case 4:
                    existingRows = (_c.sent()).recordset;
                    if (existingRows.length === 0) {
                        throw Object.assign(new Error('User not found'), { code: 'P2025' });
                    }
                    staffId = existingRows[0].staffId;
                    _a = splitName(payload.name || email), firstName = _a.firstName, lastName = _a.lastName;
                    _b = normalizeStatus(payload.status), accountStatus = _b.accountStatus, isActive = _b.isActive;
                    if (!staffId) return [3 /*break*/, 6];
                    return [4 /*yield*/, new mssql.Request(tx)
                            .input('staffId', mssql.Int, staffId)
                            .input('firstName', mssql.NVarChar(128), firstName)
                            .input('lastName', mssql.NVarChar(128), lastName)
                            .input('email', mssql.NVarChar(320), email)
                            .input('phone', mssql.NVarChar(64), payload.phone)
                            .input('isActive', mssql.Bit, isActive)
                            .query("\n          UPDATE People.Staff\n          SET FirstName = @firstName,\n              LastName = @lastName,\n              Email = @email,\n              MobilePhone = @phone,\n              Phone = @phone,\n              ActiveStatus = @isActive\n          WHERE StaffID = @staffId\n        ")];
                case 5:
                    _c.sent();
                    _c.label = 6;
                case 6: return [4 /*yield*/, new mssql.Request(tx)
                        .input('companyId', mssql.Int, session.companyId)
                        .input('userId', mssql.Int, userId)
                        .input('username', mssql.NVarChar(320), email)
                        .input('accountStatus', mssql.NVarChar(64), accountStatus)
                        .query("\n        UPDATE Auth.UserAccount\n        SET Username = @username,\n            AccountStatus = @accountStatus,\n            LastModifiedDate = SYSUTCDATETIME()\n        WHERE CompanyID = @companyId\n          AND UserID = @userId\n      ")];
                case 7:
                    _c.sent();
                    return [4 /*yield*/, new mssql.Request(tx)
                            .input('companyId', mssql.Int, session.companyId)
                            .input('userId', mssql.Int, userId)
                            .query("\n        UPDATE ura\n        SET ExpiryDate = CAST(SYSUTCDATETIME() AS date)\n        FROM Auth.UserRoleAssignment ura\n        WHERE ura.CompanyID = @companyId\n          AND ura.UserID = @userId\n          AND (ura.ExpiryDate IS NULL OR ura.ExpiryDate >= CAST(SYSUTCDATETIME() AS date))\n      ")];
                case 8:
                    _c.sent();
                    roleNames = uniqueSorted(__spreadArray([payload.role], (payload.isLineManager ? ['Line Manager'] : []), true));
                    _i = 0, roleNames_2 = roleNames;
                    _c.label = 9;
                case 9:
                    if (!(_i < roleNames_2.length)) return [3 /*break*/, 13];
                    roleName = roleNames_2[_i];
                    return [4 /*yield*/, resolveRoleId(tx, session.companyId, roleName)];
                case 10:
                    roleId = _c.sent();
                    if (!roleId)
                        return [3 /*break*/, 12];
                    return [4 /*yield*/, new mssql.Request(tx)
                            .input('companyId', mssql.Int, session.companyId)
                            .input('userId', mssql.Int, userId)
                            .input('roleId', mssql.Int, roleId)
                            .query("\n          INSERT INTO Auth.UserRoleAssignment (UserID, CompanyID, RoleID, AssignedDate, ExpiryDate)\n          VALUES (@userId, @companyId, @roleId, CAST(SYSUTCDATETIME() AS date), NULL);\n        ")];
                case 11:
                    _c.sent();
                    _c.label = 12;
                case 12:
                    _i++;
                    return [3 /*break*/, 9];
                case 13: return [4 /*yield*/, tx.commit()];
                case 14:
                    _c.sent();
                    return [4 /*yield*/, loadCompanyUsers(session.companyId, userId)];
                case 15:
                    updated = _c.sent();
                    if (!updated[0]) {
                        throw Object.assign(new Error('Updated user could not be loaded'), { code: 'P2025' });
                    }
                    return [2 /*return*/, updated[0]];
                case 16:
                    error_2 = _c.sent();
                    return [4 /*yield*/, tx.rollback()];
                case 17:
                    _c.sent();
                    throw error_2;
                case 18: return [2 /*return*/];
            }
        });
    });
}
function exchangeMicrosoftToken(idToken) {
    return __awaiter(this, void 0, void 0, function () {
        var claims, entraTenantId, entraObjectId, loginEmail, pool, matchedRows, user, rolesRows, roles, displayNameFromStaff, displayName, sessionToken, expiresAt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, validateMicrosoftIdToken(idToken)];
                case 1:
                    claims = _a.sent();
                    entraTenantId = readString(claims.tid);
                    entraObjectId = readString(claims.oid);
                    loginEmail = extractLoginEmail(claims);
                    return [4 /*yield*/, getAzureSqlPool()];
                case 2:
                    pool = _a.sent();
                    return [4 /*yield*/, pool.request()
                            .input('tenantId', mssql.NVarChar(128), entraTenantId)
                            .input('objectId', mssql.NVarChar(128), entraObjectId)
                            .query("\n        SELECT TOP 1\n          ua.UserID AS userId,\n          ua.CompanyID AS companyId,\n          ua.StaffID AS staffId,\n          ua.Username AS username,\n          ua.AccountStatus AS accountStatus,\n          s.FirstName AS firstName,\n          s.LastName AS lastName,\n          s.Email AS staffEmail,\n          c.CompanyName AS companyName\n        FROM Auth.UserAccount ua\n        INNER JOIN People.Company c ON c.CompanyID = ua.CompanyID\n        LEFT JOIN People.Staff s ON s.StaffID = ua.StaffID\n        WHERE c.EntraTenantID = @tenantId\n          AND ua.EntraObjectID = @objectId\n          AND ISNULL(c.ActiveStatus, 1) = 1\n          AND ISNULL(ua.AccountStatus, N'Active') = N'Active'\n      ")];
                case 3:
                    matchedRows = (_a.sent()).recordset;
                    if (!(matchedRows.length === 0 && loginEmail)) return [3 /*break*/, 6];
                    return [4 /*yield*/, pool.request()
                            .input('tenantId', mssql.NVarChar(128), entraTenantId)
                            .input('email', mssql.NVarChar(320), loginEmail)
                            .query("\n          SELECT TOP 1\n            ua.UserID AS userId,\n            ua.CompanyID AS companyId,\n            ua.StaffID AS staffId,\n            ua.Username AS username,\n            ua.AccountStatus AS accountStatus,\n            s.FirstName AS firstName,\n            s.LastName AS lastName,\n            s.Email AS staffEmail,\n            c.CompanyName AS companyName\n          FROM Auth.UserAccount ua\n          INNER JOIN People.Company c ON c.CompanyID = ua.CompanyID\n          LEFT JOIN People.Staff s ON s.StaffID = ua.StaffID\n          WHERE c.EntraTenantID = @tenantId\n            AND LOWER(ua.Username) = LOWER(@email)\n            AND ISNULL(c.ActiveStatus, 1) = 1\n            AND ISNULL(ua.AccountStatus, N'Active') = N'Active'\n        ")];
                case 4:
                    matchedRows = (_a.sent()).recordset;
                    if (!(matchedRows.length > 0)) return [3 /*break*/, 6];
                    return [4 /*yield*/, pool.request()
                            .input('objectId', mssql.NVarChar(128), entraObjectId)
                            .input('userId', mssql.Int, matchedRows[0].userId)
                            .query("\n          UPDATE Auth.UserAccount\n          SET EntraObjectID = @objectId,\n              AuthProvider = N'Microsoft',\n              LastModifiedDate = SYSUTCDATETIME()\n          WHERE UserID = @userId\n            AND (EntraObjectID IS NULL OR EntraObjectID = N'')\n        ")];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    if (matchedRows.length === 0) {
                        throw Object.assign(new Error('No matching user account for this tenant'), { code: 'AUTH_NOT_MAPPED' });
                    }
                    user = matchedRows[0];
                    return [4 /*yield*/, pool.request()
                            .input('userId', mssql.Int, user.userId)
                            .input('companyId', mssql.Int, user.companyId)
                            .query("\n        SELECT ur.RoleName AS roleName\n        FROM Auth.UserRoleAssignment ura\n        INNER JOIN Auth.UserRole ur\n          ON ur.RoleID = ura.RoleID\n         AND ur.CompanyID = ura.CompanyID\n        WHERE ura.UserID = @userId\n          AND ura.CompanyID = @companyId\n          AND (ura.ExpiryDate IS NULL OR ura.ExpiryDate >= CAST(SYSUTCDATETIME() AS date))\n          AND ISNULL(ur.IsActive, 1) = 1\n      ")];
                case 7:
                    rolesRows = (_a.sent()).recordset;
                    roles = uniqueSorted(rolesRows.map(function (role) { return readString(role.roleName); }));
                    displayNameFromStaff = [readString(user.firstName), readString(user.lastName)].filter(Boolean).join(' ').trim();
                    displayName = displayNameFromStaff || readString(claims.name) || user.username;
                    sessionToken = randomUUID();
                    expiresAt = Date.now() + AUTH_SESSION_TTL_MS;
                    authSessions.set(sessionToken, {
                        token: sessionToken,
                        expiresAt: expiresAt,
                        userId: user.userId,
                        companyId: user.companyId,
                        roles: roles,
                        username: user.username,
                        displayName: displayName,
                        companyName: user.companyName,
                        staffId: user.staffId,
                        staffEmail: user.staffEmail
                    });
                    return [2 /*return*/, {
                            sessionToken: sessionToken,
                            expiresAt: new Date(expiresAt).toISOString(),
                            user: {
                                userId: user.userId,
                                companyId: user.companyId,
                                staffId: user.staffId,
                                username: user.username,
                                displayName: displayName,
                                companyName: user.companyName,
                                staffEmail: user.staffEmail
                            },
                            roles: roles
                        }];
            }
        });
    });
}
export function dbApiMiddleware() {
    var _this = this;
    return function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        var pathname, method, users, session, users, roles, users, lineManagers, serviceUsers, shifts, session, hasAzureClientId, hasAzureSqlConnectionString, body, idToken, result, token, body, user, session, body, user, body, result, role, companyUserId, session, parsedUserId, body, user, userId, body, user, currentRoleName, body, role, userId, roleName, error_3, err;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    pathname = getPathname(req);
                    if (!pathname || (!pathname.startsWith('/api/db') && !pathname.startsWith('/api/auth'))) {
                        next();
                        return [2 /*return*/];
                    }
                    method = (_a = req.method) !== null && _a !== void 0 ? _a : 'GET';
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 44, , 45]);
                    if (!(method === 'GET')) return [3 /*break*/, 16];
                    if (!(pathname === '/api/db/health')) return [3 /*break*/, 3];
                    return [4 /*yield*/, pingDatabase()];
                case 2:
                    _c.sent();
                    writeJson(res, 200, { ok: true });
                    return [2 /*return*/];
                case 3:
                    if (!(pathname === '/api/db/users')) return [3 /*break*/, 5];
                    return [4 /*yield*/, getUsers()];
                case 4:
                    users = _c.sent();
                    writeJson(res, 200, { data: users });
                    return [2 /*return*/];
                case 5:
                    if (!(pathname === '/api/db/company-users')) return [3 /*break*/, 7];
                    session = getActiveSession(req);
                    if (!session) {
                        writeJson(res, 401, { error: 'Unauthorized' });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, loadCompanyUsers(session.companyId)];
                case 6:
                    users = _c.sent();
                    writeJson(res, 200, { data: users });
                    return [2 /*return*/];
                case 7:
                    if (!(pathname === '/api/db/roles')) return [3 /*break*/, 9];
                    return [4 /*yield*/, getRoles()];
                case 8:
                    roles = _c.sent();
                    writeJson(res, 200, { data: roles.map(function (role) { return role.name; }) });
                    return [2 /*return*/];
                case 9:
                    if (!(pathname === '/api/db/line-managers')) return [3 /*break*/, 11];
                    return [4 /*yield*/, getUsers()];
                case 10:
                    users = _c.sent();
                    lineManagers = uniqueSorted(__spreadArray(__spreadArray([], users.map(function (user) { return user.lineManager; }), true), users.filter(function (user) { return Boolean(user.isLineManager); }).map(function (user) { return user.name; }), true));
                    writeJson(res, 200, { data: lineManagers });
                    return [2 /*return*/];
                case 11:
                    if (!(pathname === '/api/db/service-users')) return [3 /*break*/, 13];
                    return [4 /*yield*/, getServiceUsers()];
                case 12:
                    serviceUsers = _c.sent();
                    writeJson(res, 200, { data: serviceUsers });
                    return [2 /*return*/];
                case 13:
                    if (!(pathname === '/api/db/rota-shifts')) return [3 /*break*/, 15];
                    return [4 /*yield*/, getRotaShifts()];
                case 14:
                    shifts = _c.sent();
                    writeJson(res, 200, {
                        data: shifts.map(function (shift) { return ({
                            id: shift.id,
                            date: normalizeDate(shift.date),
                            start: shift.start,
                            end: shift.end,
                            location: shift.location,
                            type: shift.type,
                            status: shift.status,
                            employeeId: shift.employeeId,
                            serviceUserId: shift.serviceUserId,
                            comments: shift.comments,
                            colorCode: shift.colorCode
                        }); })
                    });
                    return [2 /*return*/];
                case 15:
                    if (pathname === '/api/auth/me') {
                        session = getActiveSession(req);
                        if (!session) {
                            writeJson(res, 401, { error: 'Session expired' });
                            return [2 /*return*/];
                        }
                        writeJson(res, 200, {
                            data: {
                                user: {
                                    userId: session.userId,
                                    companyId: session.companyId,
                                    staffId: session.staffId,
                                    username: session.username,
                                    displayName: session.displayName,
                                    companyName: session.companyName,
                                    staffEmail: session.staffEmail
                                },
                                roles: session.roles,
                                expiresAt: new Date(session.expiresAt).toISOString()
                            }
                        });
                        return [2 /*return*/];
                    }
                    if (pathname === '/api/auth/debug-config') {
                        hasAzureClientId = Boolean(process.env.AZURE_CLIENT_ID || process.env.VITE_AZURE_CLIENT_ID);
                        hasAzureSqlConnectionString = Boolean(process.env.AZURE_SQL_CONNECTION_STRING || process.env.SQLSERVER_CONNECTION_STRING);
                        writeJson(res, 200, {
                            data: {
                                hasAzureClientId: hasAzureClientId,
                                hasViteAzureClientId: Boolean(process.env.VITE_AZURE_CLIENT_ID),
                                hasAzureClientIdServerVar: Boolean(process.env.AZURE_CLIENT_ID),
                                hasAzureSqlConnectionString: hasAzureSqlConnectionString
                            }
                        });
                        return [2 /*return*/];
                    }
                    _c.label = 16;
                case 16:
                    if (!(method === 'POST')) return [3 /*break*/, 30];
                    if (!(pathname === '/api/auth/microsoft/exchange')) return [3 /*break*/, 19];
                    return [4 /*yield*/, readJsonBody(req)];
                case 17:
                    body = _c.sent();
                    idToken = readString(body.idToken);
                    if (!idToken) {
                        throw Object.assign(new Error('Missing idToken'), { code: 'VALIDATION_ERROR' });
                    }
                    return [4 /*yield*/, exchangeMicrosoftToken(idToken)];
                case 18:
                    result = _c.sent();
                    writeJson(res, 200, { data: result });
                    return [2 /*return*/];
                case 19:
                    if (pathname === '/api/auth/logout') {
                        token = parseAuthHeader(req);
                        if (token) {
                            authSessions.delete(token);
                        }
                        writeJson(res, 200, { ok: true });
                        return [2 /*return*/];
                    }
                    if (!(pathname === '/api/db/users')) return [3 /*break*/, 22];
                    return [4 /*yield*/, readJsonBody(req)];
                case 20:
                    body = _c.sent();
                    return [4 /*yield*/, createUser(sanitizeCreateUserBody(body))];
                case 21:
                    user = _c.sent();
                    writeJson(res, 201, { data: user });
                    return [2 /*return*/];
                case 22:
                    if (!(pathname === '/api/db/company-users')) return [3 /*break*/, 25];
                    session = getActiveSession(req);
                    if (!session) {
                        writeJson(res, 401, { error: 'Unauthorized' });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, readJsonBody(req)];
                case 23:
                    body = _c.sent();
                    return [4 /*yield*/, createCompanyUser(session, sanitizeCompanyUserBody(body))];
                case 24:
                    user = _c.sent();
                    writeJson(res, 201, { data: user });
                    return [2 /*return*/];
                case 25:
                    if (!(pathname === '/api/db/roles')) return [3 /*break*/, 30];
                    return [4 /*yield*/, readJsonBody(req)];
                case 26:
                    body = _c.sent();
                    if (!Array.isArray(body.roles)) return [3 /*break*/, 28];
                    return [4 /*yield*/, syncRoles(body.roles.map(function (role) { return readString(role); }))];
                case 27:
                    result = _c.sent();
                    writeJson(res, 200, { data: result.roles, skippedInUse: result.skippedInUse });
                    return [2 /*return*/];
                case 28: return [4 /*yield*/, createRole(readString(body.name))];
                case 29:
                    role = _c.sent();
                    writeJson(res, 201, { data: role.name });
                    return [2 /*return*/];
                case 30:
                    if (!(method === 'PUT')) return [3 /*break*/, 39];
                    companyUserId = getCompanyUserIdFromPath(pathname);
                    if (!companyUserId) return [3 /*break*/, 33];
                    session = getActiveSession(req);
                    if (!session) {
                        writeJson(res, 401, { error: 'Unauthorized' });
                        return [2 /*return*/];
                    }
                    parsedUserId = Number.parseInt(companyUserId, 10);
                    if (!Number.isFinite(parsedUserId)) {
                        throw Object.assign(new Error('Invalid user id'), { code: 'VALIDATION_ERROR' });
                    }
                    return [4 /*yield*/, readJsonBody(req)];
                case 31:
                    body = _c.sent();
                    return [4 /*yield*/, updateCompanyUser(session, parsedUserId, sanitizeCompanyUserBody(body))];
                case 32:
                    user = _c.sent();
                    writeJson(res, 200, { data: user });
                    return [2 /*return*/];
                case 33:
                    userId = getUserIdFromPath(pathname);
                    if (!userId) return [3 /*break*/, 36];
                    return [4 /*yield*/, readJsonBody(req)];
                case 34:
                    body = _c.sent();
                    return [4 /*yield*/, updateUser(userId, sanitizeUpdateUserBody(body))];
                case 35:
                    user = _c.sent();
                    writeJson(res, 200, { data: user });
                    return [2 /*return*/];
                case 36:
                    currentRoleName = getRoleNameFromPath(pathname);
                    if (!currentRoleName) return [3 /*break*/, 39];
                    return [4 /*yield*/, readJsonBody(req)];
                case 37:
                    body = _c.sent();
                    return [4 /*yield*/, updateRole(currentRoleName, readString(body.name))];
                case 38:
                    role = _c.sent();
                    writeJson(res, 200, { data: role.name });
                    return [2 /*return*/];
                case 39:
                    if (!(method === 'DELETE')) return [3 /*break*/, 43];
                    userId = getUserIdFromPath(pathname);
                    if (!userId) return [3 /*break*/, 41];
                    return [4 /*yield*/, deleteUser(userId)];
                case 40:
                    _c.sent();
                    writeJson(res, 200, { ok: true });
                    return [2 /*return*/];
                case 41:
                    roleName = getRoleNameFromPath(pathname);
                    if (!roleName) return [3 /*break*/, 43];
                    return [4 /*yield*/, deleteRole(roleName)];
                case 42:
                    _c.sent();
                    writeJson(res, 200, { ok: true });
                    return [2 /*return*/];
                case 43:
                    writeJson(res, 404, { error: 'Not found' });
                    return [3 /*break*/, 45];
                case 44:
                    error_3 = _c.sent();
                    err = error_3;
                    if (err.code === 'JSON_PARSE_ERROR' || err.code === 'VALIDATION_ERROR') {
                        writeJson(res, 400, { error: err.message || 'Invalid request' });
                        return [2 /*return*/];
                    }
                    if (err.code === 'ROLE_IN_USE') {
                        writeJson(res, 409, { error: err.message || 'Role in use', count: (_b = err.count) !== null && _b !== void 0 ? _b : 0 });
                        return [2 /*return*/];
                    }
                    if (err.code === 'ROLE_NOT_FOUND' || err.code === 'P2025') {
                        writeJson(res, 404, { error: err.message || 'Not found' });
                        return [2 /*return*/];
                    }
                    if (err.code === 'ROLE_EXISTS' || err.code === 'P2002') {
                        writeJson(res, 409, { error: err.message || 'Already exists' });
                        return [2 /*return*/];
                    }
                    if (err.code === 'AUTH_INVALID_TOKEN' || err.code === 'AUTH_CONFIG_MISSING') {
                        writeJson(res, 401, { error: err.message || 'Authentication failed' });
                        return [2 /*return*/];
                    }
                    if (err.code === 'AUTH_NOT_MAPPED') {
                        writeJson(res, 403, { error: err.message || 'User is not mapped to a company' });
                        return [2 /*return*/];
                    }
                    if (err.code === 'AZURE_SQL_CONFIG_MISSING') {
                        writeJson(res, 500, { error: err.message || 'Azure SQL auth config missing' });
                        return [2 /*return*/];
                    }
                    if (err.code === 'AZURE_SQL_UNAVAILABLE' || err.code === 'ETIMEOUT' || err.code === 'ESOCKET' || err.code === 'ELOGIN') {
                        writeJson(res, 503, { error: 'Azure SQL unavailable' });
                        return [2 /*return*/];
                    }
                    if (isPrismaUnavailable(err.code)) {
                        writeJson(res, 503, { error: 'Database unavailable' });
                        return [2 /*return*/];
                    }
                    writeJson(res, 500, { error: err.message || 'Request failed' });
                    return [3 /*break*/, 45];
                case 45: return [2 /*return*/];
            }
        });
    }); };
}
