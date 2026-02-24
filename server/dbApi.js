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
import { createCipheriv, createDecipheriv, createHash, createHmac, createPublicKey, randomBytes, randomUUID, verify } from 'node:crypto';
import mssql from 'mssql';
import nodemailer from 'nodemailer';
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
function getCompanyUserInviteIdFromPath(pathname) {
    var match = pathname.match(/^\/api\/db\/company-users\/([^/]+)\/invite$/);
    if (!match) {
        return null;
    }
    return decodeURIComponent(match[1]);
}
function getServiceUserIdFromPath(pathname) {
    var match = pathname.match(/^\/api\/db\/service-users\/([^/]+)$/);
    if (!match) {
        return null;
    }
    return decodeURIComponent(match[1]);
}
function getPendingDeviceIdFromPath(pathname) {
    var match = pathname.match(/^\/api\/auth\/devices\/([^/]+)\/(approve|reject)$/);
    if (!match)
        return null;
    return decodeURIComponent(match[1]);
}
function getPendingDeviceActionFromPath(pathname) {
    var match = pathname.match(/^\/api\/auth\/devices\/([^/]+)\/(approve|reject)$/);
    if (!match)
        return null;
    return match[2] === 'approve' ? 'approve' : 'reject';
}
function isPrismaUnavailable(errorCode) {
    return errorCode === 'P1001' || errorCode === 'P1002' || errorCode === 'P1008';
}
var authSessions = new Map();
var emailLoginTokens = new Map();
var emailLoginRequests = new Map();
var pendingLoginChallenges = new Map();
var AUTH_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
var EMAIL_MAGIC_TOKEN_TTL_MS = 10 * 60 * 1000;
var EMAIL_MAGIC_REQUEST_WINDOW_MS = 10 * 60 * 1000;
var EMAIL_MAGIC_REQUEST_LIMIT = 5;
var LOGIN_CHALLENGE_TTL_MS = 10 * 60 * 1000;
var TOTP_STEP_SECONDS = 30;
var TOTP_DIGITS = 6;
var TOTP_ALLOWED_WINDOWS = [-1, 0, 1];
var TOTP_ISSUER = 'HALO';
var OPENID_KEYS_URL = 'https://login.microsoftonline.com/common/discovery/v2.0/keys';
var jwksCache = new Map();
var azureSqlPoolPromise = null;
var hasStaffAvatarColumnCache = null;
var hasClientKeyWorkerColumnCache = null;
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
function hasStaffAvatarColumn() {
    return __awaiter(this, void 0, void 0, function () {
        var pool, rows;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (hasStaffAvatarColumnCache !== null) {
                        return [2 /*return*/, hasStaffAvatarColumnCache];
                    }
                    return [4 /*yield*/, getAzureSqlPool()];
                case 1:
                    pool = _b.sent();
                    return [4 /*yield*/, pool.request().query("\n      SELECT CASE WHEN COL_LENGTH('People.Staff', 'AvatarUrl') IS NULL THEN 0 ELSE 1 END AS hasColumn\n    ")];
                case 2:
                    rows = (_b.sent()).recordset;
                    hasStaffAvatarColumnCache = Boolean((_a = rows[0]) === null || _a === void 0 ? void 0 : _a.hasColumn);
                    return [2 /*return*/, hasStaffAvatarColumnCache];
            }
        });
    });
}
function hasClientKeyWorkerColumn() {
    return __awaiter(this, void 0, void 0, function () {
        var pool, rows;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (hasClientKeyWorkerColumnCache !== null) {
                        return [2 /*return*/, hasClientKeyWorkerColumnCache];
                    }
                    return [4 /*yield*/, getAzureSqlPool()];
                case 1:
                    pool = _b.sent();
                    return [4 /*yield*/, pool.request().query("\n      SELECT CASE WHEN COL_LENGTH('People.Clients', 'KeyWorkerName') IS NULL THEN 0 ELSE 1 END AS hasColumn\n    ")];
                case 2:
                    rows = (_b.sent()).recordset;
                    hasClientKeyWorkerColumnCache = Boolean((_a = rows[0]) === null || _a === void 0 ? void 0 : _a.hasColumn);
                    return [2 /*return*/, hasClientKeyWorkerColumnCache];
            }
        });
    });
}
function getTotpEncryptionKey() {
    var raw = readString(process.env.AUTH_TOTP_ENCRYPTION_KEY);
    if (!raw) {
        throw Object.assign(new Error('Server missing AUTH_TOTP_ENCRYPTION_KEY'), { code: 'AUTH_CONFIG_MISSING' });
    }
    try {
        var decoded = Buffer.from(raw, 'base64');
        if (decoded.length !== 32) {
            throw new Error('Invalid key length');
        }
        return decoded;
    }
    catch (_a) {
        throw Object.assign(new Error('AUTH_TOTP_ENCRYPTION_KEY must be base64-encoded 32 bytes'), {
            code: 'AUTH_CONFIG_MISSING'
        });
    }
}
function encryptTotpSecret(secret) {
    var key = getTotpEncryptionKey();
    var iv = randomBytes(12);
    var cipher = createCipheriv('aes-256-gcm', key, iv);
    var encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    var tag = cipher.getAuthTag();
    return "".concat(iv.toString('base64url'), ".").concat(tag.toString('base64url'), ".").concat(encrypted.toString('base64url'));
}
function decryptTotpSecret(payload) {
    var key = getTotpEncryptionKey();
    var _a = payload.split('.'), ivB64 = _a[0], tagB64 = _a[1], dataB64 = _a[2];
    if (!ivB64 || !tagB64 || !dataB64) {
        throw Object.assign(new Error('Invalid TOTP payload'), { code: 'AUTH_INVALID_TOKEN' });
    }
    var iv = Buffer.from(ivB64, 'base64url');
    var tag = Buffer.from(tagB64, 'base64url');
    var encrypted = Buffer.from(dataB64, 'base64url');
    var decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    var decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
}
var BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function encodeBase32(input) {
    var bits = 0;
    var value = 0;
    var output = '';
    for (var i = 0; i < input.length; i += 1) {
        var byte = input[i];
        value = (value << 8) | byte;
        bits += 8;
        while (bits >= 5) {
            output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    if (bits > 0) {
        output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
    }
    return output;
}
function decodeBase32(input) {
    var cleaned = input.toUpperCase().replace(/=+$/g, '').replace(/[^A-Z2-7]/g, '');
    var bits = 0;
    var value = 0;
    var out = [];
    for (var _i = 0, cleaned_1 = cleaned; _i < cleaned_1.length; _i++) {
        var char = cleaned_1[_i];
        var idx = BASE32_ALPHABET.indexOf(char);
        if (idx < 0)
            continue;
        value = (value << 5) | idx;
        bits += 5;
        if (bits >= 8) {
            out.push((value >>> (bits - 8)) & 0xff);
            bits -= 8;
        }
    }
    return Buffer.from(out);
}
function generateTotpSecret() {
    return encodeBase32(randomBytes(20));
}
function generateTotpCode(secretBase32, timestampMs) {
    var counter = Math.floor(timestampMs / 1000 / TOTP_STEP_SECONDS);
    var key = decodeBase32(secretBase32);
    var msg = Buffer.alloc(8);
    msg.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
    msg.writeUInt32BE(counter % 0x100000000, 4);
    var hmac = createHmac('sha1', key).update(msg).digest();
    var offset = hmac[hmac.length - 1] & 0x0f;
    var binary = ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff);
    var otp = binary % Math.pow(10, TOTP_DIGITS);
    return otp.toString().padStart(TOTP_DIGITS, '0');
}
function verifyTotpCode(secretBase32, code) {
    var normalized = code.trim();
    if (!/^\d{6}$/.test(normalized))
        return false;
    return TOTP_ALLOWED_WINDOWS.some(function (windowOffset) {
        var comparison = generateTotpCode(secretBase32, Date.now() + windowOffset * TOTP_STEP_SECONDS * 1000);
        return comparison === normalized;
    });
}
function ensureAuthSecurityTables() {
    return __awaiter(this, void 0, void 0, function () {
        var pool;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getAzureSqlPool()];
                case 1:
                    pool = _a.sent();
                    return [4 /*yield*/, pool.request().query("\n    IF OBJECT_ID('Auth.UserMfa', 'U') IS NULL\n    BEGIN\n      CREATE TABLE Auth.UserMfa (\n        UserID INT NOT NULL PRIMARY KEY,\n        TotpSecretEncrypted NVARCHAR(512) NOT NULL,\n        Enabled BIT NOT NULL CONSTRAINT DF_UserMfa_Enabled DEFAULT (1),\n        CreatedDate DATETIME2(7) NOT NULL CONSTRAINT DF_UserMfa_Created DEFAULT SYSUTCDATETIME(),\n        ModifiedDate DATETIME2(7) NOT NULL CONSTRAINT DF_UserMfa_Modified DEFAULT SYSUTCDATETIME()\n      );\n    END;\n\n    IF OBJECT_ID('Auth.UserDevice', 'U') IS NULL\n    BEGIN\n      CREATE TABLE Auth.UserDevice (\n        DeviceID UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_UserDevice_DeviceID DEFAULT NEWID() PRIMARY KEY,\n        UserID INT NOT NULL,\n        CompanyID INT NOT NULL,\n        FingerprintHash CHAR(64) NOT NULL,\n        DeviceLabel NVARCHAR(200) NOT NULL,\n        Status NVARCHAR(20) NOT NULL CONSTRAINT DF_UserDevice_Status DEFAULT N'Pending',\n        RequestedAt DATETIME2(7) NOT NULL CONSTRAINT DF_UserDevice_RequestedAt DEFAULT SYSUTCDATETIME(),\n        ApprovedAt DATETIME2(7) NULL,\n        ApprovedByUserID INT NULL,\n        LastSeenAt DATETIME2(7) NULL\n      );\n      CREATE UNIQUE INDEX UX_UserDevice_User_Fingerprint ON Auth.UserDevice(UserID, CompanyID, FingerprintHash);\n      CREATE INDEX IX_UserDevice_Company_Status ON Auth.UserDevice(CompanyID, Status, RequestedAt DESC);\n    END;\n  ")];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
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
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
function hashMagicToken(token) {
    return createHash('sha256').update(token).digest('hex');
}
function removeExpiredMagicTokens() {
    var now = Date.now();
    emailLoginTokens.forEach(function (token, key) {
        if (token.expiresAt <= now || token.usedAt) {
            emailLoginTokens.delete(key);
        }
    });
}
function checkMagicLinkRateLimit(email) {
    var _a;
    var now = Date.now();
    var key = normalizeEmail(email);
    var history = (_a = emailLoginRequests.get(key)) !== null && _a !== void 0 ? _a : [];
    var fresh = history.filter(function (entry) { return now - entry <= EMAIL_MAGIC_REQUEST_WINDOW_MS; });
    if (fresh.length >= EMAIL_MAGIC_REQUEST_LIMIT) {
        throw Object.assign(new Error('Too many magic link requests. Please wait and try again.'), { code: 'AUTH_MAGIC_RATE_LIMITED' });
    }
    fresh.push(now);
    emailLoginRequests.set(key, fresh);
}
function getEmailMagicConfig() {
    var smtpHost = readString(process.env.SMTP_HOST);
    var smtpPort = Number.parseInt(readString(process.env.SMTP_PORT || '587'), 10);
    var smtpSecure = readString(process.env.SMTP_SECURE).toLowerCase() === 'true';
    var smtpUser = readString(process.env.SMTP_USER);
    var smtpPass = readString(process.env.SMTP_PASS);
    var fromEmail = readString(process.env.SMTP_FROM_EMAIL);
    var appBaseUrl = readString(process.env.APP_BASE_URL || process.env.VITE_AZURE_REDIRECT_URI);
    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !fromEmail || !appBaseUrl) {
        throw Object.assign(new Error('Magic link email not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL, APP_BASE_URL.'), { code: 'AUTH_MAGIC_CONFIG_MISSING' });
    }
    return {
        smtpHost: smtpHost,
        smtpPort: smtpPort,
        smtpSecure: smtpSecure,
        smtpUser: smtpUser,
        smtpPass: smtpPass,
        fromEmail: fromEmail,
        appBaseUrl: appBaseUrl
    };
}
function sendMagicLinkEmail(email, link) {
    return __awaiter(this, void 0, void 0, function () {
        var config, transporter, info;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    config = getEmailMagicConfig();
                    transporter = nodemailer.createTransport({
                        host: config.smtpHost,
                        port: config.smtpPort,
                        secure: config.smtpSecure,
                        auth: {
                            user: config.smtpUser,
                            pass: config.smtpPass
                        }
                    });
                    return [4 /*yield*/, transporter.sendMail({
                            from: config.fromEmail,
                            to: email,
                            subject: 'Your HALO sign-in link',
                            text: "Use this link to sign in to HALO:\n\n".concat(link, "\n\nThis link expires in 10 minutes and can be used once."),
                            html: "<p>Use this link to sign in to HALO:</p><p><a href=\"".concat(link, "\">").concat(link, "</a></p><p>This link expires in 10 minutes and can be used once.</p>")
                        })];
                case 1:
                    info = _a.sent();
                    if (!info.messageId) {
                        throw Object.assign(new Error('Magic link email failed to send'), { code: 'AUTH_MAGIC_SEND_FAILED' });
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function findLoginUserByEmail(email) {
    return __awaiter(this, void 0, void 0, function () {
        var normalizedEmail, pool, rows;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    normalizedEmail = normalizeEmail(email);
                    if (!normalizedEmail)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, getAzureSqlPool()];
                case 1:
                    pool = _b.sent();
                    return [4 /*yield*/, pool.request()
                            .input('email', mssql.NVarChar(320), normalizedEmail)
                            .query("\n        SELECT TOP 1\n          ua.UserID AS userId,\n          ua.CompanyID AS companyId,\n          ua.StaffID AS staffId,\n          ua.Username AS username,\n          ua.AccountStatus AS accountStatus,\n          s.FirstName AS firstName,\n          s.LastName AS lastName,\n          s.Email AS staffEmail,\n          c.CompanyName AS companyName\n        FROM Auth.UserAccount ua\n        INNER JOIN People.Company c ON c.CompanyID = ua.CompanyID\n        LEFT JOIN People.Staff s ON s.StaffID = ua.StaffID\n        WHERE LOWER(ua.Username) = LOWER(@email)\n          AND ISNULL(c.ActiveStatus, 1) = 1\n          AND ISNULL(ua.AccountStatus, N'Active') = N'Active'\n      ")];
                case 2:
                    rows = (_b.sent()).recordset;
                    return [2 /*return*/, (_a = rows[0]) !== null && _a !== void 0 ? _a : null];
            }
        });
    });
}
function getUserTotpSecret(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var pool, rows, entry;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ensureAuthSecurityTables()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, getAzureSqlPool()];
                case 2:
                    pool = _a.sent();
                    return [4 /*yield*/, pool.request().input('userId', mssql.Int, userId).query("\n      SELECT TOP 1 TotpSecretEncrypted AS secret, Enabled AS enabled\n      FROM Auth.UserMfa\n      WHERE UserID = @userId\n    ")];
                case 3:
                    rows = (_a.sent()).recordset;
                    entry = rows[0];
                    if (!(entry === null || entry === void 0 ? void 0 : entry.secret) || !entry.enabled)
                        return [2 /*return*/, null];
                    return [2 /*return*/, decryptTotpSecret(entry.secret)];
            }
        });
    });
}
function setUserTotpSecret(userId, secretBase32) {
    return __awaiter(this, void 0, void 0, function () {
        var encrypted, pool;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ensureAuthSecurityTables()];
                case 1:
                    _a.sent();
                    encrypted = encryptTotpSecret(secretBase32);
                    return [4 /*yield*/, getAzureSqlPool()];
                case 2:
                    pool = _a.sent();
                    return [4 /*yield*/, pool.request()
                            .input('userId', mssql.Int, userId)
                            .input('secret', mssql.NVarChar(512), encrypted)
                            .query("\n      IF EXISTS (SELECT 1 FROM Auth.UserMfa WHERE UserID = @userId)\n      BEGIN\n        UPDATE Auth.UserMfa\n        SET TotpSecretEncrypted = @secret,\n            Enabled = 1,\n            ModifiedDate = SYSUTCDATETIME()\n        WHERE UserID = @userId\n      END\n      ELSE\n      BEGIN\n        INSERT INTO Auth.UserMfa (UserID, TotpSecretEncrypted, Enabled, CreatedDate, ModifiedDate)\n        VALUES (@userId, @secret, 1, SYSUTCDATETIME(), SYSUTCDATETIME())\n      END\n    ")];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function hashDeviceFingerprint(rawFingerprint) {
    return createHash('sha256').update(rawFingerprint).digest('hex');
}
function getOrCreateUserDevice(params) {
    return __awaiter(this, void 0, void 0, function () {
        var pool, existing, created;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ensureAuthSecurityTables()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, getAzureSqlPool()];
                case 2:
                    pool = _a.sent();
                    return [4 /*yield*/, pool.request()
                            .input('userId', mssql.Int, params.userId)
                            .input('companyId', mssql.Int, params.companyId)
                            .input('fingerprintHash', mssql.Char(64), params.fingerprintHash)
                            .query("\n        SELECT TOP 1 CAST(DeviceID AS NVARCHAR(36)) AS deviceId, Status AS status\n        FROM Auth.UserDevice\n        WHERE UserID = @userId\n          AND CompanyID = @companyId\n          AND FingerprintHash = @fingerprintHash\n      ")];
                case 3:
                    existing = (_a.sent()).recordset[0];
                    if (existing) {
                        return [2 /*return*/, existing];
                    }
                    return [4 /*yield*/, pool.request()
                            .input('userId', mssql.Int, params.userId)
                            .input('companyId', mssql.Int, params.companyId)
                            .input('fingerprintHash', mssql.Char(64), params.fingerprintHash)
                            .input('deviceLabel', mssql.NVarChar(200), params.deviceLabel || 'Unknown device')
                            .query("\n        INSERT INTO Auth.UserDevice (\n          UserID,\n          CompanyID,\n          FingerprintHash,\n          DeviceLabel,\n          Status,\n          RequestedAt\n        )\n        OUTPUT CAST(inserted.DeviceID AS NVARCHAR(36)) AS deviceId, inserted.Status AS status\n        VALUES (\n          @userId,\n          @companyId,\n          @fingerprintHash,\n          @deviceLabel,\n          N'Pending',\n          SYSUTCDATETIME()\n        )\n      ")];
                case 4:
                    created = (_a.sent()).recordset[0];
                    return [2 /*return*/, created];
            }
        });
    });
}
function markDeviceLastSeen(deviceId) {
    return __awaiter(this, void 0, void 0, function () {
        var pool;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ensureAuthSecurityTables()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, getAzureSqlPool()];
                case 2:
                    pool = _a.sent();
                    return [4 /*yield*/, pool.request().input('deviceId', mssql.UniqueIdentifier, deviceId).query("\n    UPDATE Auth.UserDevice\n    SET LastSeenAt = SYSUTCDATETIME()\n    WHERE DeviceID = @deviceId\n  ")];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function isAdminRole(roles) {
    return roles.some(function (role) {
        var normalized = role.toLowerCase();
        return normalized.includes('admin') || normalized.includes('manager');
    });
}
function listPendingDevices(companyId) {
    return __awaiter(this, void 0, void 0, function () {
        var pool, rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ensureAuthSecurityTables()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, getAzureSqlPool()];
                case 2:
                    pool = _a.sent();
                    return [4 /*yield*/, pool.request().input('companyId', mssql.Int, companyId).query("\n      SELECT\n        CAST(d.DeviceID AS NVARCHAR(36)) AS deviceId,\n        d.UserID AS userId,\n        ua.Username AS username,\n        LTRIM(RTRIM(CONCAT(ISNULL(s.FirstName, N''), N' ', ISNULL(s.LastName, N'')))) AS displayName,\n        c.CompanyName AS companyName,\n        d.DeviceLabel AS deviceLabel,\n        d.Status AS status,\n        CONVERT(NVARCHAR(30), d.RequestedAt, 127) AS requestedAt\n      FROM Auth.UserDevice d\n      INNER JOIN Auth.UserAccount ua\n        ON ua.UserID = d.UserID\n       AND ua.CompanyID = d.CompanyID\n      INNER JOIN People.Company c\n        ON c.CompanyID = d.CompanyID\n      LEFT JOIN People.Staff s\n        ON s.StaffID = ua.StaffID\n      WHERE d.CompanyID = @companyId\n        AND d.Status = N'Pending'\n      ORDER BY d.RequestedAt DESC\n    ")];
                case 3:
                    rows = (_a.sent()).recordset;
                    return [2 /*return*/, rows];
            }
        });
    });
}
function setDeviceStatus(companyId, deviceId, adminUserId, status) {
    return __awaiter(this, void 0, void 0, function () {
        var pool;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ensureAuthSecurityTables()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, getAzureSqlPool()];
                case 2:
                    pool = _a.sent();
                    return [4 /*yield*/, pool.request()
                            .input('companyId', mssql.Int, companyId)
                            .input('deviceId', mssql.UniqueIdentifier, deviceId)
                            .input('adminUserId', mssql.Int, adminUserId)
                            .input('status', mssql.NVarChar(20), status)
                            .query("\n      UPDATE Auth.UserDevice\n      SET Status = @status,\n          ApprovedByUserID = @adminUserId,\n          ApprovedAt = SYSUTCDATETIME()\n      WHERE CompanyID = @companyId\n        AND DeviceID = @deviceId\n    ")];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function loadUserRoles(userId, companyId) {
    return __awaiter(this, void 0, void 0, function () {
        var pool, rolesRows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getAzureSqlPool()];
                case 1:
                    pool = _a.sent();
                    return [4 /*yield*/, pool.request()
                            .input('userId', mssql.Int, userId)
                            .input('companyId', mssql.Int, companyId)
                            .query("\n        SELECT ur.RoleName AS roleName\n        FROM Auth.UserRoleAssignment ura\n        INNER JOIN Auth.UserRole ur\n          ON ur.RoleID = ura.RoleID\n         AND ur.CompanyID = ura.CompanyID\n        WHERE ura.UserID = @userId\n          AND ura.CompanyID = @companyId\n          AND (ura.ExpiryDate IS NULL OR ura.ExpiryDate >= CAST(SYSUTCDATETIME() AS date))\n          AND ISNULL(ur.IsActive, 1) = 1\n      ")];
                case 2:
                    rolesRows = (_a.sent()).recordset;
                    return [2 /*return*/, uniqueSorted(rolesRows.map(function (role) { return readString(role.roleName); }))];
            }
        });
    });
}
function issueSession(user, roles) {
    var displayNameFromStaff = [readString(user.firstName), readString(user.lastName)].filter(Boolean).join(' ').trim();
    var displayName = displayNameFromStaff || user.username;
    var sessionToken = randomUUID();
    var expiresAt = Date.now() + AUTH_SESSION_TTL_MS;
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
    return {
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
    };
}
function requestMagicLink(email) {
    return __awaiter(this, void 0, void 0, function () {
        var normalizedEmail, user, token, tokenHash, expiresAt, config, link;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    normalizedEmail = normalizeEmail(email);
                    if (!normalizedEmail) {
                        throw Object.assign(new Error('Email is required'), { code: 'VALIDATION_ERROR' });
                    }
                    checkMagicLinkRateLimit(normalizedEmail);
                    return [4 /*yield*/, findLoginUserByEmail(normalizedEmail)];
                case 1:
                    user = _a.sent();
                    // Prevent account enumeration.
                    if (!user)
                        return [2 /*return*/];
                    removeExpiredMagicTokens();
                    token = randomBytes(32).toString('base64url');
                    tokenHash = hashMagicToken(token);
                    expiresAt = Date.now() + EMAIL_MAGIC_TOKEN_TTL_MS;
                    config = getEmailMagicConfig();
                    link = "".concat(config.appBaseUrl.replace(/\/$/, ''), "/login?magic_token=").concat(encodeURIComponent(token));
                    emailLoginTokens.forEach(function (entry, key) {
                        if (entry.email === normalizedEmail) {
                            emailLoginTokens.delete(key);
                        }
                    });
                    emailLoginTokens.set(tokenHash, {
                        email: normalizedEmail,
                        tokenHash: tokenHash,
                        createdAt: Date.now(),
                        expiresAt: expiresAt,
                        usedAt: null
                    });
                    return [4 /*yield*/, sendMagicLinkEmail(normalizedEmail, link)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function removeExpiredChallenges() {
    var now = Date.now();
    pendingLoginChallenges.forEach(function (challenge, key) {
        if (challenge.expiresAt <= now)
            pendingLoginChallenges.delete(key);
    });
}
function getLoginChallenge(challengeToken) {
    removeExpiredChallenges();
    var challenge = pendingLoginChallenges.get(challengeToken);
    if (!challenge || challenge.expiresAt <= Date.now()) {
        throw Object.assign(new Error('Login challenge expired. Please request a new sign-in link.'), {
            code: 'AUTH_MAGIC_INVALID'
        });
    }
    return challenge;
}
function verifyMagicLink(token) {
    return __awaiter(this, void 0, void 0, function () {
        var normalizedToken, tokenHash, entry, user, roles, challengeToken, expiresAt, existingSecret;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    normalizedToken = token.trim();
                    if (!normalizedToken) {
                        throw Object.assign(new Error('Missing token'), { code: 'VALIDATION_ERROR' });
                    }
                    removeExpiredMagicTokens();
                    tokenHash = hashMagicToken(normalizedToken);
                    entry = emailLoginTokens.get(tokenHash);
                    if (!entry || entry.usedAt || entry.expiresAt < Date.now()) {
                        throw Object.assign(new Error('Magic link is invalid or expired.'), { code: 'AUTH_MAGIC_INVALID' });
                    }
                    return [4 /*yield*/, findLoginUserByEmail(entry.email)];
                case 1:
                    user = _a.sent();
                    if (!user) {
                        throw Object.assign(new Error('Magic link is invalid or expired.'), { code: 'AUTH_MAGIC_INVALID' });
                    }
                    return [4 /*yield*/, loadUserRoles(user.userId, user.companyId)];
                case 2:
                    roles = _a.sent();
                    entry.usedAt = Date.now();
                    emailLoginTokens.delete(tokenHash);
                    removeExpiredChallenges();
                    challengeToken = randomUUID();
                    expiresAt = Date.now() + LOGIN_CHALLENGE_TTL_MS;
                    pendingLoginChallenges.set(challengeToken, {
                        challengeToken: challengeToken,
                        user: user,
                        roles: roles,
                        expiresAt: expiresAt
                    });
                    return [4 /*yield*/, getUserTotpSecret(user.userId)];
                case 3:
                    existingSecret = _a.sent();
                    return [2 /*return*/, {
                            challengeToken: challengeToken,
                            expiresAt: new Date(expiresAt).toISOString(),
                            requiresTotpSetup: !existingSecret
                        }];
            }
        });
    });
}
function createTotpSetup(challengeToken) {
    return __awaiter(this, void 0, void 0, function () {
        var challenge, existingSecret, secret;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    challenge = getLoginChallenge(challengeToken);
                    return [4 /*yield*/, getUserTotpSecret(challenge.user.userId)];
                case 1:
                    existingSecret = _a.sent();
                    if (existingSecret) {
                        return [2 /*return*/, {
                                challengeToken: challengeToken,
                                manualKey: existingSecret,
                                otpauthUri: "otpauth://totp/".concat(encodeURIComponent("".concat(TOTP_ISSUER, ":").concat(challenge.user.username)), "?secret=").concat(existingSecret, "&issuer=").concat(encodeURIComponent(TOTP_ISSUER), "&digits=").concat(TOTP_DIGITS, "&period=").concat(TOTP_STEP_SECONDS)
                            }];
                    }
                    secret = challenge.totpSeed || generateTotpSecret();
                    challenge.totpSeed = secret;
                    pendingLoginChallenges.set(challengeToken, challenge);
                    return [2 /*return*/, {
                            challengeToken: challengeToken,
                            manualKey: secret,
                            otpauthUri: "otpauth://totp/".concat(encodeURIComponent("".concat(TOTP_ISSUER, ":").concat(challenge.user.username)), "?secret=").concat(secret, "&issuer=").concat(encodeURIComponent(TOTP_ISSUER), "&digits=").concat(TOTP_DIGITS, "&period=").concat(TOTP_STEP_SECONDS)
                        }];
            }
        });
    });
}
function enableTotp(challengeToken, code) {
    return __awaiter(this, void 0, void 0, function () {
        var challenge, secret, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    challenge = getLoginChallenge(challengeToken);
                    _a = challenge.totpSeed;
                    if (_a) return [3 /*break*/, 2];
                    return [4 /*yield*/, getUserTotpSecret(challenge.user.userId)];
                case 1:
                    _a = (_b.sent());
                    _b.label = 2;
                case 2:
                    secret = _a;
                    if (!secret) {
                        throw Object.assign(new Error('TOTP setup is required before verification.'), { code: 'VALIDATION_ERROR' });
                    }
                    if (!verifyTotpCode(secret, code)) {
                        throw Object.assign(new Error('Invalid authenticator code.'), { code: 'AUTH_MAGIC_INVALID' });
                    }
                    return [4 /*yield*/, setUserTotpSecret(challenge.user.userId, secret)];
                case 3:
                    _b.sent();
                    challenge.totpSeed = undefined;
                    pendingLoginChallenges.set(challengeToken, challenge);
                    return [2 /*return*/];
            }
        });
    });
}
function completeMagicLogin(params) {
    return __awaiter(this, void 0, void 0, function () {
        var challenge, secret, fingerprintRaw, fingerprintHash, device;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    challenge = getLoginChallenge(params.challengeToken);
                    return [4 /*yield*/, getUserTotpSecret(challenge.user.userId)];
                case 1:
                    secret = _a.sent();
                    if (!secret) {
                        throw Object.assign(new Error('Authenticator setup required.'), { code: 'AUTH_MAGIC_INVALID' });
                    }
                    if (!verifyTotpCode(secret, params.code)) {
                        throw Object.assign(new Error('Invalid authenticator code.'), { code: 'AUTH_MAGIC_INVALID' });
                    }
                    fingerprintRaw = params.deviceFingerprint.trim();
                    if (fingerprintRaw.length < 12) {
                        throw Object.assign(new Error('Device fingerprint missing.'), { code: 'VALIDATION_ERROR' });
                    }
                    fingerprintHash = hashDeviceFingerprint(fingerprintRaw);
                    return [4 /*yield*/, getOrCreateUserDevice({
                            userId: challenge.user.userId,
                            companyId: challenge.user.companyId,
                            fingerprintHash: fingerprintHash,
                            deviceLabel: params.deviceLabel.trim() || 'Unknown device'
                        })];
                case 2:
                    device = _a.sent();
                    if (device.status !== 'Approved') {
                        return [2 /*return*/, { pendingApproval: true }];
                    }
                    return [4 /*yield*/, markDeviceLastSeen(device.deviceId)];
                case 3:
                    _a.sent();
                    pendingLoginChallenges.delete(params.challengeToken);
                    return [2 /*return*/, { session: issueSession(challenge.user, challenge.roles) }];
            }
        });
    });
}
function sanitizeCompanyUserBody(body) {
    return {
        name: readString(body.name),
        email: readString(body.email),
        phone: readString(body.phone),
        role: readString(body.role),
        status: readString(body.status),
        lineManager: readString(body.lineManager),
        isLineManager: Boolean(body.isLineManager),
        avatarUrl: readString(body.avatarUrl)
    };
}
function sanitizeCreateServiceUserBody(body) {
    var activeStatusRaw = body.activeStatus;
    var activeStatus = typeof activeStatusRaw === 'boolean'
        ? activeStatusRaw
        : readString(activeStatusRaw).toLowerCase() !== 'false';
    return {
        firstName: readString(body.firstName),
        lastName: readString(body.lastName),
        clientType: readString(body.clientType),
        dateOfBirth: readString(body.dateOfBirth),
        gender: readString(body.gender),
        email: readString(body.email),
        phone: readString(body.phone),
        mobilePhone: readString(body.mobilePhone),
        address: readString(body.address),
        nhsNumber: readString(body.nhsNumber),
        gpDetails: readString(body.gpDetails),
        riskLevel: readString(body.riskLevel),
        fundingSource: readString(body.fundingSource),
        activeStatus: activeStatus,
        dischargeDate: readString(body.dischargeDate)
    };
}
function sanitizeUpdateServiceUserBody(body) {
    var payload = {};
    if ('clientType' in body)
        payload.clientType = readString(body.clientType);
    if ('dischargeDate' in body)
        payload.dischargeDate = readString(body.dischargeDate);
    if ('keyWorker' in body)
        payload.keyWorker = readString(body.keyWorker);
    if ('activeStatus' in body) {
        var activeStatusRaw = body.activeStatus;
        payload.activeStatus =
            typeof activeStatusRaw === 'boolean'
                ? activeStatusRaw
                : readString(activeStatusRaw).toLowerCase() !== 'false';
    }
    if ('firstName' in body)
        payload.firstName = readString(body.firstName);
    if ('lastName' in body)
        payload.lastName = readString(body.lastName);
    if ('dateOfBirth' in body)
        payload.dateOfBirth = readString(body.dateOfBirth);
    if ('gender' in body)
        payload.gender = readString(body.gender);
    if ('email' in body)
        payload.email = readString(body.email);
    if ('phone' in body)
        payload.phone = readString(body.phone);
    if ('mobilePhone' in body)
        payload.mobilePhone = readString(body.mobilePhone);
    if ('address' in body)
        payload.address = readString(body.address);
    if ('nhsNumber' in body)
        payload.nhsNumber = readString(body.nhsNumber);
    if ('gpDetails' in body)
        payload.gpDetails = readString(body.gpDetails);
    if ('riskLevel' in body)
        payload.riskLevel = readString(body.riskLevel);
    if ('fundingSource' in body)
        payload.fundingSource = readString(body.fundingSource);
    if ('preferredName' in body)
        payload.preferredName = readString(body.preferredName);
    if ('maritalStatus' in body)
        payload.maritalStatus = readString(body.maritalStatus);
    if ('birthplace' in body)
        payload.birthplace = readString(body.birthplace);
    if ('nationality' in body)
        payload.nationality = readString(body.nationality);
    if ('languagesSpoken' in body)
        payload.languagesSpoken = readString(body.languagesSpoken);
    if ('ethnicity' in body)
        payload.ethnicity = readString(body.ethnicity);
    if ('religion' in body)
        payload.religion = readString(body.religion);
    if ('carerGenderPreference' in body)
        payload.carerGenderPreference = readString(body.carerGenderPreference);
    if ('carerNote' in body)
        payload.carerNote = readString(body.carerNote);
    if ('emergencyContactName' in body)
        payload.emergencyContactName = readString(body.emergencyContactName);
    if ('emergencyContactPhone' in body)
        payload.emergencyContactPhone = readString(body.emergencyContactPhone);
    if ('emergencyContactRelation' in body)
        payload.emergencyContactRelation = readString(body.emergencyContactRelation);
    if ('preferredContactMethod' in body)
        payload.preferredContactMethod = readString(body.preferredContactMethod);
    return payload;
}
function supportTierFromRisk(riskLevel) {
    var value = riskLevel.trim().toLowerCase();
    if (value === 'high')
        return 'Enhanced';
    if (value === 'medium')
        return 'Standard';
    return 'Light';
}
function mapServiceUserStatus(active, dischargeDate) {
    if (dischargeDate)
        return 'discharged';
    return active ? 'active' : 'inactive';
}
function toIsoDate(value) {
    if (!value)
        return new Date().toISOString().slice(0, 10);
    return value.toISOString().slice(0, 10);
}
function mapServiceUserRow(row) {
    var _a;
    var name = [readString(row.firstName), readString(row.lastName)].filter(Boolean).join(' ').trim() || "Client ".concat(row.clientId);
    var status = mapServiceUserStatus(Boolean(row.activeStatus), row.dischargeDate);
    var zone = readString(row.clientType) || 'General';
    var addressValue = readString(row.address);
    var predefinedBuildingZones = new Set(['Maple House', 'Harbor Court', 'Cedar Lodge', 'Orchard View', 'Orbit Place']);
    var unit = predefinedBuildingZones.has(zone)
        ? ((_a = addressValue.split(',')[0]) === null || _a === void 0 ? void 0 : _a.trim()) || "Client ".concat(row.clientId)
        : addressValue || "Client ".concat(row.clientId);
    var risk = readString(row.riskLevel);
    var flags = risk.toLowerCase() === 'high' ? ['Behaviour support'] : [];
    return {
        id: String(row.clientId),
        name: name,
        status: status,
        zone: zone,
        unit: unit,
        keyWorker: readString(row.keyWorkerName) || 'Unassigned',
        supportTier: supportTierFromRisk(risk),
        lastCheckIn: toIsoDate(row.modifiedDate),
        mood: 'ok',
        moodUpdated: row.modifiedDate ? 'updated recently' : 'not recorded',
        flags: flags,
        firstName: readString(row.firstName),
        lastName: readString(row.lastName),
        dateOfBirth: row.dateOfBirth ? row.dateOfBirth.toISOString().slice(0, 10) : '',
        gender: readString(row.gender),
        email: readString(row.email),
        phone: readString(row.phone),
        mobilePhone: readString(row.mobilePhone),
        address: readString(row.address),
        nhsNumber: readString(row.nhsNumber),
        gpDetails: readString(row.gpDetails),
        riskLevel: readString(row.riskLevel),
        fundingSource: readString(row.fundingSource),
        preferredName: readString(row.preferredName),
        maritalStatus: readString(row.maritalStatus),
        birthplace: readString(row.birthplace),
        nationality: readString(row.nationality),
        languagesSpoken: readString(row.languagesSpoken),
        ethnicity: readString(row.ethnicity),
        religion: readString(row.religion),
        carerGenderPreference: readString(row.carerGenderPreference),
        carerNote: readString(row.carerNote),
        emergencyContactName: readString(row.emergencyContactName),
        emergencyContactPhone: readString(row.emergencyContactPhone),
        emergencyContactRelation: readString(row.emergencyContactRelation),
        preferredContactMethod: readString(row.preferredContactMethod),
        activeStatus: Boolean(row.activeStatus),
        dischargeDate: row.dischargeDate ? row.dischargeDate.toISOString().slice(0, 10) : ''
    };
}
function loadCompanyServiceUsers(companyId) {
    return __awaiter(this, void 0, void 0, function () {
        var pool, hasKeyWorker, keyWorkerSelect, rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getAzureSqlPool()];
                case 1:
                    pool = _a.sent();
                    return [4 /*yield*/, hasClientKeyWorkerColumn()];
                case 2:
                    hasKeyWorker = _a.sent();
                    keyWorkerSelect = hasKeyWorker
                        ? "c.KeyWorkerName AS keyWorkerName,"
                        : "CAST(NULL AS NVARCHAR(200)) AS keyWorkerName,";
                    return [4 /*yield*/, pool.request()
                            .input('companyId', mssql.Int, companyId)
                            .query("\n        SELECT\n          c.ClientID AS clientId,\n          c.FirstName AS firstName,\n          c.LastName AS lastName,\n          c.DateOfBirth AS dateOfBirth,\n          c.Gender AS gender,\n          c.Email AS email,\n          c.Phone AS phone,\n          c.MobilePhone AS mobilePhone,\n          c.NHS_Number AS nhsNumber,\n          c.GP_Details AS gpDetails,\n          c.FundingSource AS fundingSource,\n          c.PreferredName AS preferredName,\n          c.MaritalStatus AS maritalStatus,\n          c.Birthplace AS birthplace,\n          c.Nationality AS nationality,\n          c.LanguagesSpoken AS languagesSpoken,\n          c.Ethnicity AS ethnicity,\n          c.Religion AS religion,\n          c.CarerGenderPreference AS carerGenderPreference,\n          c.CarerNote AS carerNote,\n          c.EmergencyContactName AS emergencyContactName,\n          c.EmergencyContactPhone AS emergencyContactPhone,\n          c.EmergencyContactRelation AS emergencyContactRelation,\n          c.PreferredContactMethod AS preferredContactMethod,\n          ".concat(keyWorkerSelect, "\n          c.ClientType AS clientType,\n          c.RiskLevel AS riskLevel,\n          c.ActiveStatus AS activeStatus,\n          c.DischargeDate AS dischargeDate,\n          c.ModifiedDate AS modifiedDate,\n          c.Address AS address\n        FROM People.Clients c\n        WHERE c.CompanyID = @companyId\n        ORDER BY c.ModifiedDate DESC, c.ClientID DESC\n      "))];
                case 3:
                    rows = (_a.sent()).recordset;
                    return [2 /*return*/, rows.map(mapServiceUserRow)];
            }
        });
    });
}
function createCompanyServiceUser(companyId, payload) {
    return __awaiter(this, void 0, void 0, function () {
        var pool, request, insertedRows, clientId, hasKeyWorker, keyWorkerSelect, createdRows;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!payload.firstName || !payload.lastName) {
                        throw Object.assign(new Error('First name and last name are required'), { code: 'VALIDATION_ERROR' });
                    }
                    return [4 /*yield*/, getAzureSqlPool()];
                case 1:
                    pool = _b.sent();
                    request = pool.request()
                        .input('companyId', mssql.Int, companyId)
                        .input('clientType', mssql.NVarChar(50), payload.clientType || 'Community')
                        .input('firstName', mssql.NVarChar(100), payload.firstName)
                        .input('lastName', mssql.NVarChar(100), payload.lastName)
                        .input('dateOfBirth', mssql.Date, payload.dateOfBirth || null)
                        .input('gender', mssql.NVarChar(20), payload.gender || '')
                        .input('email', mssql.NVarChar(100), payload.email || '')
                        .input('phone', mssql.NVarChar(20), payload.phone || '')
                        .input('mobilePhone', mssql.NVarChar(20), payload.mobilePhone || '')
                        .input('address', mssql.NVarChar(500), payload.address || '')
                        .input('nhsNumber', mssql.NVarChar(20), payload.nhsNumber || '')
                        .input('gpDetails', mssql.NVarChar(500), payload.gpDetails || '')
                        .input('riskLevel', mssql.NVarChar(50), payload.riskLevel || 'Low')
                        .input('fundingSource', mssql.NVarChar(100), payload.fundingSource || '')
                        .input('activeStatus', mssql.Bit, payload.activeStatus ? 1 : 0)
                        .input('dischargeDate', mssql.Date, payload.dischargeDate || null);
                    return [4 /*yield*/, request.query("\n      INSERT INTO People.Clients (\n        CompanyID,\n        ClientType,\n        FirstName,\n        LastName,\n        DateOfBirth,\n        Gender,\n        Email,\n        Phone,\n        MobilePhone,\n        Address,\n        NHS_Number,\n        GP_Details,\n        RiskLevel,\n        FundingSource,\n        ActiveStatus,\n        DischargeDate,\n        CreatedDate,\n        ModifiedDate\n      )\n      VALUES (\n        @companyId,\n        @clientType,\n        @firstName,\n        @lastName,\n        @dateOfBirth,\n        @gender,\n        @email,\n        @phone,\n        @mobilePhone,\n        @address,\n        @nhsNumber,\n        @gpDetails,\n        @riskLevel,\n        @fundingSource,\n        @activeStatus,\n        @dischargeDate,\n        SYSUTCDATETIME(),\n        SYSUTCDATETIME()\n      );\n      SELECT CAST(SCOPE_IDENTITY() AS INT) AS clientId;\n    ")];
                case 2:
                    insertedRows = (_b.sent()).recordset;
                    clientId = (_a = insertedRows[0]) === null || _a === void 0 ? void 0 : _a.clientId;
                    if (!clientId) {
                        throw Object.assign(new Error('Unable to create service user'), { code: 'VALIDATION_ERROR' });
                    }
                    return [4 /*yield*/, hasClientKeyWorkerColumn()];
                case 3:
                    hasKeyWorker = _b.sent();
                    keyWorkerSelect = hasKeyWorker
                        ? "c.KeyWorkerName AS keyWorkerName,"
                        : "CAST(NULL AS NVARCHAR(200)) AS keyWorkerName,";
                    return [4 /*yield*/, pool.request()
                            .input('companyId', mssql.Int, companyId)
                            .input('clientId', mssql.Int, clientId)
                            .query("\n        SELECT\n          c.ClientID AS clientId,\n          c.FirstName AS firstName,\n          c.LastName AS lastName,\n          c.DateOfBirth AS dateOfBirth,\n          c.Gender AS gender,\n          c.Email AS email,\n          c.Phone AS phone,\n          c.MobilePhone AS mobilePhone,\n          c.NHS_Number AS nhsNumber,\n          c.GP_Details AS gpDetails,\n          c.FundingSource AS fundingSource,\n          c.PreferredName AS preferredName,\n          c.MaritalStatus AS maritalStatus,\n          c.Birthplace AS birthplace,\n          c.Nationality AS nationality,\n          c.LanguagesSpoken AS languagesSpoken,\n          c.Ethnicity AS ethnicity,\n          c.Religion AS religion,\n          c.CarerGenderPreference AS carerGenderPreference,\n          c.CarerNote AS carerNote,\n          c.EmergencyContactName AS emergencyContactName,\n          c.EmergencyContactPhone AS emergencyContactPhone,\n          c.EmergencyContactRelation AS emergencyContactRelation,\n          c.PreferredContactMethod AS preferredContactMethod,\n          ".concat(keyWorkerSelect, "\n          c.ClientType AS clientType,\n          c.RiskLevel AS riskLevel,\n          c.ActiveStatus AS activeStatus,\n          c.DischargeDate AS dischargeDate,\n          c.ModifiedDate AS modifiedDate,\n          c.Address AS address\n        FROM People.Clients c\n        WHERE c.CompanyID = @companyId\n          AND c.ClientID = @clientId\n      "))];
                case 4:
                    createdRows = (_b.sent()).recordset;
                    if (!createdRows[0]) {
                        throw Object.assign(new Error('Created service user could not be loaded'), { code: 'VALIDATION_ERROR' });
                    }
                    return [2 /*return*/, mapServiceUserRow(createdRows[0])];
            }
        });
    });
}
function loadCompanyServiceUserById(companyId, clientId) {
    return __awaiter(this, void 0, void 0, function () {
        var pool, hasKeyWorker, keyWorkerSelect, rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getAzureSqlPool()];
                case 1:
                    pool = _a.sent();
                    return [4 /*yield*/, hasClientKeyWorkerColumn()];
                case 2:
                    hasKeyWorker = _a.sent();
                    keyWorkerSelect = hasKeyWorker
                        ? "c.KeyWorkerName AS keyWorkerName,"
                        : "CAST(NULL AS NVARCHAR(200)) AS keyWorkerName,";
                    return [4 /*yield*/, pool.request()
                            .input('companyId', mssql.Int, companyId)
                            .input('clientId', mssql.Int, clientId)
                            .query("\n        SELECT\n          c.ClientID AS clientId,\n          c.FirstName AS firstName,\n          c.LastName AS lastName,\n          c.DateOfBirth AS dateOfBirth,\n          c.Gender AS gender,\n          c.Email AS email,\n          c.Phone AS phone,\n          c.MobilePhone AS mobilePhone,\n          c.NHS_Number AS nhsNumber,\n          c.GP_Details AS gpDetails,\n          c.FundingSource AS fundingSource,\n          c.PreferredName AS preferredName,\n          c.MaritalStatus AS maritalStatus,\n          c.Birthplace AS birthplace,\n          c.Nationality AS nationality,\n          c.LanguagesSpoken AS languagesSpoken,\n          c.Ethnicity AS ethnicity,\n          c.Religion AS religion,\n          c.CarerGenderPreference AS carerGenderPreference,\n          c.CarerNote AS carerNote,\n          c.EmergencyContactName AS emergencyContactName,\n          c.EmergencyContactPhone AS emergencyContactPhone,\n          c.EmergencyContactRelation AS emergencyContactRelation,\n          c.PreferredContactMethod AS preferredContactMethod,\n          ".concat(keyWorkerSelect, "\n          c.ClientType AS clientType,\n          c.RiskLevel AS riskLevel,\n          c.ActiveStatus AS activeStatus,\n          c.DischargeDate AS dischargeDate,\n          c.ModifiedDate AS modifiedDate,\n          c.Address AS address\n        FROM People.Clients c\n        WHERE c.CompanyID = @companyId\n          AND c.ClientID = @clientId\n      "))];
                case 3:
                    rows = (_a.sent()).recordset;
                    return [2 /*return*/, rows[0] ? mapServiceUserRow(rows[0]) : null];
            }
        });
    });
}
function updateCompanyServiceUser(companyId, clientId, payload) {
    return __awaiter(this, void 0, void 0, function () {
        var existing, nextFirstName, nextLastName, hasKeyWorker, nextClientType, nextActiveStatus, nextDischargeDate, pool, request, keyWorkerUpdate, updated;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29;
        return __generator(this, function (_30) {
            switch (_30.label) {
                case 0: return [4 /*yield*/, loadCompanyServiceUserById(companyId, clientId)];
                case 1:
                    existing = _30.sent();
                    if (!existing) {
                        throw Object.assign(new Error('Service user not found'), { code: 'P2025' });
                    }
                    nextFirstName = (_b = (_a = payload.firstName) !== null && _a !== void 0 ? _a : existing.firstName) !== null && _b !== void 0 ? _b : '';
                    nextLastName = (_d = (_c = payload.lastName) !== null && _c !== void 0 ? _c : existing.lastName) !== null && _d !== void 0 ? _d : '';
                    if (!nextFirstName || !nextLastName) {
                        throw Object.assign(new Error('First name and last name are required'), { code: 'VALIDATION_ERROR' });
                    }
                    return [4 /*yield*/, hasClientKeyWorkerColumn()];
                case 2:
                    hasKeyWorker = _30.sent();
                    nextClientType = (_f = (_e = payload.clientType) !== null && _e !== void 0 ? _e : existing.zone) !== null && _f !== void 0 ? _f : 'Community';
                    nextActiveStatus = (_h = (_g = payload.activeStatus) !== null && _g !== void 0 ? _g : existing.activeStatus) !== null && _h !== void 0 ? _h : true;
                    nextDischargeDate = payload.dischargeDate !== undefined
                        ? payload.dischargeDate || null
                        : nextActiveStatus
                            ? null
                            : existing.dischargeDate || new Date().toISOString().slice(0, 10);
                    return [4 /*yield*/, getAzureSqlPool()];
                case 3:
                    pool = _30.sent();
                    request = pool.request()
                        .input('companyId', mssql.Int, companyId)
                        .input('clientId', mssql.Int, clientId)
                        .input('clientType', mssql.NVarChar(50), nextClientType)
                        .input('activeStatus', mssql.Bit, nextActiveStatus ? 1 : 0)
                        .input('dischargeDate', mssql.Date, nextDischargeDate)
                        .input('firstName', mssql.NVarChar(100), nextFirstName)
                        .input('lastName', mssql.NVarChar(100), nextLastName)
                        .input('dateOfBirth', mssql.Date, payload.dateOfBirth || existing.dateOfBirth || null)
                        .input('gender', mssql.NVarChar(20), (_k = (_j = payload.gender) !== null && _j !== void 0 ? _j : existing.gender) !== null && _k !== void 0 ? _k : '')
                        .input('email', mssql.NVarChar(100), (_m = (_l = payload.email) !== null && _l !== void 0 ? _l : existing.email) !== null && _m !== void 0 ? _m : '')
                        .input('phone', mssql.NVarChar(20), (_p = (_o = payload.phone) !== null && _o !== void 0 ? _o : existing.phone) !== null && _p !== void 0 ? _p : '')
                        .input('mobilePhone', mssql.NVarChar(20), (_r = (_q = payload.mobilePhone) !== null && _q !== void 0 ? _q : existing.mobilePhone) !== null && _r !== void 0 ? _r : '')
                        .input('address', mssql.NVarChar(500), (_t = (_s = payload.address) !== null && _s !== void 0 ? _s : existing.address) !== null && _t !== void 0 ? _t : '')
                        .input('nhsNumber', mssql.NVarChar(20), (_v = (_u = payload.nhsNumber) !== null && _u !== void 0 ? _u : existing.nhsNumber) !== null && _v !== void 0 ? _v : '')
                        .input('gpDetails', mssql.NVarChar(500), (_x = (_w = payload.gpDetails) !== null && _w !== void 0 ? _w : existing.gpDetails) !== null && _x !== void 0 ? _x : '')
                        .input('riskLevel', mssql.NVarChar(50), (_z = (_y = payload.riskLevel) !== null && _y !== void 0 ? _y : existing.riskLevel) !== null && _z !== void 0 ? _z : 'Low')
                        .input('fundingSource', mssql.NVarChar(100), (_1 = (_0 = payload.fundingSource) !== null && _0 !== void 0 ? _0 : existing.fundingSource) !== null && _1 !== void 0 ? _1 : '')
                        .input('preferredName', mssql.NVarChar(100), (_3 = (_2 = payload.preferredName) !== null && _2 !== void 0 ? _2 : existing.preferredName) !== null && _3 !== void 0 ? _3 : '')
                        .input('maritalStatus', mssql.NVarChar(50), (_5 = (_4 = payload.maritalStatus) !== null && _4 !== void 0 ? _4 : existing.maritalStatus) !== null && _5 !== void 0 ? _5 : '')
                        .input('birthplace', mssql.NVarChar(100), (_7 = (_6 = payload.birthplace) !== null && _6 !== void 0 ? _6 : existing.birthplace) !== null && _7 !== void 0 ? _7 : '')
                        .input('nationality', mssql.NVarChar(100), (_9 = (_8 = payload.nationality) !== null && _8 !== void 0 ? _8 : existing.nationality) !== null && _9 !== void 0 ? _9 : '')
                        .input('languagesSpoken', mssql.NVarChar(500), (_11 = (_10 = payload.languagesSpoken) !== null && _10 !== void 0 ? _10 : existing.languagesSpoken) !== null && _11 !== void 0 ? _11 : '')
                        .input('ethnicity', mssql.NVarChar(100), (_13 = (_12 = payload.ethnicity) !== null && _12 !== void 0 ? _12 : existing.ethnicity) !== null && _13 !== void 0 ? _13 : '')
                        .input('religion', mssql.NVarChar(100), (_15 = (_14 = payload.religion) !== null && _14 !== void 0 ? _14 : existing.religion) !== null && _15 !== void 0 ? _15 : '')
                        .input('carerGenderPreference', mssql.NVarChar(30), (_17 = (_16 = payload.carerGenderPreference) !== null && _16 !== void 0 ? _16 : existing.carerGenderPreference) !== null && _17 !== void 0 ? _17 : '')
                        .input('carerNote', mssql.NVarChar(1000), (_19 = (_18 = payload.carerNote) !== null && _18 !== void 0 ? _18 : existing.carerNote) !== null && _19 !== void 0 ? _19 : '')
                        .input('emergencyContactName', mssql.NVarChar(200), (_21 = (_20 = payload.emergencyContactName) !== null && _20 !== void 0 ? _20 : existing.emergencyContactName) !== null && _21 !== void 0 ? _21 : '')
                        .input('emergencyContactPhone', mssql.NVarChar(30), (_23 = (_22 = payload.emergencyContactPhone) !== null && _22 !== void 0 ? _22 : existing.emergencyContactPhone) !== null && _23 !== void 0 ? _23 : '')
                        .input('emergencyContactRelation', mssql.NVarChar(100), (_25 = (_24 = payload.emergencyContactRelation) !== null && _24 !== void 0 ? _24 : existing.emergencyContactRelation) !== null && _25 !== void 0 ? _25 : '')
                        .input('preferredContactMethod', mssql.NVarChar(30), (_27 = (_26 = payload.preferredContactMethod) !== null && _26 !== void 0 ? _26 : existing.preferredContactMethod) !== null && _27 !== void 0 ? _27 : '');
                    keyWorkerUpdate = hasKeyWorker ? 'KeyWorkerName = @keyWorkerName,' : '';
                    if (hasKeyWorker) {
                        request.input('keyWorkerName', mssql.NVarChar(200), (_29 = (_28 = payload.keyWorker) !== null && _28 !== void 0 ? _28 : existing.keyWorker) !== null && _29 !== void 0 ? _29 : '');
                    }
                    return [4 /*yield*/, request.query("\n      UPDATE People.Clients\n      SET\n        ClientType = @clientType,\n        ActiveStatus = @activeStatus,\n        DischargeDate = @dischargeDate,\n        FirstName = @firstName,\n        LastName = @lastName,\n        DateOfBirth = @dateOfBirth,\n        Gender = @gender,\n        Email = @email,\n        Phone = @phone,\n        MobilePhone = @mobilePhone,\n        Address = @address,\n        NHS_Number = @nhsNumber,\n        GP_Details = @gpDetails,\n        RiskLevel = @riskLevel,\n        FundingSource = @fundingSource,\n        PreferredName = @preferredName,\n        MaritalStatus = @maritalStatus,\n        Birthplace = @birthplace,\n        Nationality = @nationality,\n        LanguagesSpoken = @languagesSpoken,\n        Ethnicity = @ethnicity,\n        Religion = @religion,\n        CarerGenderPreference = @carerGenderPreference,\n        CarerNote = @carerNote,\n        EmergencyContactName = @emergencyContactName,\n        EmergencyContactPhone = @emergencyContactPhone,\n        EmergencyContactRelation = @emergencyContactRelation,\n        PreferredContactMethod = @preferredContactMethod,\n        ".concat(keyWorkerUpdate, "\n        ModifiedDate = SYSUTCDATETIME()\n      WHERE CompanyID = @companyId\n        AND ClientID = @clientId\n    "))];
                case 4:
                    _30.sent();
                    return [4 /*yield*/, loadCompanyServiceUserById(companyId, clientId)];
                case 5:
                    updated = _30.sent();
                    if (!updated) {
                        throw Object.assign(new Error('Unable to load updated service user'), { code: 'VALIDATION_ERROR' });
                    }
                    return [2 /*return*/, updated];
            }
        });
    });
}
function validateAvatarSize(avatarUrl) {
    if (!avatarUrl)
        return;
    // Guard against multi-megabyte data URLs that slow API responses/UI hydration.
    if (avatarUrl.length > 300000) {
        throw Object.assign(new Error('Avatar image is too large. Please use a smaller image.'), { code: 'VALIDATION_ERROR' });
    }
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
        var pool, includeAvatar, avatarSelect, request, userFilter, users;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getAzureSqlPool()];
                case 1:
                    pool = _a.sent();
                    return [4 /*yield*/, hasStaffAvatarColumn()];
                case 2:
                    includeAvatar = _a.sent();
                    avatarSelect = includeAvatar
                        ? "ISNULL(NULLIF(s.AvatarUrl, N''), N'') AS avatarUrl,"
                        : "CAST(NULL AS NVARCHAR(MAX)) AS avatarUrl,";
                    request = pool.request().input('companyId', mssql.Int, companyId);
                    userFilter = typeof userId === 'number' ? 'AND ua.UserID = @userId' : '';
                    if (typeof userId === 'number') {
                        request.input('userId', mssql.Int, userId);
                    }
                    return [4 /*yield*/, request.query("\n      SELECT\n        CAST(ua.UserID AS NVARCHAR(50)) AS id,\n        LTRIM(RTRIM(CONCAT(ISNULL(s.FirstName, N''), N' ', ISNULL(s.LastName, N'')))) AS name,\n        ".concat(avatarSelect, "\n        ISNULL(rolePick.RoleName, N'Carer') AS role,\n        CASE\n          WHEN ISNULL(ua.AccountStatus, N'Active') = N'Active' AND ISNULL(s.ActiveStatus, 1) = 1\n            THEN N'active'\n          ELSE N'inactive'\n        END AS status,\n        ISNULL(NULLIF(managerPick.ManagerName, N''), N'Unassigned') AS lineManager,\n        ISNULL(NULLIF(s.Email, N''), ua.Username) AS email,\n        ISNULL(NULLIF(s.MobilePhone, N''), ISNULL(NULLIF(s.Phone, N''), N'')) AS phone,\n        CASE\n          WHEN EXISTS (\n            SELECT 1\n            FROM Auth.UserRoleAssignment ura2\n            INNER JOIN Auth.UserRole ur2\n              ON ur2.RoleID = ura2.RoleID\n             AND ur2.CompanyID = ura2.CompanyID\n            WHERE ura2.UserID = ua.UserID\n              AND ura2.CompanyID = ua.CompanyID\n              AND ISNULL(ur2.IsActive, 1) = 1\n              AND ur2.RoleName IN (N'Line Manager', N'Manager')\n          ) THEN 1\n          ELSE 0\n        END AS isLineManager\n      FROM Auth.UserAccount ua\n      LEFT JOIN People.Staff s ON s.StaffID = ua.StaffID\n      OUTER APPLY (\n        SELECT TOP 1 ur.RoleName\n        FROM Auth.UserRoleAssignment ura\n        INNER JOIN Auth.UserRole ur\n          ON ur.RoleID = ura.RoleID\n         AND ur.CompanyID = ura.CompanyID\n        WHERE ura.UserID = ua.UserID\n          AND ura.CompanyID = ua.CompanyID\n          AND (ura.ExpiryDate IS NULL OR ura.ExpiryDate >= CAST(SYSUTCDATETIME() AS date))\n          AND ISNULL(ur.IsActive, 1) = 1\n        ORDER BY ura.AssignedDate DESC, ura.AssignmentID DESC\n      ) rolePick\n      OUTER APPLY (\n        SELECT TOP 1 LTRIM(RTRIM(CONCAT(ISNULL(ms.FirstName, N''), N' ', ISNULL(ms.LastName, N'')))) AS ManagerName\n        FROM Auth.UserRoleAssignment mura\n        INNER JOIN Auth.UserRole mur\n          ON mur.RoleID = mura.RoleID\n         AND mur.CompanyID = mura.CompanyID\n        INNER JOIN Auth.UserAccount mua\n          ON mua.UserID = mura.UserID\n         AND mua.CompanyID = mura.CompanyID\n        LEFT JOIN People.Staff ms ON ms.StaffID = mua.StaffID\n        WHERE mura.CompanyID = ua.CompanyID\n          AND ISNULL(mur.IsActive, 1) = 1\n          AND mur.RoleName IN (N'Line Manager', N'Manager')\n        ORDER BY mura.AssignedDate DESC, mura.AssignmentID DESC\n      ) managerPick\n      WHERE ua.CompanyID = @companyId\n      ").concat(userFilter, "\n      ORDER BY name ASC\n    "))];
                case 3:
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
        var email, pool, tx, duplicateRows, _a, firstName, lastName, _b, accountStatus, isActive, roleNames, includeAvatar, staffRequest, staffRows, staffId, userRows, userId, _i, roleNames_1, roleName, roleId, created, error_1;
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
                    validateAvatarSize(payload.avatarUrl);
                    return [4 /*yield*/, getAzureSqlPool()];
                case 1:
                    pool = _e.sent();
                    tx = new mssql.Transaction(pool);
                    return [4 /*yield*/, tx.begin()];
                case 2:
                    _e.sent();
                    _e.label = 3;
                case 3:
                    _e.trys.push([3, 15, , 17]);
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
                    return [4 /*yield*/, hasStaffAvatarColumn()];
                case 5:
                    includeAvatar = _e.sent();
                    staffRequest = new mssql.Request(tx)
                        .input('companyId', mssql.Int, session.companyId)
                        .input('firstName', mssql.NVarChar(128), firstName)
                        .input('lastName', mssql.NVarChar(128), lastName)
                        .input('email', mssql.NVarChar(320), email)
                        .input('phone', mssql.NVarChar(64), payload.phone)
                        .input('isActive', mssql.Bit, isActive);
                    if (includeAvatar) {
                        staffRequest.input('avatarUrl', mssql.NVarChar(mssql.MAX), payload.avatarUrl || '');
                    }
                    return [4 /*yield*/, staffRequest.query("\n          INSERT INTO People.Staff (".concat(includeAvatar ? 'CompanyID, FirstName, LastName, Email, MobilePhone, Phone, ActiveStatus, AvatarUrl' : 'CompanyID, FirstName, LastName, Email, MobilePhone, Phone, ActiveStatus', ")\n          VALUES (").concat(includeAvatar ? '@companyId, @firstName, @lastName, @email, @phone, @phone, @isActive, @avatarUrl' : '@companyId, @firstName, @lastName, @email, @phone, @phone, @isActive', ");\n          SELECT CAST(SCOPE_IDENTITY() AS INT) AS staffId;\n        "))];
                case 6:
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
                case 7:
                    userRows = (_e.sent()).recordset;
                    userId = (_d = userRows[0]) === null || _d === void 0 ? void 0 : _d.userId;
                    if (!userId) {
                        throw Object.assign(new Error('Failed to create user account record'), { code: 'VALIDATION_ERROR' });
                    }
                    _i = 0, roleNames_1 = roleNames;
                    _e.label = 8;
                case 8:
                    if (!(_i < roleNames_1.length)) return [3 /*break*/, 12];
                    roleName = roleNames_1[_i];
                    return [4 /*yield*/, resolveRoleId(tx, session.companyId, roleName)];
                case 9:
                    roleId = _e.sent();
                    if (!roleId)
                        return [3 /*break*/, 11];
                    return [4 /*yield*/, new mssql.Request(tx)
                            .input('userId', mssql.Int, userId)
                            .input('companyId', mssql.Int, session.companyId)
                            .input('roleId', mssql.Int, roleId)
                            .query("\n          INSERT INTO Auth.UserRoleAssignment (UserID, CompanyID, RoleID, AssignedDate, ExpiryDate)\n          VALUES (@userId, @companyId, @roleId, CAST(SYSUTCDATETIME() AS date), NULL);\n        ")];
                case 10:
                    _e.sent();
                    _e.label = 11;
                case 11:
                    _i++;
                    return [3 /*break*/, 8];
                case 12: return [4 /*yield*/, tx.commit()];
                case 13:
                    _e.sent();
                    return [4 /*yield*/, loadCompanyUsers(session.companyId, userId)];
                case 14:
                    created = _e.sent();
                    if (!created[0]) {
                        throw Object.assign(new Error('Created user could not be loaded'), { code: 'VALIDATION_ERROR' });
                    }
                    return [2 /*return*/, created[0]];
                case 15:
                    error_1 = _e.sent();
                    return [4 /*yield*/, tx.rollback()];
                case 16:
                    _e.sent();
                    throw error_1;
                case 17: return [2 /*return*/];
            }
        });
    });
}
function updateCompanyUser(session, userId, payload) {
    return __awaiter(this, void 0, void 0, function () {
        var email, pool, tx, existingRows, staffId, _a, firstName, lastName, _b, accountStatus, isActive, includeAvatar, staffRequest, roleNames, _i, roleNames_2, roleName, roleId, updated, error_2;
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
                    validateAvatarSize(payload.avatarUrl);
                    return [4 /*yield*/, getAzureSqlPool()];
                case 1:
                    pool = _c.sent();
                    tx = new mssql.Transaction(pool);
                    return [4 /*yield*/, tx.begin()];
                case 2:
                    _c.sent();
                    _c.label = 3;
                case 3:
                    _c.trys.push([3, 17, , 19]);
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
                    return [4 /*yield*/, hasStaffAvatarColumn()];
                case 5:
                    includeAvatar = _c.sent();
                    if (!staffId) return [3 /*break*/, 7];
                    staffRequest = new mssql.Request(tx)
                        .input('staffId', mssql.Int, staffId)
                        .input('firstName', mssql.NVarChar(128), firstName)
                        .input('lastName', mssql.NVarChar(128), lastName)
                        .input('email', mssql.NVarChar(320), email)
                        .input('phone', mssql.NVarChar(64), payload.phone)
                        .input('isActive', mssql.Bit, isActive);
                    if (includeAvatar) {
                        staffRequest.input('avatarUrl', mssql.NVarChar(mssql.MAX), payload.avatarUrl || '');
                    }
                    return [4 /*yield*/, staffRequest.query("\n          UPDATE People.Staff\n          SET FirstName = @firstName,\n              LastName = @lastName,\n              Email = @email,\n              MobilePhone = @phone,\n              Phone = @phone,\n              ActiveStatus = @isActive\n              ".concat(includeAvatar ? ', AvatarUrl = @avatarUrl' : '', "\n          WHERE StaffID = @staffId\n        "))];
                case 6:
                    _c.sent();
                    _c.label = 7;
                case 7: return [4 /*yield*/, new mssql.Request(tx)
                        .input('companyId', mssql.Int, session.companyId)
                        .input('userId', mssql.Int, userId)
                        .input('username', mssql.NVarChar(320), email)
                        .input('accountStatus', mssql.NVarChar(64), accountStatus)
                        .query("\n        UPDATE Auth.UserAccount\n        SET Username = @username,\n            AccountStatus = @accountStatus,\n            LastModifiedDate = SYSUTCDATETIME()\n        WHERE CompanyID = @companyId\n          AND UserID = @userId\n      ")];
                case 8:
                    _c.sent();
                    return [4 /*yield*/, new mssql.Request(tx)
                            .input('companyId', mssql.Int, session.companyId)
                            .input('userId', mssql.Int, userId)
                            .query("\n        UPDATE ura\n        SET ExpiryDate = CAST(SYSUTCDATETIME() AS date)\n        FROM Auth.UserRoleAssignment ura\n        WHERE ura.CompanyID = @companyId\n          AND ura.UserID = @userId\n          AND (ura.ExpiryDate IS NULL OR ura.ExpiryDate >= CAST(SYSUTCDATETIME() AS date))\n      ")];
                case 9:
                    _c.sent();
                    roleNames = uniqueSorted(__spreadArray([payload.role], (payload.isLineManager ? ['Line Manager'] : []), true));
                    _i = 0, roleNames_2 = roleNames;
                    _c.label = 10;
                case 10:
                    if (!(_i < roleNames_2.length)) return [3 /*break*/, 14];
                    roleName = roleNames_2[_i];
                    return [4 /*yield*/, resolveRoleId(tx, session.companyId, roleName)];
                case 11:
                    roleId = _c.sent();
                    if (!roleId)
                        return [3 /*break*/, 13];
                    return [4 /*yield*/, new mssql.Request(tx)
                            .input('companyId', mssql.Int, session.companyId)
                            .input('userId', mssql.Int, userId)
                            .input('roleId', mssql.Int, roleId)
                            .query("\n          INSERT INTO Auth.UserRoleAssignment (UserID, CompanyID, RoleID, AssignedDate, ExpiryDate)\n          VALUES (@userId, @companyId, @roleId, CAST(SYSUTCDATETIME() AS date), NULL);\n        ")];
                case 12:
                    _c.sent();
                    _c.label = 13;
                case 13:
                    _i++;
                    return [3 /*break*/, 10];
                case 14: return [4 /*yield*/, tx.commit()];
                case 15:
                    _c.sent();
                    return [4 /*yield*/, loadCompanyUsers(session.companyId, userId)];
                case 16:
                    updated = _c.sent();
                    if (!updated[0]) {
                        throw Object.assign(new Error('Updated user could not be loaded'), { code: 'P2025' });
                    }
                    return [2 /*return*/, updated[0]];
                case 17:
                    error_2 = _c.sent();
                    return [4 /*yield*/, tx.rollback()];
                case 18:
                    _c.sent();
                    throw error_2;
                case 19: return [2 /*return*/];
            }
        });
    });
}
function getInviteConfig() {
    var tenantId = readString(process.env.AZURE_INVITE_TENANT_ID || process.env.VITE_AZURE_TENANT_ID);
    var clientId = readString(process.env.AZURE_INVITE_CLIENT_ID);
    var clientSecret = readString(process.env.AZURE_INVITE_CLIENT_SECRET);
    var redirectUrl = readString(process.env.AZURE_INVITE_REDIRECT_URL || process.env.VITE_AZURE_REDIRECT_URI);
    if (!tenantId || !clientId || !clientSecret || !redirectUrl) {
        throw Object.assign(new Error('Invite service is not configured. Set AZURE_INVITE_TENANT_ID, AZURE_INVITE_CLIENT_ID, AZURE_INVITE_CLIENT_SECRET, AZURE_INVITE_REDIRECT_URL.'), { code: 'INVITE_CONFIG_MISSING' });
    }
    return { tenantId: tenantId, clientId: clientId, clientSecret: clientSecret, redirectUrl: redirectUrl };
}
function getGraphAccessToken(config) {
    return __awaiter(this, void 0, void 0, function () {
        var body, response, payload;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    body = new URLSearchParams({
                        client_id: config.clientId,
                        client_secret: config.clientSecret,
                        grant_type: 'client_credentials',
                        scope: 'https://graph.microsoft.com/.default'
                    });
                    return [4 /*yield*/, fetch("https://login.microsoftonline.com/".concat(config.tenantId, "/oauth2/v2.0/token"), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: body
                        })];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    payload = (_a.sent());
                    if (!response.ok || !payload.access_token) {
                        throw Object.assign(new Error(payload.error_description || 'Unable to acquire Microsoft Graph access token'), { code: 'INVITE_FAILED' });
                    }
                    return [2 /*return*/, payload.access_token];
            }
        });
    });
}
function sendCompanyUserInvite(email, displayName) {
    return __awaiter(this, void 0, void 0, function () {
        var config, accessToken, response, payload;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    config = getInviteConfig();
                    return [4 /*yield*/, getGraphAccessToken(config)];
                case 1:
                    accessToken = _b.sent();
                    return [4 /*yield*/, fetch('https://graph.microsoft.com/v1.0/invitations', {
                            method: 'POST',
                            headers: {
                                Authorization: "Bearer ".concat(accessToken),
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                invitedUserEmailAddress: email,
                                invitedUserDisplayName: displayName || email,
                                inviteRedirectUrl: config.redirectUrl,
                                sendInvitationMessage: true
                            })
                        })];
                case 2:
                    response = _b.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    payload = (_b.sent());
                    if (!response.ok) {
                        throw Object.assign(new Error(((_a = payload.error) === null || _a === void 0 ? void 0 : _a.message) || 'Unable to send Microsoft invitation'), { code: 'INVITE_FAILED' });
                    }
                    return [2 /*return*/, { inviteRedeemUrl: readString(payload.inviteRedeemUrl) || undefined }];
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
        var pathname, method, users, session, users, roles, users, lineManagers, session, serviceUsers, _a, shifts, session, session, pendingDevices, hasAzureClientId, hasAzureSqlConnectionString, companyInviteUserId, session, parsedUserId, users, user, inviteResult, body, email, body, token, result, body, challengeToken, result, body, challengeToken, code, body, challengeToken, code, deviceFingerprint, deviceLabel, result, token, pendingDeviceId, pendingDeviceAction, session, body, user, session, body, created, session, body, user, body, result, role, companyUserId, session, parsedUserId, body, user, serviceUserId, session, parsedServiceUserId, body, user, userId, body, user, currentRoleName, body, role, userId, roleName, error_3, err;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    pathname = getPathname(req);
                    if (!pathname || (!pathname.startsWith('/api/db') && !pathname.startsWith('/api/auth'))) {
                        next();
                        return [2 /*return*/];
                    }
                    method = (_b = req.method) !== null && _b !== void 0 ? _b : 'GET';
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 72, , 73]);
                    if (!(method === 'GET')) return [3 /*break*/, 21];
                    if (!(pathname === '/api/db/health')) return [3 /*break*/, 3];
                    return [4 /*yield*/, pingDatabase()];
                case 2:
                    _d.sent();
                    writeJson(res, 200, { ok: true });
                    return [2 /*return*/];
                case 3:
                    if (!(pathname === '/api/db/users')) return [3 /*break*/, 5];
                    return [4 /*yield*/, getUsers()];
                case 4:
                    users = _d.sent();
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
                    users = _d.sent();
                    writeJson(res, 200, { data: users });
                    return [2 /*return*/];
                case 7:
                    if (!(pathname === '/api/db/roles')) return [3 /*break*/, 9];
                    return [4 /*yield*/, getRoles()];
                case 8:
                    roles = _d.sent();
                    writeJson(res, 200, { data: roles.map(function (role) { return role.name; }) });
                    return [2 /*return*/];
                case 9:
                    if (!(pathname === '/api/db/line-managers')) return [3 /*break*/, 11];
                    return [4 /*yield*/, getUsers()];
                case 10:
                    users = _d.sent();
                    lineManagers = uniqueSorted(__spreadArray(__spreadArray([], users.map(function (user) { return user.lineManager; }), true), users.filter(function (user) { return Boolean(user.isLineManager); }).map(function (user) { return user.name; }), true));
                    writeJson(res, 200, { data: lineManagers });
                    return [2 /*return*/];
                case 11:
                    if (!(pathname === '/api/db/service-users')) return [3 /*break*/, 16];
                    session = getActiveSession(req);
                    if (!session) return [3 /*break*/, 13];
                    return [4 /*yield*/, loadCompanyServiceUsers(session.companyId)];
                case 12:
                    _a = _d.sent();
                    return [3 /*break*/, 15];
                case 13: return [4 /*yield*/, getServiceUsers()];
                case 14:
                    _a = _d.sent();
                    _d.label = 15;
                case 15:
                    serviceUsers = _a;
                    writeJson(res, 200, { data: serviceUsers });
                    return [2 /*return*/];
                case 16:
                    if (!(pathname === '/api/db/rota-shifts')) return [3 /*break*/, 18];
                    return [4 /*yield*/, getRotaShifts()];
                case 17:
                    shifts = _d.sent();
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
                case 18:
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
                    if (!(pathname === '/api/auth/devices/pending')) return [3 /*break*/, 20];
                    session = getActiveSession(req);
                    if (!session) {
                        writeJson(res, 401, { error: 'Session expired' });
                        return [2 /*return*/];
                    }
                    if (!isAdminRole(session.roles)) {
                        writeJson(res, 403, { error: 'Admin role required' });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, listPendingDevices(session.companyId)];
                case 19:
                    pendingDevices = _d.sent();
                    writeJson(res, 200, { data: pendingDevices });
                    return [2 /*return*/];
                case 20:
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
                    _d.label = 21;
                case 21:
                    if (!(method === 'POST')) return [3 /*break*/, 55];
                    companyInviteUserId = getCompanyUserInviteIdFromPath(pathname);
                    if (!companyInviteUserId) return [3 /*break*/, 24];
                    session = getActiveSession(req);
                    if (!session) {
                        writeJson(res, 401, { error: 'Unauthorized' });
                        return [2 /*return*/];
                    }
                    parsedUserId = Number.parseInt(companyInviteUserId, 10);
                    if (!Number.isFinite(parsedUserId)) {
                        throw Object.assign(new Error('Invalid user id'), { code: 'VALIDATION_ERROR' });
                    }
                    return [4 /*yield*/, loadCompanyUsers(session.companyId, parsedUserId)];
                case 22:
                    users = _d.sent();
                    user = users[0];
                    if (!user) {
                        throw Object.assign(new Error('User not found'), { code: 'P2025' });
                    }
                    if (!user.email) {
                        throw Object.assign(new Error('User does not have an email address'), { code: 'VALIDATION_ERROR' });
                    }
                    return [4 /*yield*/, sendCompanyUserInvite(user.email, user.name)];
                case 23:
                    inviteResult = _d.sent();
                    writeJson(res, 200, {
                        data: {
                            email: user.email,
                            inviteRedeemUrl: inviteResult.inviteRedeemUrl
                        }
                    });
                    return [2 /*return*/];
                case 24:
                    if (!(pathname === '/api/auth/email/request-link')) return [3 /*break*/, 27];
                    return [4 /*yield*/, readJsonBody(req)];
                case 25:
                    body = _d.sent();
                    email = readString(body.email);
                    return [4 /*yield*/, requestMagicLink(email)];
                case 26:
                    _d.sent();
                    writeJson(res, 200, { ok: true });
                    return [2 /*return*/];
                case 27:
                    if (!(pathname === '/api/auth/email/verify')) return [3 /*break*/, 30];
                    return [4 /*yield*/, readJsonBody(req)];
                case 28:
                    body = _d.sent();
                    token = readString(body.token);
                    return [4 /*yield*/, verifyMagicLink(token)];
                case 29:
                    result = _d.sent();
                    writeJson(res, 200, { data: result });
                    return [2 /*return*/];
                case 30:
                    if (!(pathname === '/api/auth/totp/setup')) return [3 /*break*/, 33];
                    return [4 /*yield*/, readJsonBody(req)];
                case 31:
                    body = _d.sent();
                    challengeToken = readString(body.challengeToken);
                    return [4 /*yield*/, createTotpSetup(challengeToken)];
                case 32:
                    result = _d.sent();
                    writeJson(res, 200, { data: result });
                    return [2 /*return*/];
                case 33:
                    if (!(pathname === '/api/auth/totp/enable')) return [3 /*break*/, 36];
                    return [4 /*yield*/, readJsonBody(req)];
                case 34:
                    body = _d.sent();
                    challengeToken = readString(body.challengeToken);
                    code = readString(body.code);
                    return [4 /*yield*/, enableTotp(challengeToken, code)];
                case 35:
                    _d.sent();
                    writeJson(res, 200, { ok: true });
                    return [2 /*return*/];
                case 36:
                    if (!(pathname === '/api/auth/login/complete')) return [3 /*break*/, 39];
                    return [4 /*yield*/, readJsonBody(req)];
                case 37:
                    body = _d.sent();
                    challengeToken = readString(body.challengeToken);
                    code = readString(body.code);
                    deviceFingerprint = readString(body.deviceFingerprint);
                    deviceLabel = readString(body.deviceLabel);
                    return [4 /*yield*/, completeMagicLogin({ challengeToken: challengeToken, code: code, deviceFingerprint: deviceFingerprint, deviceLabel: deviceLabel })];
                case 38:
                    result = _d.sent();
                    if (result.pendingApproval) {
                        writeJson(res, 202, { data: { pendingApproval: true } });
                        return [2 /*return*/];
                    }
                    writeJson(res, 200, { data: result.session });
                    return [2 /*return*/];
                case 39:
                    if (pathname === '/api/auth/microsoft/exchange') {
                        writeJson(res, 410, { error: 'Microsoft sign-in has been disabled for this environment.' });
                        return [2 /*return*/];
                    }
                    if (pathname === '/api/auth/logout') {
                        token = parseAuthHeader(req);
                        if (token) {
                            authSessions.delete(token);
                        }
                        writeJson(res, 200, { ok: true });
                        return [2 /*return*/];
                    }
                    pendingDeviceId = getPendingDeviceIdFromPath(pathname);
                    pendingDeviceAction = getPendingDeviceActionFromPath(pathname);
                    if (!(pendingDeviceId && pendingDeviceAction)) return [3 /*break*/, 41];
                    session = getActiveSession(req);
                    if (!session) {
                        writeJson(res, 401, { error: 'Session expired' });
                        return [2 /*return*/];
                    }
                    if (!isAdminRole(session.roles)) {
                        writeJson(res, 403, { error: 'Admin role required' });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, setDeviceStatus(session.companyId, pendingDeviceId, session.userId, pendingDeviceAction === 'approve' ? 'Approved' : 'Rejected')];
                case 40:
                    _d.sent();
                    writeJson(res, 200, { ok: true });
                    return [2 /*return*/];
                case 41:
                    if (!(pathname === '/api/db/users')) return [3 /*break*/, 44];
                    return [4 /*yield*/, readJsonBody(req)];
                case 42:
                    body = _d.sent();
                    return [4 /*yield*/, createUser(sanitizeCreateUserBody(body))];
                case 43:
                    user = _d.sent();
                    writeJson(res, 201, { data: user });
                    return [2 /*return*/];
                case 44:
                    if (!(pathname === '/api/db/service-users')) return [3 /*break*/, 47];
                    session = getActiveSession(req);
                    if (!session) {
                        writeJson(res, 401, { error: 'Unauthorized' });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, readJsonBody(req)];
                case 45:
                    body = _d.sent();
                    return [4 /*yield*/, createCompanyServiceUser(session.companyId, sanitizeCreateServiceUserBody(body))];
                case 46:
                    created = _d.sent();
                    writeJson(res, 201, { data: created });
                    return [2 /*return*/];
                case 47:
                    if (!(pathname === '/api/db/company-users')) return [3 /*break*/, 50];
                    session = getActiveSession(req);
                    if (!session) {
                        writeJson(res, 401, { error: 'Unauthorized' });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, readJsonBody(req)];
                case 48:
                    body = _d.sent();
                    return [4 /*yield*/, createCompanyUser(session, sanitizeCompanyUserBody(body))];
                case 49:
                    user = _d.sent();
                    writeJson(res, 201, { data: user });
                    return [2 /*return*/];
                case 50:
                    if (!(pathname === '/api/db/roles')) return [3 /*break*/, 55];
                    return [4 /*yield*/, readJsonBody(req)];
                case 51:
                    body = _d.sent();
                    if (!Array.isArray(body.roles)) return [3 /*break*/, 53];
                    return [4 /*yield*/, syncRoles(body.roles.map(function (role) { return readString(role); }))];
                case 52:
                    result = _d.sent();
                    writeJson(res, 200, { data: result.roles, skippedInUse: result.skippedInUse });
                    return [2 /*return*/];
                case 53: return [4 /*yield*/, createRole(readString(body.name))];
                case 54:
                    role = _d.sent();
                    writeJson(res, 201, { data: role.name });
                    return [2 /*return*/];
                case 55:
                    if (!(method === 'PUT')) return [3 /*break*/, 67];
                    companyUserId = getCompanyUserIdFromPath(pathname);
                    if (!companyUserId) return [3 /*break*/, 58];
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
                case 56:
                    body = _d.sent();
                    return [4 /*yield*/, updateCompanyUser(session, parsedUserId, sanitizeCompanyUserBody(body))];
                case 57:
                    user = _d.sent();
                    writeJson(res, 200, { data: user });
                    return [2 /*return*/];
                case 58:
                    serviceUserId = getServiceUserIdFromPath(pathname);
                    if (!serviceUserId) return [3 /*break*/, 61];
                    session = getActiveSession(req);
                    if (!session) {
                        writeJson(res, 401, { error: 'Unauthorized' });
                        return [2 /*return*/];
                    }
                    parsedServiceUserId = Number.parseInt(serviceUserId, 10);
                    if (!Number.isFinite(parsedServiceUserId)) {
                        throw Object.assign(new Error('Invalid service user id'), { code: 'VALIDATION_ERROR' });
                    }
                    return [4 /*yield*/, readJsonBody(req)];
                case 59:
                    body = _d.sent();
                    return [4 /*yield*/, updateCompanyServiceUser(session.companyId, parsedServiceUserId, sanitizeUpdateServiceUserBody(body))];
                case 60:
                    user = _d.sent();
                    writeJson(res, 200, { data: user });
                    return [2 /*return*/];
                case 61:
                    userId = getUserIdFromPath(pathname);
                    if (!userId) return [3 /*break*/, 64];
                    return [4 /*yield*/, readJsonBody(req)];
                case 62:
                    body = _d.sent();
                    return [4 /*yield*/, updateUser(userId, sanitizeUpdateUserBody(body))];
                case 63:
                    user = _d.sent();
                    writeJson(res, 200, { data: user });
                    return [2 /*return*/];
                case 64:
                    currentRoleName = getRoleNameFromPath(pathname);
                    if (!currentRoleName) return [3 /*break*/, 67];
                    return [4 /*yield*/, readJsonBody(req)];
                case 65:
                    body = _d.sent();
                    return [4 /*yield*/, updateRole(currentRoleName, readString(body.name))];
                case 66:
                    role = _d.sent();
                    writeJson(res, 200, { data: role.name });
                    return [2 /*return*/];
                case 67:
                    if (!(method === 'DELETE')) return [3 /*break*/, 71];
                    userId = getUserIdFromPath(pathname);
                    if (!userId) return [3 /*break*/, 69];
                    return [4 /*yield*/, deleteUser(userId)];
                case 68:
                    _d.sent();
                    writeJson(res, 200, { ok: true });
                    return [2 /*return*/];
                case 69:
                    roleName = getRoleNameFromPath(pathname);
                    if (!roleName) return [3 /*break*/, 71];
                    return [4 /*yield*/, deleteRole(roleName)];
                case 70:
                    _d.sent();
                    writeJson(res, 200, { ok: true });
                    return [2 /*return*/];
                case 71:
                    writeJson(res, 404, { error: 'Not found' });
                    return [3 /*break*/, 73];
                case 72:
                    error_3 = _d.sent();
                    err = error_3;
                    if (err.code === 'JSON_PARSE_ERROR' || err.code === 'VALIDATION_ERROR') {
                        writeJson(res, 400, { error: err.message || 'Invalid request' });
                        return [2 /*return*/];
                    }
                    if (err.code === 'ROLE_IN_USE') {
                        writeJson(res, 409, { error: err.message || 'Role in use', count: (_c = err.count) !== null && _c !== void 0 ? _c : 0 });
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
                    if (err.code === 'AUTH_MAGIC_INVALID') {
                        writeJson(res, 401, { error: err.message || 'Magic link is invalid or expired' });
                        return [2 /*return*/];
                    }
                    if (err.code === 'AUTH_MAGIC_SSO_REQUIRED') {
                        writeJson(res, 403, { error: err.message || 'This account requires Microsoft sign-in' });
                        return [2 /*return*/];
                    }
                    if (err.code === 'AUTH_MAGIC_RATE_LIMITED') {
                        writeJson(res, 429, { error: err.message || 'Too many magic link requests' });
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
                    if (err.code === 'INVITE_CONFIG_MISSING') {
                        writeJson(res, 501, { error: err.message || 'Invite service not configured' });
                        return [2 /*return*/];
                    }
                    if (err.code === 'INVITE_FAILED') {
                        writeJson(res, 502, { error: err.message || 'Invite delivery failed' });
                        return [2 /*return*/];
                    }
                    if (err.code === 'AUTH_MAGIC_CONFIG_MISSING') {
                        writeJson(res, 500, { error: err.message || 'Magic link email not configured' });
                        return [2 /*return*/];
                    }
                    if (err.code === 'AUTH_MAGIC_SEND_FAILED') {
                        writeJson(res, 502, { error: err.message || 'Magic link email delivery failed' });
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
                    return [3 /*break*/, 73];
                case 73: return [2 /*return*/];
            }
        });
    }); };
}
