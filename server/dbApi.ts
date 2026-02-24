import type { IncomingMessage, ServerResponse } from 'node:http';
import { createCipheriv, createDecipheriv, createHash, createHmac, createPublicKey, randomBytes, randomUUID, verify } from 'node:crypto';
import mssql from 'mssql';
import nodemailer from 'nodemailer';
import type { Connect } from 'vite';
import {
  createRole,
  createUser,
  deleteRole,
  deleteUser,
  getRoles,
  getRotaShifts,
  getServiceUsers,
  getUsers,
  pingDatabase,
  syncRoles,
  updateRole,
  updateUser
} from '@halo/hub-db';

function writeJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function getPathname(req: IncomingMessage): string | null {
  if (!req.url) {
    return null;
  }

  const url = new URL(req.url, 'http://127.0.0.1');
  return url.pathname;
}

function normalizeDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
    )
  ).sort((left, right) => left.localeCompare(right));
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeCreateUserBody(body: Record<string, unknown>) {
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

function sanitizeUpdateUserBody(body: Record<string, unknown>) {
  const payload: Record<string, unknown> = {};

  if ('name' in body) payload.name = readString(body.name);
  if ('email' in body) payload.email = readString(body.email);
  if ('phone' in body) payload.phone = readString(body.phone);
  if ('role' in body) payload.role = readString(body.role);
  if ('status' in body) payload.status = readString(body.status);
  if ('lineManager' in body) payload.lineManager = readString(body.lineManager);
  if ('isLineManager' in body) payload.isLineManager = Boolean(body.isLineManager);

  return payload;
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    const raw = Buffer.concat(chunks).toString('utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    throw Object.assign(new Error('Invalid JSON body'), { code: 'JSON_PARSE_ERROR' });
  }
}

function getRoleNameFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/api\/db\/roles\/([^/]+)$/);
  if (!match) {
    return null;
  }

  return decodeURIComponent(match[1]);
}

function getUserIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/api\/db\/users\/([^/]+)$/);
  if (!match) {
    return null;
  }

  return decodeURIComponent(match[1]);
}

function getCompanyUserIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/api\/db\/company-users\/([^/]+)$/);
  if (!match) {
    return null;
  }

  return decodeURIComponent(match[1]);
}

function getCompanyUserInviteIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/api\/db\/company-users\/([^/]+)\/invite$/);
  if (!match) {
    return null;
  }

  return decodeURIComponent(match[1]);
}

function getServiceUserIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/api\/db\/service-users\/([^/]+)$/);
  if (!match) {
    return null;
  }

  return decodeURIComponent(match[1]);
}

function getPendingDeviceIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/api\/auth\/devices\/([^/]+)\/(approve|reject)$/);
  if (!match) return null;
  return decodeURIComponent(match[1]);
}

function getPendingDeviceActionFromPath(pathname: string): 'approve' | 'reject' | null {
  const match = pathname.match(/^\/api\/auth\/devices\/([^/]+)\/(approve|reject)$/);
  if (!match) return null;
  return match[2] === 'approve' ? 'approve' : 'reject';
}

function isPrismaUnavailable(errorCode: string | undefined): boolean {
  return errorCode === 'P1001' || errorCode === 'P1002' || errorCode === 'P1008';
}

type JwtHeader = {
  alg?: string;
  kid?: string;
};

type JwtPayload = {
  aud?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  tid?: string;
  oid?: string;
  preferred_username?: string;
  upn?: string;
  email?: string;
  name?: string;
};

type ExchangeResult = {
  user: {
    userId: number;
    companyId: number;
    staffId: number | null;
    username: string;
    displayName: string;
    companyName: string;
    staffEmail: string | null;
  };
  roles: string[];
  sessionToken: string;
  expiresAt: string;
};

type MagicVerifyResult = {
  challengeToken: string;
  expiresAt: string;
  requiresTotpSetup: boolean;
};

type AuthSession = {
  token: string;
  expiresAt: number;
  userId: number;
  companyId: number;
  roles: string[];
  username: string;
  displayName: string;
  companyName: string;
  staffId: number | null;
  staffEmail: string | null;
};

type CompanyUserRow = {
  id: string;
  name: string;
  role: string;
  status: string;
  lineManager: string;
  email: string;
  phone: string;
  isLineManager: boolean;
  avatarUrl?: string;
};

type CompanyUserInput = {
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  lineManager: string;
  isLineManager: boolean;
  avatarUrl?: string;
};

type ServiceUserApiRow = {
  clientId: number;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: Date | null;
  gender: string | null;
  email: string | null;
  phone: string | null;
  mobilePhone: string | null;
  nhsNumber: string | null;
  gpDetails: string | null;
  fundingSource: string | null;
  preferredName: string | null;
  maritalStatus: string | null;
  birthplace: string | null;
  nationality: string | null;
  languagesSpoken: string | null;
  ethnicity: string | null;
  religion: string | null;
  carerGenderPreference: string | null;
  carerNote: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  preferredContactMethod: string | null;
  dnacpr: string | null;
  dolsStatus: string | null;
  allergies: string | null;
  bloodType: string | null;
  medicalHistory: string | null;
  admissionDate: Date | null;
  nationalInsurance: string | null;
  preferredDrink: string | null;
  prnMeds: string | null;
  keyWorkerName: string | null;
  clientType: string | null;
  riskLevel: string | null;
  activeStatus: boolean | null;
  dischargeDate: Date | null;
  modifiedDate: Date | null;
  address: string | null;
};

type CreateServiceUserInput = {
  firstName: string;
  lastName: string;
  clientType: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  mobilePhone: string;
  address: string;
  nhsNumber: string;
  gpDetails: string;
  riskLevel: string;
  fundingSource: string;
  dnacpr: string;
  dolsStatus: string;
  allergies: string;
  bloodType: string;
  medicalHistory: string;
  admissionDate: string;
  nationalInsurance: string;
  preferredDrink: string;
  prnMeds: string;
  activeStatus: boolean;
  dischargeDate: string;
};

type UpdateServiceUserInput = {
  clientType?: string;
  activeStatus?: boolean;
  dischargeDate?: string;
  keyWorker?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  nhsNumber?: string;
  gpDetails?: string;
  riskLevel?: string;
  fundingSource?: string;
  dnacpr?: string;
  dolsStatus?: string;
  allergies?: string;
  bloodType?: string;
  medicalHistory?: string;
  admissionDate?: string;
  nationalInsurance?: string;
  preferredDrink?: string;
  prnMeds?: string;
  preferredName?: string;
  maritalStatus?: string;
  birthplace?: string;
  nationality?: string;
  languagesSpoken?: string;
  ethnicity?: string;
  religion?: string;
  carerGenderPreference?: string;
  carerNote?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  preferredContactMethod?: string;
};

type LoginUserRow = {
  userId: number;
  companyId: number;
  staffId: number | null;
  username: string;
  accountStatus: string | null;
  firstName: string | null;
  lastName: string | null;
  staffEmail: string | null;
  companyName: string;
};

type EmailLoginToken = {
  email: string;
  tokenHash: string;
  expiresAt: number;
  usedAt: number | null;
  createdAt: number;
};

type PendingLoginChallenge = {
  challengeToken: string;
  tokenHash: string;
  user: LoginUserRow;
  roles: string[];
  expiresAt: number;
  totpSeed?: string;
};

type PendingDeviceRow = {
  deviceId: string;
  userId: number;
  username: string;
  displayName: string;
  companyName: string;
  deviceLabel: string;
  status: string;
  requestedAt: string;
};

const authSessions = new Map<string, AuthSession>();
const emailLoginTokens = new Map<string, EmailLoginToken>();
const emailLoginRequests = new Map<string, number[]>();
const pendingLoginChallenges = new Map<string, PendingLoginChallenge>();
const AUTH_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const EMAIL_MAGIC_TOKEN_TTL_MS = 10 * 60 * 1000;
const EMAIL_MAGIC_REQUEST_WINDOW_MS = 10 * 60 * 1000;
const EMAIL_MAGIC_REQUEST_LIMIT = 5;
const LOGIN_CHALLENGE_TTL_MS = 10 * 60 * 1000;
const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;
const TOTP_ALLOWED_WINDOWS = [-1, 0, 1];
const TOTP_ISSUER = 'HALO';
const OPENID_KEYS_URL = 'https://login.microsoftonline.com/common/discovery/v2.0/keys';
type CryptoJsonWebKey = {
  kty?: string;
  e?: string;
  n?: string;
  kid?: string;
  [key: string]: string | undefined;
};
const jwksCache = new Map<string, CryptoJsonWebKey & { kid?: string }>();
let azureSqlPoolPromise: Promise<mssql.ConnectionPool> | null = null;
let hasStaffAvatarColumnCache: boolean | null = null;
let hasClientKeyWorkerColumnCache: boolean | null = null;
let hasClientCareColumnsCache: boolean | null = null;

function getAzureSqlConnectionString(): string {
  return readString(process.env.AZURE_SQL_CONNECTION_STRING || process.env.SQLSERVER_CONNECTION_STRING);
}

async function getAzureSqlPool(): Promise<mssql.ConnectionPool> {
  const connectionString = getAzureSqlConnectionString();
  if (!connectionString) {
    throw Object.assign(new Error('Server missing AZURE_SQL_CONNECTION_STRING'), { code: 'AZURE_SQL_CONFIG_MISSING' });
  }

  if (!azureSqlPoolPromise) {
    azureSqlPoolPromise = mssql.connect(connectionString).catch((error) => {
      azureSqlPoolPromise = null;
      throw Object.assign(error, { code: (error as { code?: string }).code || 'AZURE_SQL_UNAVAILABLE' });
    });
  }

  return azureSqlPoolPromise;
}

type DbScope = {
  companyId?: number;
  isSuperAdmin?: boolean;
};

function withDbScope(sql: string, scope: DbScope = {}): string {
  const superAdminValue = scope.isSuperAdmin ? '1' : 'NULL';
  const companyValue = Number.isFinite(scope.companyId) ? '@__scopeCompanyId' : 'NULL';
  return `
    EXEC sp_set_session_context @key = N'IsSuperAdmin', @value = ${superAdminValue};
    EXEC sp_set_session_context @key = N'CompanyID', @value = ${companyValue};
    ${sql}
  `;
}

function scopedRequest(target: mssql.ConnectionPool | mssql.Transaction, scope: DbScope = {}): mssql.Request {
  const request = new mssql.Request(target);
  if (Number.isFinite(scope.companyId)) {
    request.input('__scopeCompanyId', mssql.Int, scope.companyId as number);
  }
  return request;
}

async function setTransactionCompanyScope(tx: mssql.Transaction, companyId: number): Promise<void> {
  await scopedRequest(tx, { companyId }).query(
    withDbScope('SELECT 1 AS ok;', { companyId })
  );
}

async function hasStaffAvatarColumn(): Promise<boolean> {
  if (hasStaffAvatarColumnCache !== null) {
    return hasStaffAvatarColumnCache;
  }

  const pool = await getAzureSqlPool();
  const rows = (
    await pool.request().query<{ hasColumn: number }>(`
      SELECT CASE WHEN COL_LENGTH('People.Staff', 'AvatarUrl') IS NULL THEN 0 ELSE 1 END AS hasColumn
    `)
  ).recordset;

  hasStaffAvatarColumnCache = Boolean(rows[0]?.hasColumn);
  return hasStaffAvatarColumnCache;
}

async function hasClientKeyWorkerColumn(): Promise<boolean> {
  if (hasClientKeyWorkerColumnCache !== null) {
    return hasClientKeyWorkerColumnCache;
  }

  const pool = await getAzureSqlPool();
  const rows = (
    await pool.request().query<{ hasColumn: number }>(`
      SELECT CASE WHEN COL_LENGTH('People.Clients', 'KeyWorkerName') IS NULL THEN 0 ELSE 1 END AS hasColumn
    `)
  ).recordset;

  hasClientKeyWorkerColumnCache = Boolean(rows[0]?.hasColumn);
  return hasClientKeyWorkerColumnCache;
}

async function ensureClientCareColumns(): Promise<void> {
  if (hasClientCareColumnsCache) return;
  const pool = await getAzureSqlPool();
  await pool.request().query(`
    IF COL_LENGTH('People.Clients', 'DNACPR') IS NULL
      ALTER TABLE People.Clients ADD DNACPR NVARCHAR(50) NULL;
    IF COL_LENGTH('People.Clients', 'DoLSStatus') IS NULL
      ALTER TABLE People.Clients ADD DoLSStatus NVARCHAR(100) NULL;
    IF COL_LENGTH('People.Clients', 'Allergies') IS NULL
      ALTER TABLE People.Clients ADD Allergies NVARCHAR(1000) NULL;
    IF COL_LENGTH('People.Clients', 'BloodType') IS NULL
      ALTER TABLE People.Clients ADD BloodType NVARCHAR(10) NULL;
    IF COL_LENGTH('People.Clients', 'MedicalHistory') IS NULL
      ALTER TABLE People.Clients ADD MedicalHistory NVARCHAR(2000) NULL;
    IF COL_LENGTH('People.Clients', 'AdmissionDate') IS NULL
      ALTER TABLE People.Clients ADD AdmissionDate DATE NULL;
    IF COL_LENGTH('People.Clients', 'NationalInsurance') IS NULL
      ALTER TABLE People.Clients ADD NationalInsurance NVARCHAR(20) NULL;
    IF COL_LENGTH('People.Clients', 'PreferredDrink') IS NULL
      ALTER TABLE People.Clients ADD PreferredDrink NVARCHAR(100) NULL;
    IF COL_LENGTH('People.Clients', 'PrnMeds') IS NULL
      ALTER TABLE People.Clients ADD PrnMeds NVARCHAR(500) NULL;
  `);
  hasClientCareColumnsCache = true;
}

function getTotpEncryptionKey(): Buffer {
  const raw = readString(process.env.AUTH_TOTP_ENCRYPTION_KEY);
  if (!raw) {
    throw Object.assign(new Error('Server missing AUTH_TOTP_ENCRYPTION_KEY'), { code: 'AUTH_CONFIG_MISSING' });
  }

  try {
    const decoded = Buffer.from(raw, 'base64');
    if (decoded.length !== 32) {
      throw new Error('Invalid key length');
    }
    return decoded;
  } catch {
    throw Object.assign(new Error('AUTH_TOTP_ENCRYPTION_KEY must be base64-encoded 32 bytes'), {
      code: 'AUTH_CONFIG_MISSING'
    });
  }
}

function encryptTotpSecret(secret: string): string {
  const key = getTotpEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

function decryptTotpSecret(payload: string): string {
  const key = getTotpEncryptionKey();
  const [ivB64, tagB64, dataB64] = payload.split('.');
  if (!ivB64 || !tagB64 || !dataB64) {
    throw Object.assign(new Error('Invalid TOTP payload'), { code: 'AUTH_INVALID_TOKEN' });
  }

  const iv = Buffer.from(ivB64, 'base64url');
  const tag = Buffer.from(tagB64, 'base64url');
  const encrypted = Buffer.from(dataB64, 'base64url');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function encodeBase32(input: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < input.length; i += 1) {
    const byte = input[i];
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

function decodeBase32(input: string): Buffer {
  const cleaned = input.toUpperCase().replace(/=+$/g, '').replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const char of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function generateTotpSecret(): string {
  return encodeBase32(randomBytes(20));
}

function generateTotpCode(secretBase32: string, timestampMs: number): string {
  const counter = Math.floor(timestampMs / 1000 / TOTP_STEP_SECONDS);
  const key = decodeBase32(secretBase32);
  const msg = Buffer.alloc(8);
  msg.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  msg.writeUInt32BE(counter % 0x100000000, 4);
  const hmac = createHmac('sha1', key).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const otp = binary % 10 ** TOTP_DIGITS;
  return otp.toString().padStart(TOTP_DIGITS, '0');
}

function verifyTotpCode(secretBase32: string, code: string): boolean {
  const normalized = code.trim();
  if (!/^\d{6}$/.test(normalized)) return false;
  return TOTP_ALLOWED_WINDOWS.some((windowOffset) => {
    const comparison = generateTotpCode(secretBase32, Date.now() + windowOffset * TOTP_STEP_SECONDS * 1000);
    return comparison === normalized;
  });
}

async function ensureAuthSecurityTables(): Promise<void> {
  const pool = await getAzureSqlPool();
  await pool.request().query(`
    IF OBJECT_ID('Auth.UserMfa', 'U') IS NULL
    BEGIN
      CREATE TABLE Auth.UserMfa (
        UserID INT NOT NULL PRIMARY KEY,
        TotpSecretEncrypted NVARCHAR(512) NOT NULL,
        Enabled BIT NOT NULL CONSTRAINT DF_UserMfa_Enabled DEFAULT (1),
        CreatedDate DATETIME2(7) NOT NULL CONSTRAINT DF_UserMfa_Created DEFAULT SYSUTCDATETIME(),
        ModifiedDate DATETIME2(7) NOT NULL CONSTRAINT DF_UserMfa_Modified DEFAULT SYSUTCDATETIME()
      );
    END;

    IF OBJECT_ID('Auth.UserDevice', 'U') IS NULL
    BEGIN
      CREATE TABLE Auth.UserDevice (
        DeviceID UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_UserDevice_DeviceID DEFAULT NEWID() PRIMARY KEY,
        UserID INT NOT NULL,
        CompanyID INT NOT NULL,
        FingerprintHash CHAR(64) NOT NULL,
        DeviceLabel NVARCHAR(200) NOT NULL,
        Status NVARCHAR(20) NOT NULL CONSTRAINT DF_UserDevice_Status DEFAULT N'Pending',
        RequestedAt DATETIME2(7) NOT NULL CONSTRAINT DF_UserDevice_RequestedAt DEFAULT SYSUTCDATETIME(),
        ApprovedAt DATETIME2(7) NULL,
        ApprovedByUserID INT NULL,
        LastSeenAt DATETIME2(7) NULL
      );
      CREATE UNIQUE INDEX UX_UserDevice_User_Fingerprint ON Auth.UserDevice(UserID, CompanyID, FingerprintHash);
      CREATE INDEX IX_UserDevice_Company_Status ON Auth.UserDevice(CompanyID, Status, RequestedAt DESC);
    END;
  `);
}

function decodeBase64Url(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function parseJwt(token: string): { header: JwtHeader; payload: JwtPayload; signed: string; signature: Buffer } {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw Object.assign(new Error('Invalid token format'), { code: 'AUTH_INVALID_TOKEN' });
  }

  try {
    const header = JSON.parse(decodeBase64Url(parts[0])) as JwtHeader;
    const payload = JSON.parse(decodeBase64Url(parts[1])) as JwtPayload;
    return {
      header,
      payload,
      signed: `${parts[0]}.${parts[1]}`,
      signature: Buffer.from(parts[2], 'base64url')
    };
  } catch {
    throw Object.assign(new Error('Unable to decode token'), { code: 'AUTH_INVALID_TOKEN' });
  }
}

async function getJwksKey(kid: string): Promise<(CryptoJsonWebKey & { kid?: string }) | null> {
  if (jwksCache.has(kid)) {
    return jwksCache.get(kid) ?? null;
  }

  const response = await fetch(OPENID_KEYS_URL);
  if (!response.ok) {
    return null;
  }

  const body = (await response.json()) as { keys?: Array<CryptoJsonWebKey & { kid?: string }> };
  for (const key of body.keys ?? []) {
    if (key.kid) {
      jwksCache.set(key.kid, key);
    }
  }

  return jwksCache.get(kid) ?? null;
}

async function validateMicrosoftIdToken(idToken: string): Promise<JwtPayload> {
  const { header, payload, signed, signature } = parseJwt(idToken);
  if (!header.kid || header.alg !== 'RS256') {
    throw Object.assign(new Error('Unsupported token header'), { code: 'AUTH_INVALID_TOKEN' });
  }

  const key = await getJwksKey(header.kid);
  if (!key) {
    throw Object.assign(new Error('Signing key not found'), { code: 'AUTH_INVALID_TOKEN' });
  }

  const publicKey = createPublicKey({ key, format: 'jwk' });
  const validSignature = verify('RSA-SHA256', Buffer.from(signed), publicKey, signature);
  if (!validSignature) {
    throw Object.assign(new Error('Invalid token signature'), { code: 'AUTH_INVALID_TOKEN' });
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < now) {
    throw Object.assign(new Error('Token expired'), { code: 'AUTH_INVALID_TOKEN' });
  }

  const expectedAudience = process.env.AZURE_CLIENT_ID || process.env.VITE_AZURE_CLIENT_ID;
  if (!expectedAudience) {
    throw Object.assign(new Error('Server missing AZURE_CLIENT_ID (or VITE_AZURE_CLIENT_ID)'), { code: 'AUTH_CONFIG_MISSING' });
  }

  if (payload.aud !== expectedAudience) {
    throw Object.assign(new Error('Token audience mismatch'), { code: 'AUTH_INVALID_TOKEN' });
  }

  if (!payload.tid || !payload.oid) {
    throw Object.assign(new Error('Token missing tenant or object id'), { code: 'AUTH_INVALID_TOKEN' });
  }

  const validIssuerPrefix = `https://login.microsoftonline.com/${payload.tid}/v2.0`;
  if (!payload.iss || payload.iss !== validIssuerPrefix) {
    throw Object.assign(new Error('Token issuer mismatch'), { code: 'AUTH_INVALID_TOKEN' });
  }

  return payload;
}

function extractLoginEmail(payload: JwtPayload): string {
  return readString(payload.preferred_username) || readString(payload.upn) || readString(payload.email);
}

function parseAuthHeader(req: IncomingMessage): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  return header.slice('Bearer '.length).trim();
}

function removeExpiredSessions(): void {
  const now = Date.now();
  authSessions.forEach((session, token) => {
    if (session.expiresAt <= now) authSessions.delete(token);
  });
}

function getActiveSession(req: IncomingMessage): AuthSession | null {
  removeExpiredSessions();
  const token = parseAuthHeader(req);
  if (!token) return null;
  const session = authSessions.get(token);
  if (!session || session.expiresAt <= Date.now()) return null;
  return session;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashMagicToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function removeExpiredMagicTokens(): void {
  const now = Date.now();
  emailLoginTokens.forEach((token, key) => {
    if (token.expiresAt <= now || token.usedAt) {
      emailLoginTokens.delete(key);
    }
  });
}

function checkMagicLinkRateLimit(email: string): void {
  const now = Date.now();
  const key = normalizeEmail(email);
  const history = emailLoginRequests.get(key) ?? [];
  const fresh = history.filter((entry) => now - entry <= EMAIL_MAGIC_REQUEST_WINDOW_MS);
  if (fresh.length >= EMAIL_MAGIC_REQUEST_LIMIT) {
    throw Object.assign(new Error('Too many magic link requests. Please wait and try again.'), { code: 'AUTH_MAGIC_RATE_LIMITED' });
  }
  fresh.push(now);
  emailLoginRequests.set(key, fresh);
}

type EmailMagicConfig = {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  appBaseUrl: string;
};

function getEmailMagicConfig(): EmailMagicConfig {
  const smtpHost = readString(process.env.SMTP_HOST);
  const smtpPort = Number.parseInt(readString(process.env.SMTP_PORT || '587'), 10);
  const smtpSecure = readString(process.env.SMTP_SECURE).toLowerCase() === 'true';
  const smtpUser = readString(process.env.SMTP_USER);
  const smtpPass = readString(process.env.SMTP_PASS);
  const fromEmail = readString(process.env.SMTP_FROM_EMAIL);
  const appBaseUrl = readString(process.env.APP_BASE_URL || process.env.VITE_AZURE_REDIRECT_URI);

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !fromEmail || !appBaseUrl) {
    throw Object.assign(
      new Error('Magic link email not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL, APP_BASE_URL.'),
      { code: 'AUTH_MAGIC_CONFIG_MISSING' }
    );
  }

  return {
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser,
    smtpPass,
    fromEmail,
    appBaseUrl
  };
}

async function sendMagicLinkEmail(email: string, link: string): Promise<void> {
  const config = getEmailMagicConfig();
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass
    }
  });

  const info = await transporter.sendMail({
    from: config.fromEmail,
    to: email,
    subject: 'Your HALO sign-in link',
    text: `Use this link to sign in to HALO:\n\n${link}\n\nThis link expires in 10 minutes and can be used once.`,
    html: `<p>Use this link to sign in to HALO:</p><p><a href="${link}">${link}</a></p><p>This link expires in 10 minutes and can be used once.</p>`
  });

  if (!info.messageId) {
    throw Object.assign(new Error('Magic link email failed to send'), { code: 'AUTH_MAGIC_SEND_FAILED' });
  }
}

async function findLoginUserByEmail(email: string): Promise<LoginUserRow | null> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const pool = await getAzureSqlPool();
  const rows = (
    await scopedRequest(pool, { isSuperAdmin: true })
      .input('email', mssql.NVarChar(320), normalizedEmail)
      .query<LoginUserRow>(withDbScope(`
        SELECT TOP 1
          ua.UserID AS userId,
          ua.CompanyID AS companyId,
          ua.StaffID AS staffId,
          ua.Username AS username,
          ua.AccountStatus AS accountStatus,
          s.FirstName AS firstName,
          s.LastName AS lastName,
          s.Email AS staffEmail,
          c.CompanyName AS companyName
        FROM Auth.UserAccount ua
        INNER JOIN People.Company c ON c.CompanyID = ua.CompanyID
        LEFT JOIN People.Staff s ON s.StaffID = ua.StaffID
        WHERE LOWER(ua.Username) = LOWER(@email)
          AND ISNULL(c.ActiveStatus, 1) = 1
          AND ISNULL(ua.AccountStatus, N'Active') = N'Active'
      `, { isSuperAdmin: true }))
  ).recordset;

  return rows[0] ?? null;
}

async function getUserTotpSecret(userId: number): Promise<string | null> {
  await ensureAuthSecurityTables();
  const pool = await getAzureSqlPool();
  const rows = (
    await scopedRequest(pool, { isSuperAdmin: true }).input('userId', mssql.Int, userId).query<{ secret: string; enabled: boolean }>(withDbScope(`
      SELECT TOP 1 TotpSecretEncrypted AS secret, Enabled AS enabled
      FROM Auth.UserMfa
      WHERE UserID = @userId
    `, { isSuperAdmin: true }))
  ).recordset;

  const entry = rows[0];
  if (!entry?.secret || !entry.enabled) return null;
  return decryptTotpSecret(entry.secret);
}

async function setUserTotpSecret(userId: number, secretBase32: string): Promise<void> {
  await ensureAuthSecurityTables();
  const encrypted = encryptTotpSecret(secretBase32);
  const pool = await getAzureSqlPool();
  await scopedRequest(pool, { isSuperAdmin: true })
    .input('userId', mssql.Int, userId)
    .input('secret', mssql.NVarChar(512), encrypted)
    .query(withDbScope(`
      IF EXISTS (SELECT 1 FROM Auth.UserMfa WHERE UserID = @userId)
      BEGIN
        UPDATE Auth.UserMfa
        SET TotpSecretEncrypted = @secret,
            Enabled = 1,
            ModifiedDate = SYSUTCDATETIME()
        WHERE UserID = @userId
      END
      ELSE
      BEGIN
        INSERT INTO Auth.UserMfa (UserID, TotpSecretEncrypted, Enabled, CreatedDate, ModifiedDate)
        VALUES (@userId, @secret, 1, SYSUTCDATETIME(), SYSUTCDATETIME())
      END
    `, { isSuperAdmin: true }));
}

function hashDeviceFingerprint(rawFingerprint: string): string {
  return createHash('sha256').update(rawFingerprint).digest('hex');
}

async function getOrCreateUserDevice(params: {
  userId: number;
  companyId: number;
  fingerprintHash: string;
  deviceLabel: string;
}): Promise<{ deviceId: string; status: string }> {
  await ensureAuthSecurityTables();
  const pool = await getAzureSqlPool();
  const existing = (
    await scopedRequest(pool, { companyId: params.companyId })
      .input('userId', mssql.Int, params.userId)
      .input('companyId', mssql.Int, params.companyId)
      .input('fingerprintHash', mssql.Char(64), params.fingerprintHash)
      .query<{ deviceId: string; status: string }>(withDbScope(`
        SELECT TOP 1 CAST(DeviceID AS NVARCHAR(36)) AS deviceId, Status AS status
        FROM Auth.UserDevice
        WHERE UserID = @userId
          AND CompanyID = @companyId
          AND FingerprintHash = @fingerprintHash
      `, { companyId: params.companyId }))
  ).recordset[0];

  if (existing) {
    return existing;
  }

  const created = (
    await scopedRequest(pool, { companyId: params.companyId })
      .input('userId', mssql.Int, params.userId)
      .input('companyId', mssql.Int, params.companyId)
      .input('fingerprintHash', mssql.Char(64), params.fingerprintHash)
      .input('deviceLabel', mssql.NVarChar(200), params.deviceLabel || 'Unknown device')
      .query<{ deviceId: string; status: string }>(withDbScope(`
        INSERT INTO Auth.UserDevice (
          UserID,
          CompanyID,
          FingerprintHash,
          DeviceLabel,
          Status,
          RequestedAt
        )
        OUTPUT CAST(inserted.DeviceID AS NVARCHAR(36)) AS deviceId, inserted.Status AS status
        VALUES (
          @userId,
          @companyId,
          @fingerprintHash,
          @deviceLabel,
          N'Pending',
          SYSUTCDATETIME()
        )
      `, { companyId: params.companyId }))
  ).recordset[0];

  return created;
}

async function markDeviceLastSeen(deviceId: string, companyId?: number): Promise<void> {
  await ensureAuthSecurityTables();
  const pool = await getAzureSqlPool();
  await scopedRequest(pool, companyId ? { companyId } : { isSuperAdmin: true })
    .input('deviceId', mssql.UniqueIdentifier, deviceId).query(withDbScope(`
    UPDATE Auth.UserDevice
    SET LastSeenAt = SYSUTCDATETIME()
    WHERE DeviceID = @deviceId
  `, companyId ? { companyId } : { isSuperAdmin: true }));
}

function isAdminRole(roles: string[]): boolean {
  return roles.some((role) => {
    const normalized = role.toLowerCase();
    return normalized.includes('admin') || normalized.includes('manager');
  });
}

async function listPendingDevices(companyId: number): Promise<PendingDeviceRow[]> {
  await ensureAuthSecurityTables();
  const pool = await getAzureSqlPool();
  const rows = (
    await scopedRequest(pool, { companyId }).input('companyId', mssql.Int, companyId).query<PendingDeviceRow>(withDbScope(`
      SELECT
        CAST(d.DeviceID AS NVARCHAR(36)) AS deviceId,
        d.UserID AS userId,
        ua.Username AS username,
        LTRIM(RTRIM(CONCAT(ISNULL(s.FirstName, N''), N' ', ISNULL(s.LastName, N'')))) AS displayName,
        c.CompanyName AS companyName,
        d.DeviceLabel AS deviceLabel,
        d.Status AS status,
        CONVERT(NVARCHAR(30), d.RequestedAt, 127) AS requestedAt
      FROM Auth.UserDevice d
      INNER JOIN Auth.UserAccount ua
        ON ua.UserID = d.UserID
       AND ua.CompanyID = d.CompanyID
      INNER JOIN People.Company c
        ON c.CompanyID = d.CompanyID
      LEFT JOIN People.Staff s
        ON s.StaffID = ua.StaffID
      WHERE d.CompanyID = @companyId
        AND d.Status = N'Pending'
      ORDER BY d.RequestedAt DESC
    `, { companyId }))
  ).recordset;
  return rows;
}

async function setDeviceStatus(
  companyId: number,
  deviceId: string,
  adminUserId: number,
  status: 'Approved' | 'Rejected'
): Promise<void> {
  await ensureAuthSecurityTables();
  const pool = await getAzureSqlPool();
  await scopedRequest(pool, { companyId })
    .input('companyId', mssql.Int, companyId)
    .input('deviceId', mssql.UniqueIdentifier, deviceId)
    .input('adminUserId', mssql.Int, adminUserId)
    .input('status', mssql.NVarChar(20), status)
    .query(withDbScope(`
      UPDATE Auth.UserDevice
      SET Status = @status,
          ApprovedByUserID = @adminUserId,
          ApprovedAt = SYSUTCDATETIME()
      WHERE CompanyID = @companyId
        AND DeviceID = @deviceId
    `, { companyId }));
}

async function loadUserRoles(userId: number, companyId: number): Promise<string[]> {
  const pool = await getAzureSqlPool();
  const rolesRows = (
    await scopedRequest(pool, { companyId })
      .input('userId', mssql.Int, userId)
      .input('companyId', mssql.Int, companyId)
      .query<{ roleName: string }>(withDbScope(`
        SELECT ur.RoleName AS roleName
        FROM Auth.UserRoleAssignment ura
        INNER JOIN Auth.UserRole ur
          ON ur.RoleID = ura.RoleID
         AND ur.CompanyID = ura.CompanyID
        WHERE ura.UserID = @userId
          AND ura.CompanyID = @companyId
          AND (ura.ExpiryDate IS NULL OR ura.ExpiryDate >= CAST(SYSUTCDATETIME() AS date))
          AND ISNULL(ur.IsActive, 1) = 1
      `, { companyId }))
  ).recordset;

  return uniqueSorted(rolesRows.map((role) => readString(role.roleName)));
}

async function companyHasActiveAdmin(companyId: number): Promise<boolean> {
  const pool = await getAzureSqlPool();
  const rows = (
    await scopedRequest(pool, { companyId })
      .input('companyId', mssql.Int, companyId)
      .query<{ hasAdmin: number }>(withDbScope(`
        SELECT TOP 1 CAST(1 AS INT) AS hasAdmin
        FROM Auth.UserRoleAssignment ura
        INNER JOIN Auth.UserRole ur
          ON ur.RoleID = ura.RoleID
         AND ur.CompanyID = ura.CompanyID
        INNER JOIN Auth.UserAccount ua
          ON ua.UserID = ura.UserID
         AND ua.CompanyID = ura.CompanyID
        WHERE ura.CompanyID = @companyId
          AND (ura.ExpiryDate IS NULL OR ura.ExpiryDate >= CAST(SYSUTCDATETIME() AS date))
          AND ISNULL(ur.IsActive, 1) = 1
          AND ISNULL(ua.AccountStatus, N'Active') = N'Active'
          AND (
            LOWER(ur.RoleName) LIKE N'%admin%'
            OR LOWER(ur.RoleName) LIKE N'%manager%'
          )
      `, { companyId }))
  ).recordset;

  return Boolean(rows[0]?.hasAdmin);
}

function issueSession(user: LoginUserRow, roles: string[]): ExchangeResult {
  const displayNameFromStaff = [readString(user.firstName), readString(user.lastName)].filter(Boolean).join(' ').trim();
  const displayName = displayNameFromStaff || user.username;
  const sessionToken = randomUUID();
  const expiresAt = Date.now() + AUTH_SESSION_TTL_MS;

  authSessions.set(sessionToken, {
    token: sessionToken,
    expiresAt,
    userId: user.userId,
    companyId: user.companyId,
    roles,
    username: user.username,
    displayName,
    companyName: user.companyName,
    staffId: user.staffId,
    staffEmail: user.staffEmail
  });

  return {
    sessionToken,
    expiresAt: new Date(expiresAt).toISOString(),
    user: {
      userId: user.userId,
      companyId: user.companyId,
      staffId: user.staffId,
      username: user.username,
      displayName,
      companyName: user.companyName,
      staffEmail: user.staffEmail
    },
    roles
  };
}

async function requestMagicLink(email: string): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw Object.assign(new Error('Email is required'), { code: 'VALIDATION_ERROR' });
  }

  checkMagicLinkRateLimit(normalizedEmail);
  const user = await findLoginUserByEmail(normalizedEmail);
  // Prevent account enumeration.
  if (!user) return;

  removeExpiredMagicTokens();
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashMagicToken(token);
  const expiresAt = Date.now() + EMAIL_MAGIC_TOKEN_TTL_MS;
  const config = getEmailMagicConfig();
  const link = `${config.appBaseUrl.replace(/\/$/, '')}/login?magic_token=${encodeURIComponent(token)}`;

  emailLoginTokens.forEach((entry, key) => {
    if (entry.email === normalizedEmail) {
      emailLoginTokens.delete(key);
    }
  });

  emailLoginTokens.set(tokenHash, {
    email: normalizedEmail,
    tokenHash,
    createdAt: Date.now(),
    expiresAt,
    usedAt: null
  });

  await sendMagicLinkEmail(normalizedEmail, link);
}

function removeExpiredChallenges(): void {
  const now = Date.now();
  pendingLoginChallenges.forEach((challenge, key) => {
    if (challenge.expiresAt <= now) pendingLoginChallenges.delete(key);
  });
}

function getLoginChallenge(challengeToken: string): PendingLoginChallenge {
  removeExpiredChallenges();
  const challenge = pendingLoginChallenges.get(challengeToken);
  if (!challenge || challenge.expiresAt <= Date.now()) {
    throw Object.assign(new Error('Login challenge expired. Please request a new sign-in link.'), {
      code: 'AUTH_MAGIC_INVALID'
    });
  }
  return challenge;
}

async function verifyMagicLink(token: string): Promise<MagicVerifyResult> {
  const normalizedToken = token.trim();
  if (!normalizedToken) {
    throw Object.assign(new Error('Missing token'), { code: 'VALIDATION_ERROR' });
  }

  removeExpiredMagicTokens();
  const tokenHash = hashMagicToken(normalizedToken);
  const entry = emailLoginTokens.get(tokenHash);
  if (!entry || entry.usedAt || entry.expiresAt < Date.now()) {
    throw Object.assign(new Error('Magic link is invalid or expired.'), { code: 'AUTH_MAGIC_INVALID' });
  }

  const user = await findLoginUserByEmail(entry.email);
  if (!user) {
    throw Object.assign(new Error('Magic link is invalid or expired.'), { code: 'AUTH_MAGIC_INVALID' });
  }
  const roles = await loadUserRoles(user.userId, user.companyId);
  removeExpiredChallenges();
  const challengeToken = randomUUID();
  const expiresAt = Date.now() + LOGIN_CHALLENGE_TTL_MS;
  pendingLoginChallenges.set(challengeToken, {
    challengeToken,
    tokenHash,
    user,
    roles,
    expiresAt
  });

  const existingSecret = await getUserTotpSecret(user.userId);
  return {
    challengeToken,
    expiresAt: new Date(expiresAt).toISOString(),
    requiresTotpSetup: !existingSecret
  };
}

async function createTotpSetup(challengeToken: string): Promise<{ challengeToken: string; manualKey: string; otpauthUri: string }> {
  const challenge = getLoginChallenge(challengeToken);
  const existingSecret = await getUserTotpSecret(challenge.user.userId);
  if (existingSecret) {
    return {
      challengeToken,
      manualKey: existingSecret,
      otpauthUri: `otpauth://totp/${encodeURIComponent(`${TOTP_ISSUER}:${challenge.user.username}`)}?secret=${existingSecret}&issuer=${encodeURIComponent(TOTP_ISSUER)}&digits=${TOTP_DIGITS}&period=${TOTP_STEP_SECONDS}`
    };
  }

  const secret = challenge.totpSeed || generateTotpSecret();
  challenge.totpSeed = secret;
  pendingLoginChallenges.set(challengeToken, challenge);
  return {
    challengeToken,
    manualKey: secret,
    otpauthUri: `otpauth://totp/${encodeURIComponent(`${TOTP_ISSUER}:${challenge.user.username}`)}?secret=${secret}&issuer=${encodeURIComponent(TOTP_ISSUER)}&digits=${TOTP_DIGITS}&period=${TOTP_STEP_SECONDS}`
  };
}

async function enableTotp(challengeToken: string, code: string): Promise<void> {
  const challenge = getLoginChallenge(challengeToken);
  const secret = challenge.totpSeed || (await getUserTotpSecret(challenge.user.userId));
  if (!secret) {
    throw Object.assign(new Error('TOTP setup is required before verification.'), { code: 'VALIDATION_ERROR' });
  }
  if (!verifyTotpCode(secret, code)) {
    throw Object.assign(new Error('Invalid authenticator code.'), { code: 'AUTH_MAGIC_INVALID' });
  }
  await setUserTotpSecret(challenge.user.userId, secret);
  challenge.totpSeed = undefined;
  pendingLoginChallenges.set(challengeToken, challenge);
}

async function completeMagicLogin(params: {
  challengeToken: string;
  code: string;
  deviceFingerprint: string;
  deviceLabel: string;
}): Promise<{ pendingApproval?: boolean; session?: ExchangeResult }> {
  const challenge = getLoginChallenge(params.challengeToken);
  const secret = await getUserTotpSecret(challenge.user.userId);
  if (!secret) {
    throw Object.assign(new Error('Authenticator setup required.'), { code: 'AUTH_MAGIC_INVALID' });
  }
  if (!verifyTotpCode(secret, params.code)) {
    throw Object.assign(new Error('Invalid authenticator code.'), { code: 'AUTH_MAGIC_INVALID' });
  }

  const fingerprintRaw = params.deviceFingerprint.trim();
  if (fingerprintRaw.length < 12) {
    throw Object.assign(new Error('Device fingerprint missing.'), { code: 'VALIDATION_ERROR' });
  }

  const fingerprintHash = hashDeviceFingerprint(fingerprintRaw);
  const device = await getOrCreateUserDevice({
    userId: challenge.user.userId,
    companyId: challenge.user.companyId,
    fingerprintHash,
    deviceLabel: params.deviceLabel.trim() || 'Unknown device'
  });

  if (device.status !== 'Approved') {
    const hasAdmin = await companyHasActiveAdmin(challenge.user.companyId);
    if (!hasAdmin) {
      // Bootstrap path: if no admin exists for this company yet, allow first-device approval.
      await setDeviceStatus(challenge.user.companyId, device.deviceId, challenge.user.userId, 'Approved');
    } else {
      return { pendingApproval: true };
    }
  }

  await markDeviceLastSeen(device.deviceId, challenge.user.companyId);
  const tokenEntry = emailLoginTokens.get(challenge.tokenHash);
  if (tokenEntry) {
    tokenEntry.usedAt = Date.now();
    emailLoginTokens.delete(challenge.tokenHash);
  }
  pendingLoginChallenges.delete(params.challengeToken);
  return { session: issueSession(challenge.user, challenge.roles) };
}

function sanitizeCompanyUserBody(body: Record<string, unknown>): CompanyUserInput {
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

function sanitizeCreateServiceUserBody(body: Record<string, unknown>): CreateServiceUserInput {
  const activeStatusRaw = body.activeStatus;
  const activeStatus =
    typeof activeStatusRaw === 'boolean'
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
    dnacpr: readString(body.dnacpr),
    dolsStatus: readString(body.dolsStatus),
    allergies: readString(body.allergies),
    bloodType: readString(body.bloodType),
    medicalHistory: readString(body.medicalHistory),
    admissionDate: readString(body.admissionDate),
    nationalInsurance: readString(body.nationalInsurance),
    preferredDrink: readString(body.preferredDrink),
    prnMeds: readString(body.prnMeds),
    activeStatus,
    dischargeDate: readString(body.dischargeDate)
  };
}

function sanitizeUpdateServiceUserBody(body: Record<string, unknown>): UpdateServiceUserInput {
  const payload: UpdateServiceUserInput = {};

  if ('clientType' in body) payload.clientType = readString(body.clientType);
  if ('dischargeDate' in body) payload.dischargeDate = readString(body.dischargeDate);
  if ('keyWorker' in body) payload.keyWorker = readString(body.keyWorker);
  if ('activeStatus' in body) {
    const activeStatusRaw = body.activeStatus;
    payload.activeStatus =
      typeof activeStatusRaw === 'boolean'
        ? activeStatusRaw
        : readString(activeStatusRaw).toLowerCase() !== 'false';
  }

  if ('firstName' in body) payload.firstName = readString(body.firstName);
  if ('lastName' in body) payload.lastName = readString(body.lastName);
  if ('dateOfBirth' in body) payload.dateOfBirth = readString(body.dateOfBirth);
  if ('gender' in body) payload.gender = readString(body.gender);
  if ('email' in body) payload.email = readString(body.email);
  if ('phone' in body) payload.phone = readString(body.phone);
  if ('mobilePhone' in body) payload.mobilePhone = readString(body.mobilePhone);
  if ('address' in body) payload.address = readString(body.address);
  if ('nhsNumber' in body) payload.nhsNumber = readString(body.nhsNumber);
  if ('gpDetails' in body) payload.gpDetails = readString(body.gpDetails);
  if ('riskLevel' in body) payload.riskLevel = readString(body.riskLevel);
  if ('fundingSource' in body) payload.fundingSource = readString(body.fundingSource);
  if ('dnacpr' in body) payload.dnacpr = readString(body.dnacpr);
  if ('dolsStatus' in body) payload.dolsStatus = readString(body.dolsStatus);
  if ('allergies' in body) payload.allergies = readString(body.allergies);
  if ('bloodType' in body) payload.bloodType = readString(body.bloodType);
  if ('medicalHistory' in body) payload.medicalHistory = readString(body.medicalHistory);
  if ('admissionDate' in body) payload.admissionDate = readString(body.admissionDate);
  if ('nationalInsurance' in body) payload.nationalInsurance = readString(body.nationalInsurance);
  if ('preferredDrink' in body) payload.preferredDrink = readString(body.preferredDrink);
  if ('prnMeds' in body) payload.prnMeds = readString(body.prnMeds);
  if ('preferredName' in body) payload.preferredName = readString(body.preferredName);
  if ('maritalStatus' in body) payload.maritalStatus = readString(body.maritalStatus);
  if ('birthplace' in body) payload.birthplace = readString(body.birthplace);
  if ('nationality' in body) payload.nationality = readString(body.nationality);
  if ('languagesSpoken' in body) payload.languagesSpoken = readString(body.languagesSpoken);
  if ('ethnicity' in body) payload.ethnicity = readString(body.ethnicity);
  if ('religion' in body) payload.religion = readString(body.religion);
  if ('carerGenderPreference' in body) payload.carerGenderPreference = readString(body.carerGenderPreference);
  if ('carerNote' in body) payload.carerNote = readString(body.carerNote);
  if ('emergencyContactName' in body) payload.emergencyContactName = readString(body.emergencyContactName);
  if ('emergencyContactPhone' in body) payload.emergencyContactPhone = readString(body.emergencyContactPhone);
  if ('emergencyContactRelation' in body) payload.emergencyContactRelation = readString(body.emergencyContactRelation);
  if ('preferredContactMethod' in body) payload.preferredContactMethod = readString(body.preferredContactMethod);

  return payload;
}

function supportTierFromRisk(riskLevel: string): 'Enhanced' | 'Standard' | 'Light' {
  const value = riskLevel.trim().toLowerCase();
  if (value === 'high') return 'Enhanced';
  if (value === 'medium') return 'Standard';
  return 'Light';
}

function mapServiceUserStatus(active: boolean, dischargeDate: Date | null): 'active' | 'inactive' | 'hospitalised' | 'discharged' {
  if (dischargeDate) return 'discharged';
  return active ? 'active' : 'inactive';
}

function toIsoDate(value: Date | null): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function mapServiceUserRow(row: ServiceUserApiRow) {
  const name = [readString(row.firstName), readString(row.lastName)].filter(Boolean).join(' ').trim() || `Client ${row.clientId}`;
  const status = mapServiceUserStatus(Boolean(row.activeStatus), row.dischargeDate);
  const zone = readString(row.clientType) || 'General';
  const addressValue = readString(row.address);
  const predefinedBuildingZones = new Set(['Maple House', 'Harbor Court', 'Cedar Lodge', 'Orchard View', 'Orbit Place']);
  const unit = predefinedBuildingZones.has(zone)
    ? addressValue.split(',')[0]?.trim() || `Client ${row.clientId}`
    : addressValue || `Client ${row.clientId}`;
  const risk = readString(row.riskLevel);
  const flags = risk.toLowerCase() === 'high' ? ['Behaviour support'] : [];

  return {
    id: String(row.clientId),
    name,
    status,
    zone,
    unit,
    keyWorker: readString(row.keyWorkerName) || 'Unassigned',
    supportTier: supportTierFromRisk(risk),
    lastCheckIn: toIsoDate(row.modifiedDate),
    mood: 'ok',
    moodUpdated: row.modifiedDate ? 'updated recently' : 'not recorded',
    flags,
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
    dnacpr: readString(row.dnacpr),
    dolsStatus: readString(row.dolsStatus),
    allergies: readString(row.allergies),
    bloodType: readString(row.bloodType),
    medicalHistory: readString(row.medicalHistory),
    admissionDate: row.admissionDate ? row.admissionDate.toISOString().slice(0, 10) : '',
    nationalInsurance: readString(row.nationalInsurance),
    preferredDrink: readString(row.preferredDrink),
    prnMeds: readString(row.prnMeds),
    activeStatus: Boolean(row.activeStatus),
    dischargeDate: row.dischargeDate ? row.dischargeDate.toISOString().slice(0, 10) : ''
  };
}

async function loadCompanyServiceUsers(companyId: number) {
  await ensureClientCareColumns();
  const pool = await getAzureSqlPool();
  const hasKeyWorker = await hasClientKeyWorkerColumn();
  const keyWorkerSelect = hasKeyWorker
    ? `c.KeyWorkerName AS keyWorkerName,`
    : `CAST(NULL AS NVARCHAR(200)) AS keyWorkerName,`;
  const rows = (
    await scopedRequest(pool, { companyId })
      .input('companyId', mssql.Int, companyId)
      .query<ServiceUserApiRow>(withDbScope(`
        SELECT
          c.ClientID AS clientId,
          c.FirstName AS firstName,
          c.LastName AS lastName,
          c.DateOfBirth AS dateOfBirth,
          c.Gender AS gender,
          c.Email AS email,
          c.Phone AS phone,
          c.MobilePhone AS mobilePhone,
          c.NHS_Number AS nhsNumber,
          c.GP_Details AS gpDetails,
          c.FundingSource AS fundingSource,
          c.PreferredName AS preferredName,
          c.MaritalStatus AS maritalStatus,
          c.Birthplace AS birthplace,
          c.Nationality AS nationality,
          c.LanguagesSpoken AS languagesSpoken,
          c.Ethnicity AS ethnicity,
          c.Religion AS religion,
          c.CarerGenderPreference AS carerGenderPreference,
          c.CarerNote AS carerNote,
          c.EmergencyContactName AS emergencyContactName,
          c.EmergencyContactPhone AS emergencyContactPhone,
          c.EmergencyContactRelation AS emergencyContactRelation,
          c.PreferredContactMethod AS preferredContactMethod,
          c.DNACPR AS dnacpr,
          c.DoLSStatus AS dolsStatus,
          c.Allergies AS allergies,
          c.BloodType AS bloodType,
          c.MedicalHistory AS medicalHistory,
          c.AdmissionDate AS admissionDate,
          c.NationalInsurance AS nationalInsurance,
          c.PreferredDrink AS preferredDrink,
          c.PrnMeds AS prnMeds,
          ${keyWorkerSelect}
          c.ClientType AS clientType,
          c.RiskLevel AS riskLevel,
          c.ActiveStatus AS activeStatus,
          c.DischargeDate AS dischargeDate,
          c.ModifiedDate AS modifiedDate,
          c.Address AS address
        FROM People.Clients c
        WHERE c.CompanyID = @companyId
        ORDER BY c.ModifiedDate DESC, c.ClientID DESC
      `, { companyId }))
  ).recordset;

  return rows.map(mapServiceUserRow);
}

async function createCompanyServiceUser(companyId: number, payload: CreateServiceUserInput) {
  if (!payload.firstName || !payload.lastName) {
    throw Object.assign(new Error('First name and last name are required'), { code: 'VALIDATION_ERROR' });
  }

  await ensureClientCareColumns();
  const pool = await getAzureSqlPool();
  const request = scopedRequest(pool, { companyId })
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
    .input('dnacpr', mssql.NVarChar(50), payload.dnacpr || '')
    .input('dolsStatus', mssql.NVarChar(100), payload.dolsStatus || '')
    .input('allergies', mssql.NVarChar(1000), payload.allergies || '')
    .input('bloodType', mssql.NVarChar(10), payload.bloodType || '')
    .input('medicalHistory', mssql.NVarChar(2000), payload.medicalHistory || '')
    .input('admissionDate', mssql.Date, payload.admissionDate || null)
    .input('nationalInsurance', mssql.NVarChar(20), payload.nationalInsurance || '')
    .input('preferredDrink', mssql.NVarChar(100), payload.preferredDrink || '')
    .input('prnMeds', mssql.NVarChar(500), payload.prnMeds || '')
    .input('activeStatus', mssql.Bit, payload.activeStatus ? 1 : 0)
    .input('dischargeDate', mssql.Date, payload.dischargeDate || null);

  const insertedRows = (
    await request.query<{ clientId: number }>(withDbScope(`
      INSERT INTO People.Clients (
        CompanyID,
        ClientType,
        FirstName,
        LastName,
        DateOfBirth,
        Gender,
        Email,
        Phone,
        MobilePhone,
        Address,
        NHS_Number,
        GP_Details,
        RiskLevel,
        FundingSource,
        DNACPR,
        DoLSStatus,
        Allergies,
        BloodType,
        MedicalHistory,
        AdmissionDate,
        NationalInsurance,
        PreferredDrink,
        PrnMeds,
        ActiveStatus,
        DischargeDate,
        CreatedDate,
        ModifiedDate
      )
      VALUES (
        @companyId,
        @clientType,
        @firstName,
        @lastName,
        @dateOfBirth,
        @gender,
        @email,
        @phone,
        @mobilePhone,
        @address,
        @nhsNumber,
        @gpDetails,
        @riskLevel,
        @fundingSource,
        @dnacpr,
        @dolsStatus,
        @allergies,
        @bloodType,
        @medicalHistory,
        @admissionDate,
        @nationalInsurance,
        @preferredDrink,
        @prnMeds,
        @activeStatus,
        @dischargeDate,
        SYSUTCDATETIME(),
        SYSUTCDATETIME()
      );
      SELECT CAST(SCOPE_IDENTITY() AS INT) AS clientId;
    `, { companyId }))
  ).recordset;

  const clientId = insertedRows[0]?.clientId;
  if (!clientId) {
    throw Object.assign(new Error('Unable to create service user'), { code: 'VALIDATION_ERROR' });
  }

  const hasKeyWorker = await hasClientKeyWorkerColumn();
  const keyWorkerSelect = hasKeyWorker
    ? `c.KeyWorkerName AS keyWorkerName,`
    : `CAST(NULL AS NVARCHAR(200)) AS keyWorkerName,`;
  const createdRows = (
    await scopedRequest(pool, { companyId })
      .input('companyId', mssql.Int, companyId)
      .input('clientId', mssql.Int, clientId)
      .query<ServiceUserApiRow>(withDbScope(`
        SELECT
          c.ClientID AS clientId,
          c.FirstName AS firstName,
          c.LastName AS lastName,
          c.DateOfBirth AS dateOfBirth,
          c.Gender AS gender,
          c.Email AS email,
          c.Phone AS phone,
          c.MobilePhone AS mobilePhone,
          c.NHS_Number AS nhsNumber,
          c.GP_Details AS gpDetails,
          c.FundingSource AS fundingSource,
          c.PreferredName AS preferredName,
          c.MaritalStatus AS maritalStatus,
          c.Birthplace AS birthplace,
          c.Nationality AS nationality,
          c.LanguagesSpoken AS languagesSpoken,
          c.Ethnicity AS ethnicity,
          c.Religion AS religion,
          c.CarerGenderPreference AS carerGenderPreference,
          c.CarerNote AS carerNote,
          c.EmergencyContactName AS emergencyContactName,
          c.EmergencyContactPhone AS emergencyContactPhone,
          c.EmergencyContactRelation AS emergencyContactRelation,
          c.PreferredContactMethod AS preferredContactMethod,
          c.DNACPR AS dnacpr,
          c.DoLSStatus AS dolsStatus,
          c.Allergies AS allergies,
          c.BloodType AS bloodType,
          c.MedicalHistory AS medicalHistory,
          c.AdmissionDate AS admissionDate,
          c.NationalInsurance AS nationalInsurance,
          c.PreferredDrink AS preferredDrink,
          c.PrnMeds AS prnMeds,
          ${keyWorkerSelect}
          c.ClientType AS clientType,
          c.RiskLevel AS riskLevel,
          c.ActiveStatus AS activeStatus,
          c.DischargeDate AS dischargeDate,
          c.ModifiedDate AS modifiedDate,
          c.Address AS address
        FROM People.Clients c
        WHERE c.CompanyID = @companyId
          AND c.ClientID = @clientId
      `, { companyId }))
  ).recordset;

  if (!createdRows[0]) {
    throw Object.assign(new Error('Created service user could not be loaded'), { code: 'VALIDATION_ERROR' });
  }
  return mapServiceUserRow(createdRows[0]);
}

async function loadCompanyServiceUserById(companyId: number, clientId: number) {
  await ensureClientCareColumns();
  const pool = await getAzureSqlPool();
  const hasKeyWorker = await hasClientKeyWorkerColumn();
  const keyWorkerSelect = hasKeyWorker
    ? `c.KeyWorkerName AS keyWorkerName,`
    : `CAST(NULL AS NVARCHAR(200)) AS keyWorkerName,`;
  const rows = (
    await scopedRequest(pool, { companyId })
      .input('companyId', mssql.Int, companyId)
      .input('clientId', mssql.Int, clientId)
      .query<ServiceUserApiRow>(withDbScope(`
        SELECT
          c.ClientID AS clientId,
          c.FirstName AS firstName,
          c.LastName AS lastName,
          c.DateOfBirth AS dateOfBirth,
          c.Gender AS gender,
          c.Email AS email,
          c.Phone AS phone,
          c.MobilePhone AS mobilePhone,
          c.NHS_Number AS nhsNumber,
          c.GP_Details AS gpDetails,
          c.FundingSource AS fundingSource,
          c.PreferredName AS preferredName,
          c.MaritalStatus AS maritalStatus,
          c.Birthplace AS birthplace,
          c.Nationality AS nationality,
          c.LanguagesSpoken AS languagesSpoken,
          c.Ethnicity AS ethnicity,
          c.Religion AS religion,
          c.CarerGenderPreference AS carerGenderPreference,
          c.CarerNote AS carerNote,
          c.EmergencyContactName AS emergencyContactName,
          c.EmergencyContactPhone AS emergencyContactPhone,
          c.EmergencyContactRelation AS emergencyContactRelation,
          c.PreferredContactMethod AS preferredContactMethod,
          c.DNACPR AS dnacpr,
          c.DoLSStatus AS dolsStatus,
          c.Allergies AS allergies,
          c.BloodType AS bloodType,
          c.MedicalHistory AS medicalHistory,
          c.AdmissionDate AS admissionDate,
          c.NationalInsurance AS nationalInsurance,
          c.PreferredDrink AS preferredDrink,
          c.PrnMeds AS prnMeds,
          ${keyWorkerSelect}
          c.ClientType AS clientType,
          c.RiskLevel AS riskLevel,
          c.ActiveStatus AS activeStatus,
          c.DischargeDate AS dischargeDate,
          c.ModifiedDate AS modifiedDate,
          c.Address AS address
        FROM People.Clients c
        WHERE c.CompanyID = @companyId
          AND c.ClientID = @clientId
      `, { companyId }))
  ).recordset;

  return rows[0] ? mapServiceUserRow(rows[0]) : null;
}

async function updateCompanyServiceUser(companyId: number, clientId: number, payload: UpdateServiceUserInput) {
  await ensureClientCareColumns();
  const existing = await loadCompanyServiceUserById(companyId, clientId);
  if (!existing) {
    throw Object.assign(new Error('Service user not found'), { code: 'P2025' });
  }

  const nextFirstName = payload.firstName ?? existing.firstName ?? '';
  const nextLastName = payload.lastName ?? existing.lastName ?? '';
  if (!nextFirstName || !nextLastName) {
    throw Object.assign(new Error('First name and last name are required'), { code: 'VALIDATION_ERROR' });
  }

  const hasKeyWorker = await hasClientKeyWorkerColumn();
  const nextClientType = payload.clientType ?? existing.zone ?? 'Community';
  const nextActiveStatus = payload.activeStatus ?? existing.activeStatus ?? true;
  const nextDischargeDate =
    payload.dischargeDate !== undefined
      ? payload.dischargeDate || null
      : nextActiveStatus
        ? null
        : existing.dischargeDate || new Date().toISOString().slice(0, 10);

  const pool = await getAzureSqlPool();
  const request = scopedRequest(pool, { companyId })
    .input('companyId', mssql.Int, companyId)
    .input('clientId', mssql.Int, clientId)
    .input('clientType', mssql.NVarChar(50), nextClientType)
    .input('activeStatus', mssql.Bit, nextActiveStatus ? 1 : 0)
    .input('dischargeDate', mssql.Date, nextDischargeDate)
    .input('firstName', mssql.NVarChar(100), nextFirstName)
    .input('lastName', mssql.NVarChar(100), nextLastName)
    .input('dateOfBirth', mssql.Date, payload.dateOfBirth || existing.dateOfBirth || null)
    .input('gender', mssql.NVarChar(20), payload.gender ?? existing.gender ?? '')
    .input('email', mssql.NVarChar(100), payload.email ?? existing.email ?? '')
    .input('phone', mssql.NVarChar(20), payload.phone ?? existing.phone ?? '')
    .input('mobilePhone', mssql.NVarChar(20), payload.mobilePhone ?? existing.mobilePhone ?? '')
    .input('address', mssql.NVarChar(500), payload.address ?? existing.address ?? '')
    .input('nhsNumber', mssql.NVarChar(20), payload.nhsNumber ?? existing.nhsNumber ?? '')
    .input('gpDetails', mssql.NVarChar(500), payload.gpDetails ?? existing.gpDetails ?? '')
    .input('riskLevel', mssql.NVarChar(50), payload.riskLevel ?? existing.riskLevel ?? 'Low')
    .input('fundingSource', mssql.NVarChar(100), payload.fundingSource ?? existing.fundingSource ?? '')
    .input('dnacpr', mssql.NVarChar(50), payload.dnacpr ?? existing.dnacpr ?? '')
    .input('dolsStatus', mssql.NVarChar(100), payload.dolsStatus ?? existing.dolsStatus ?? '')
    .input('allergies', mssql.NVarChar(1000), payload.allergies ?? existing.allergies ?? '')
    .input('bloodType', mssql.NVarChar(10), payload.bloodType ?? existing.bloodType ?? '')
    .input('medicalHistory', mssql.NVarChar(2000), payload.medicalHistory ?? existing.medicalHistory ?? '')
    .input('admissionDate', mssql.Date, payload.admissionDate ?? existing.admissionDate ?? null)
    .input('nationalInsurance', mssql.NVarChar(20), payload.nationalInsurance ?? existing.nationalInsurance ?? '')
    .input('preferredDrink', mssql.NVarChar(100), payload.preferredDrink ?? existing.preferredDrink ?? '')
    .input('prnMeds', mssql.NVarChar(500), payload.prnMeds ?? existing.prnMeds ?? '')
    .input('preferredName', mssql.NVarChar(100), payload.preferredName ?? existing.preferredName ?? '')
    .input('maritalStatus', mssql.NVarChar(50), payload.maritalStatus ?? existing.maritalStatus ?? '')
    .input('birthplace', mssql.NVarChar(100), payload.birthplace ?? existing.birthplace ?? '')
    .input('nationality', mssql.NVarChar(100), payload.nationality ?? existing.nationality ?? '')
    .input('languagesSpoken', mssql.NVarChar(500), payload.languagesSpoken ?? existing.languagesSpoken ?? '')
    .input('ethnicity', mssql.NVarChar(100), payload.ethnicity ?? existing.ethnicity ?? '')
    .input('religion', mssql.NVarChar(100), payload.religion ?? existing.religion ?? '')
    .input(
      'carerGenderPreference',
      mssql.NVarChar(30),
      payload.carerGenderPreference ?? existing.carerGenderPreference ?? ''
    )
    .input('carerNote', mssql.NVarChar(1000), payload.carerNote ?? existing.carerNote ?? '')
    .input('emergencyContactName', mssql.NVarChar(200), payload.emergencyContactName ?? existing.emergencyContactName ?? '')
    .input('emergencyContactPhone', mssql.NVarChar(30), payload.emergencyContactPhone ?? existing.emergencyContactPhone ?? '')
    .input(
      'emergencyContactRelation',
      mssql.NVarChar(100),
      payload.emergencyContactRelation ?? existing.emergencyContactRelation ?? ''
    )
    .input(
      'preferredContactMethod',
      mssql.NVarChar(30),
      payload.preferredContactMethod ?? existing.preferredContactMethod ?? ''
    );

  const keyWorkerUpdate = hasKeyWorker ? 'KeyWorkerName = @keyWorkerName,' : '';
  if (hasKeyWorker) {
    request.input('keyWorkerName', mssql.NVarChar(200), payload.keyWorker ?? existing.keyWorker ?? '');
  }

  await request.query(withDbScope(`
      UPDATE People.Clients
      SET
        ClientType = @clientType,
        ActiveStatus = @activeStatus,
        DischargeDate = @dischargeDate,
        FirstName = @firstName,
        LastName = @lastName,
        DateOfBirth = @dateOfBirth,
        Gender = @gender,
        Email = @email,
        Phone = @phone,
        MobilePhone = @mobilePhone,
        Address = @address,
        NHS_Number = @nhsNumber,
        GP_Details = @gpDetails,
        RiskLevel = @riskLevel,
        FundingSource = @fundingSource,
        DNACPR = @dnacpr,
        DoLSStatus = @dolsStatus,
        Allergies = @allergies,
        BloodType = @bloodType,
        MedicalHistory = @medicalHistory,
        AdmissionDate = @admissionDate,
        NationalInsurance = @nationalInsurance,
        PreferredDrink = @preferredDrink,
        PrnMeds = @prnMeds,
        PreferredName = @preferredName,
        MaritalStatus = @maritalStatus,
        Birthplace = @birthplace,
        Nationality = @nationality,
        LanguagesSpoken = @languagesSpoken,
        Ethnicity = @ethnicity,
        Religion = @religion,
        CarerGenderPreference = @carerGenderPreference,
        CarerNote = @carerNote,
        EmergencyContactName = @emergencyContactName,
        EmergencyContactPhone = @emergencyContactPhone,
        EmergencyContactRelation = @emergencyContactRelation,
        PreferredContactMethod = @preferredContactMethod,
        ${keyWorkerUpdate}
        ModifiedDate = SYSUTCDATETIME()
      WHERE CompanyID = @companyId
        AND ClientID = @clientId
    `, { companyId }));

  const updated = await loadCompanyServiceUserById(companyId, clientId);
  if (!updated) {
    throw Object.assign(new Error('Unable to load updated service user'), { code: 'VALIDATION_ERROR' });
  }
  return updated;
}

function validateAvatarSize(avatarUrl: string | undefined): void {
  if (!avatarUrl) return;
  // Guard against multi-megabyte data URLs that slow API responses/UI hydration.
  if (avatarUrl.length > 300_000) {
    throw Object.assign(new Error('Avatar image is too large. Please use a smaller image.'), { code: 'VALIDATION_ERROR' });
  }
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return { firstName: 'Team', lastName: 'Member' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function normalizeStatus(status: string): { accountStatus: string; isActive: number } {
  const accountStatus = status.toLowerCase() === 'inactive' ? 'Inactive' : 'Active';
  return { accountStatus, isActive: accountStatus === 'Active' ? 1 : 0 };
}

async function loadCompanyUsers(companyId: number, userId?: number): Promise<CompanyUserRow[]> {
  const pool = await getAzureSqlPool();
  const includeAvatar = await hasStaffAvatarColumn();
  const avatarSelect = includeAvatar
    ? `ISNULL(NULLIF(s.AvatarUrl, N''), N'') AS avatarUrl,`
    : `CAST(NULL AS NVARCHAR(MAX)) AS avatarUrl,`;
  const request = scopedRequest(pool, { companyId }).input('companyId', mssql.Int, companyId);
  const userFilter = typeof userId === 'number' ? 'AND ua.UserID = @userId' : '';
  if (typeof userId === 'number') {
    request.input('userId', mssql.Int, userId);
  }

  const users = (
    await request.query<CompanyUserRow>(withDbScope(`
      SELECT
        CAST(ua.UserID AS NVARCHAR(50)) AS id,
        LTRIM(RTRIM(CONCAT(ISNULL(s.FirstName, N''), N' ', ISNULL(s.LastName, N'')))) AS name,
        ${avatarSelect}
        ISNULL(rolePick.RoleName, N'Carer') AS role,
        CASE
          WHEN ISNULL(ua.AccountStatus, N'Active') = N'Active' AND ISNULL(s.ActiveStatus, 1) = 1
            THEN N'active'
          ELSE N'inactive'
        END AS status,
        ISNULL(NULLIF(managerPick.ManagerName, N''), N'Unassigned') AS lineManager,
        ISNULL(NULLIF(s.Email, N''), ua.Username) AS email,
        ISNULL(NULLIF(s.MobilePhone, N''), ISNULL(NULLIF(s.Phone, N''), N'')) AS phone,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM Auth.UserRoleAssignment ura2
            INNER JOIN Auth.UserRole ur2
              ON ur2.RoleID = ura2.RoleID
             AND ur2.CompanyID = ura2.CompanyID
            WHERE ura2.UserID = ua.UserID
              AND ura2.CompanyID = ua.CompanyID
              AND ISNULL(ur2.IsActive, 1) = 1
              AND ur2.RoleName IN (N'Line Manager', N'Manager')
          ) THEN 1
          ELSE 0
        END AS isLineManager
      FROM Auth.UserAccount ua
      LEFT JOIN People.Staff s ON s.StaffID = ua.StaffID
      OUTER APPLY (
        SELECT TOP 1 ur.RoleName
        FROM Auth.UserRoleAssignment ura
        INNER JOIN Auth.UserRole ur
          ON ur.RoleID = ura.RoleID
         AND ur.CompanyID = ura.CompanyID
        WHERE ura.UserID = ua.UserID
          AND ura.CompanyID = ua.CompanyID
          AND (ura.ExpiryDate IS NULL OR ura.ExpiryDate >= CAST(SYSUTCDATETIME() AS date))
          AND ISNULL(ur.IsActive, 1) = 1
        ORDER BY ura.AssignedDate DESC, ura.AssignmentID DESC
      ) rolePick
      OUTER APPLY (
        SELECT TOP 1 LTRIM(RTRIM(CONCAT(ISNULL(ms.FirstName, N''), N' ', ISNULL(ms.LastName, N'')))) AS ManagerName
        FROM Auth.UserRoleAssignment mura
        INNER JOIN Auth.UserRole mur
          ON mur.RoleID = mura.RoleID
         AND mur.CompanyID = mura.CompanyID
        INNER JOIN Auth.UserAccount mua
          ON mua.UserID = mura.UserID
         AND mua.CompanyID = mura.CompanyID
        LEFT JOIN People.Staff ms ON ms.StaffID = mua.StaffID
        WHERE mura.CompanyID = ua.CompanyID
          AND ISNULL(mur.IsActive, 1) = 1
          AND mur.RoleName IN (N'Line Manager', N'Manager')
        ORDER BY mura.AssignedDate DESC, mura.AssignmentID DESC
      ) managerPick
      WHERE ua.CompanyID = @companyId
      ${userFilter}
      ORDER BY name ASC
    `, { companyId }))
  ).recordset.map((row) => ({
    ...row,
    name: row.name || row.email || `User ${row.id}`
  }));

  return users;
}

async function resolveRoleId(tx: mssql.Transaction, companyId: number, roleName: string): Promise<number | null> {
  const roleRows = (
    await new mssql.Request(tx)
      .input('companyId', mssql.Int, companyId)
      .input('roleName', mssql.NVarChar(128), roleName)
      .query<{ roleId: number }>(`
        SELECT TOP 1 ur.RoleID AS roleId
        FROM Auth.UserRole ur
        WHERE ur.CompanyID = @companyId
          AND ur.RoleName = @roleName
          AND ISNULL(ur.IsActive, 1) = 1
      `)
  ).recordset;

  return roleRows[0]?.roleId ?? null;
}

async function createCompanyUser(session: AuthSession, payload: CompanyUserInput): Promise<CompanyUserRow> {
  const email = payload.email.toLowerCase();
  if (!email) {
    throw Object.assign(new Error('Email is required'), { code: 'VALIDATION_ERROR' });
  }
  if (!payload.role) {
    throw Object.assign(new Error('Role is required'), { code: 'VALIDATION_ERROR' });
  }
  validateAvatarSize(payload.avatarUrl);

  const pool = await getAzureSqlPool();
  const tx = new mssql.Transaction(pool);
  await tx.begin();
  await setTransactionCompanyScope(tx, session.companyId);

  try {
    const duplicateRows = (
      await new mssql.Request(tx)
        .input('companyId', mssql.Int, session.companyId)
        .input('username', mssql.NVarChar(320), email)
        .query<{ userId: number }>(`
          SELECT TOP 1 ua.UserID AS userId
          FROM Auth.UserAccount ua
          WHERE ua.CompanyID = @companyId
            AND LOWER(ua.Username) = LOWER(@username)
        `)
    ).recordset;

    if (duplicateRows.length > 0) {
      throw Object.assign(new Error('A user with this email already exists'), { code: 'VALIDATION_ERROR' });
    }

    const { firstName, lastName } = splitName(payload.name || email);
    const { accountStatus, isActive } = normalizeStatus(payload.status);
    const roleNames = uniqueSorted([payload.role, ...(payload.isLineManager ? ['Line Manager'] : [])]);
    const includeAvatar = await hasStaffAvatarColumn();

    const staffRequest = new mssql.Request(tx)
      .input('companyId', mssql.Int, session.companyId)
      .input('firstName', mssql.NVarChar(128), firstName)
      .input('lastName', mssql.NVarChar(128), lastName)
      .input('email', mssql.NVarChar(320), email)
      .input('phone', mssql.NVarChar(64), payload.phone)
      .input('isActive', mssql.Bit, isActive);
    if (includeAvatar) {
      staffRequest.input('avatarUrl', mssql.NVarChar(mssql.MAX), payload.avatarUrl || '');
    }

    const staffRows = (
      await staffRequest.query<{ staffId: number }>(`
          INSERT INTO People.Staff (${includeAvatar ? 'CompanyID, FirstName, LastName, Email, MobilePhone, Phone, ActiveStatus, AvatarUrl' : 'CompanyID, FirstName, LastName, Email, MobilePhone, Phone, ActiveStatus'})
          VALUES (${includeAvatar ? '@companyId, @firstName, @lastName, @email, @phone, @phone, @isActive, @avatarUrl' : '@companyId, @firstName, @lastName, @email, @phone, @phone, @isActive'});
          SELECT CAST(SCOPE_IDENTITY() AS INT) AS staffId;
        `)
    ).recordset;

    const staffId = staffRows[0]?.staffId;
    if (!staffId) {
      throw Object.assign(new Error('Failed to create staff record'), { code: 'VALIDATION_ERROR' });
    }

    const userRows = (
      await new mssql.Request(tx)
        .input('companyId', mssql.Int, session.companyId)
        .input('staffId', mssql.Int, staffId)
        .input('username', mssql.NVarChar(320), email)
        .input('accountStatus', mssql.NVarChar(64), accountStatus)
        .query<{ userId: number }>(`
          INSERT INTO Auth.UserAccount (CompanyID, StaffID, Username, AccountStatus, AuthProvider, EntraObjectID, LastModifiedDate)
          VALUES (@companyId, @staffId, @username, @accountStatus, N'Microsoft', NULL, SYSUTCDATETIME());
          SELECT CAST(SCOPE_IDENTITY() AS INT) AS userId;
        `)
    ).recordset;

    const userId = userRows[0]?.userId;
    if (!userId) {
      throw Object.assign(new Error('Failed to create user account record'), { code: 'VALIDATION_ERROR' });
    }

    for (const roleName of roleNames) {
      const roleId = await resolveRoleId(tx, session.companyId, roleName);
      if (!roleId) continue;
      await new mssql.Request(tx)
        .input('userId', mssql.Int, userId)
        .input('companyId', mssql.Int, session.companyId)
        .input('roleId', mssql.Int, roleId)
        .query(`
          INSERT INTO Auth.UserRoleAssignment (UserID, CompanyID, RoleID, AssignedDate, ExpiryDate)
          VALUES (@userId, @companyId, @roleId, CAST(SYSUTCDATETIME() AS date), NULL);
        `);
    }

    await tx.commit();
    const created = await loadCompanyUsers(session.companyId, userId);
    if (!created[0]) {
      throw Object.assign(new Error('Created user could not be loaded'), { code: 'VALIDATION_ERROR' });
    }
    return created[0];
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

async function updateCompanyUser(session: AuthSession, userId: number, payload: CompanyUserInput): Promise<CompanyUserRow> {
  const email = payload.email.toLowerCase();
  if (!email) {
    throw Object.assign(new Error('Email is required'), { code: 'VALIDATION_ERROR' });
  }
  if (!payload.role) {
    throw Object.assign(new Error('Role is required'), { code: 'VALIDATION_ERROR' });
  }
  validateAvatarSize(payload.avatarUrl);

  const pool = await getAzureSqlPool();
  const tx = new mssql.Transaction(pool);
  await tx.begin();
  await setTransactionCompanyScope(tx, session.companyId);

  try {
    const existingRows = (
      await new mssql.Request(tx)
        .input('companyId', mssql.Int, session.companyId)
        .input('userId', mssql.Int, userId)
        .query<{ staffId: number | null }>(`
          SELECT TOP 1 ua.StaffID AS staffId
          FROM Auth.UserAccount ua
          WHERE ua.CompanyID = @companyId
            AND ua.UserID = @userId
        `)
    ).recordset;

    if (existingRows.length === 0) {
      throw Object.assign(new Error('User not found'), { code: 'P2025' });
    }

    const staffId = existingRows[0].staffId;
    const { firstName, lastName } = splitName(payload.name || email);
    const { accountStatus, isActive } = normalizeStatus(payload.status);
    const includeAvatar = await hasStaffAvatarColumn();

    if (staffId) {
      const staffRequest = new mssql.Request(tx)
        .input('staffId', mssql.Int, staffId)
        .input('firstName', mssql.NVarChar(128), firstName)
        .input('lastName', mssql.NVarChar(128), lastName)
        .input('email', mssql.NVarChar(320), email)
        .input('phone', mssql.NVarChar(64), payload.phone)
        .input('isActive', mssql.Bit, isActive);
    if (includeAvatar) {
        staffRequest.input('avatarUrl', mssql.NVarChar(mssql.MAX), payload.avatarUrl || '');
      }

      await staffRequest.query(`
          UPDATE People.Staff
          SET FirstName = @firstName,
              LastName = @lastName,
              Email = @email,
              MobilePhone = @phone,
              Phone = @phone,
              ActiveStatus = @isActive
              ${includeAvatar ? ', AvatarUrl = @avatarUrl' : ''}
          WHERE StaffID = @staffId
        `);
    }

    await new mssql.Request(tx)
      .input('companyId', mssql.Int, session.companyId)
      .input('userId', mssql.Int, userId)
      .input('username', mssql.NVarChar(320), email)
      .input('accountStatus', mssql.NVarChar(64), accountStatus)
      .query(`
        UPDATE Auth.UserAccount
        SET Username = @username,
            AccountStatus = @accountStatus,
            LastModifiedDate = SYSUTCDATETIME()
        WHERE CompanyID = @companyId
          AND UserID = @userId
      `);

    await new mssql.Request(tx)
      .input('companyId', mssql.Int, session.companyId)
      .input('userId', mssql.Int, userId)
      .query(`
        UPDATE ura
        SET ExpiryDate = CAST(SYSUTCDATETIME() AS date)
        FROM Auth.UserRoleAssignment ura
        WHERE ura.CompanyID = @companyId
          AND ura.UserID = @userId
          AND (ura.ExpiryDate IS NULL OR ura.ExpiryDate >= CAST(SYSUTCDATETIME() AS date))
      `);

    const roleNames = uniqueSorted([payload.role, ...(payload.isLineManager ? ['Line Manager'] : [])]);
    for (const roleName of roleNames) {
      const roleId = await resolveRoleId(tx, session.companyId, roleName);
      if (!roleId) continue;
      await new mssql.Request(tx)
        .input('companyId', mssql.Int, session.companyId)
        .input('userId', mssql.Int, userId)
        .input('roleId', mssql.Int, roleId)
        .query(`
          INSERT INTO Auth.UserRoleAssignment (UserID, CompanyID, RoleID, AssignedDate, ExpiryDate)
          VALUES (@userId, @companyId, @roleId, CAST(SYSUTCDATETIME() AS date), NULL);
        `);
    }

    await tx.commit();
    const updated = await loadCompanyUsers(session.companyId, userId);
    if (!updated[0]) {
      throw Object.assign(new Error('Updated user could not be loaded'), { code: 'P2025' });
    }
    return updated[0];
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

type InviteConfig = {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  redirectUrl: string;
};

function getInviteConfig(): InviteConfig {
  const tenantId = readString(process.env.AZURE_INVITE_TENANT_ID || process.env.VITE_AZURE_TENANT_ID);
  const clientId = readString(process.env.AZURE_INVITE_CLIENT_ID);
  const clientSecret = readString(process.env.AZURE_INVITE_CLIENT_SECRET);
  const redirectUrl = readString(process.env.AZURE_INVITE_REDIRECT_URL || process.env.VITE_AZURE_REDIRECT_URI);

  if (!tenantId || !clientId || !clientSecret || !redirectUrl) {
    throw Object.assign(
      new Error(
        'Invite service is not configured. Set AZURE_INVITE_TENANT_ID, AZURE_INVITE_CLIENT_ID, AZURE_INVITE_CLIENT_SECRET, AZURE_INVITE_REDIRECT_URL.'
      ),
      { code: 'INVITE_CONFIG_MISSING' }
    );
  }

  return { tenantId, clientId, clientSecret, redirectUrl };
}

async function getGraphAccessToken(config: InviteConfig): Promise<string> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: 'client_credentials',
    scope: 'https://graph.microsoft.com/.default'
  });

  const response = await fetch(`https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  const payload = (await response.json()) as { access_token?: string; error_description?: string };
  if (!response.ok || !payload.access_token) {
    throw Object.assign(
      new Error(payload.error_description || 'Unable to acquire Microsoft Graph access token'),
      { code: 'INVITE_FAILED' }
    );
  }

  return payload.access_token;
}

async function sendCompanyUserInvite(email: string, displayName: string): Promise<{ inviteRedeemUrl?: string }> {
  const config = getInviteConfig();
  const accessToken = await getGraphAccessToken(config);

  const response = await fetch('https://graph.microsoft.com/v1.0/invitations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      invitedUserEmailAddress: email,
      invitedUserDisplayName: displayName || email,
      inviteRedirectUrl: config.redirectUrl,
      sendInvitationMessage: true
    })
  });

  const payload = (await response.json()) as { inviteRedeemUrl?: string; error?: { message?: string } };
  if (!response.ok) {
    throw Object.assign(new Error(payload.error?.message || 'Unable to send Microsoft invitation'), { code: 'INVITE_FAILED' });
  }

  return { inviteRedeemUrl: readString(payload.inviteRedeemUrl) || undefined };
}

async function exchangeMicrosoftToken(idToken: string): Promise<ExchangeResult> {
  const claims = await validateMicrosoftIdToken(idToken);
  const entraTenantId = readString(claims.tid);
  const entraObjectId = readString(claims.oid);
  const loginEmail = extractLoginEmail(claims);
  const pool = await getAzureSqlPool();

  type UserRow = {
    userId: number;
    companyId: number;
    staffId: number | null;
    username: string;
    accountStatus: string | null;
    firstName: string | null;
    lastName: string | null;
    staffEmail: string | null;
    companyName: string;
  };

  let matchedRows = (
    await scopedRequest(pool, { isSuperAdmin: true })
      .input('tenantId', mssql.NVarChar(128), entraTenantId)
      .input('objectId', mssql.NVarChar(128), entraObjectId)
      .query<UserRow>(withDbScope(`
        SELECT TOP 1
          ua.UserID AS userId,
          ua.CompanyID AS companyId,
          ua.StaffID AS staffId,
          ua.Username AS username,
          ua.AccountStatus AS accountStatus,
          s.FirstName AS firstName,
          s.LastName AS lastName,
          s.Email AS staffEmail,
          c.CompanyName AS companyName
        FROM Auth.UserAccount ua
        INNER JOIN People.Company c ON c.CompanyID = ua.CompanyID
        LEFT JOIN People.Staff s ON s.StaffID = ua.StaffID
        WHERE c.EntraTenantID = @tenantId
          AND ua.EntraObjectID = @objectId
          AND ISNULL(c.ActiveStatus, 1) = 1
          AND ISNULL(ua.AccountStatus, N'Active') = N'Active'
      `, { isSuperAdmin: true }))
  ).recordset;

  if (matchedRows.length === 0 && loginEmail) {
    matchedRows = (
      await scopedRequest(pool, { isSuperAdmin: true })
        .input('tenantId', mssql.NVarChar(128), entraTenantId)
        .input('email', mssql.NVarChar(320), loginEmail)
        .query<UserRow>(withDbScope(`
          SELECT TOP 1
            ua.UserID AS userId,
            ua.CompanyID AS companyId,
            ua.StaffID AS staffId,
            ua.Username AS username,
            ua.AccountStatus AS accountStatus,
            s.FirstName AS firstName,
            s.LastName AS lastName,
            s.Email AS staffEmail,
            c.CompanyName AS companyName
          FROM Auth.UserAccount ua
          INNER JOIN People.Company c ON c.CompanyID = ua.CompanyID
          LEFT JOIN People.Staff s ON s.StaffID = ua.StaffID
          WHERE c.EntraTenantID = @tenantId
            AND LOWER(ua.Username) = LOWER(@email)
            AND ISNULL(c.ActiveStatus, 1) = 1
            AND ISNULL(ua.AccountStatus, N'Active') = N'Active'
        `, { isSuperAdmin: true }))
    ).recordset;

    if (matchedRows.length > 0) {
      await scopedRequest(pool, { isSuperAdmin: true })
        .input('objectId', mssql.NVarChar(128), entraObjectId)
        .input('userId', mssql.Int, matchedRows[0].userId)
        .query(withDbScope(`
          UPDATE Auth.UserAccount
          SET EntraObjectID = @objectId,
              AuthProvider = N'Microsoft',
              LastModifiedDate = SYSUTCDATETIME()
          WHERE UserID = @userId
            AND (EntraObjectID IS NULL OR EntraObjectID = N'')
        `, { isSuperAdmin: true }));
    }
  }

  if (matchedRows.length === 0) {
    throw Object.assign(new Error('No matching user account for this tenant'), { code: 'AUTH_NOT_MAPPED' });
  }

  const user = matchedRows[0];
  const rolesRows = (
    await scopedRequest(pool, { companyId: user.companyId })
      .input('userId', mssql.Int, user.userId)
      .input('companyId', mssql.Int, user.companyId)
      .query<{ roleName: string }>(withDbScope(`
        SELECT ur.RoleName AS roleName
        FROM Auth.UserRoleAssignment ura
        INNER JOIN Auth.UserRole ur
          ON ur.RoleID = ura.RoleID
         AND ur.CompanyID = ura.CompanyID
        WHERE ura.UserID = @userId
          AND ura.CompanyID = @companyId
          AND (ura.ExpiryDate IS NULL OR ura.ExpiryDate >= CAST(SYSUTCDATETIME() AS date))
          AND ISNULL(ur.IsActive, 1) = 1
      `, { companyId: user.companyId }))
  ).recordset;

  const roles = uniqueSorted(rolesRows.map((role) => readString(role.roleName)));
  const displayNameFromStaff = [readString(user.firstName), readString(user.lastName)].filter(Boolean).join(' ').trim();
  const displayName = displayNameFromStaff || readString(claims.name) || user.username;
  const sessionToken = randomUUID();
  const expiresAt = Date.now() + AUTH_SESSION_TTL_MS;

  authSessions.set(sessionToken, {
    token: sessionToken,
    expiresAt,
    userId: user.userId,
    companyId: user.companyId,
    roles,
    username: user.username,
    displayName,
    companyName: user.companyName,
    staffId: user.staffId,
    staffEmail: user.staffEmail
  });

  return {
    sessionToken,
    expiresAt: new Date(expiresAt).toISOString(),
    user: {
      userId: user.userId,
      companyId: user.companyId,
      staffId: user.staffId,
      username: user.username,
      displayName,
      companyName: user.companyName,
      staffEmail: user.staffEmail
    },
    roles
  };
}

export function dbApiMiddleware(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    const pathname = getPathname(req);

    if (!pathname || (!pathname.startsWith('/api/db') && !pathname.startsWith('/api/auth'))) {
      next();
      return;
    }

    const method = req.method ?? 'GET';

    try {
      if (method === 'GET') {
        if (pathname === '/api/db/health') {
          await pingDatabase();
          writeJson(res, 200, { ok: true });
          return;
        }

        if (pathname === '/api/db/users') {
          const users = await getUsers();
          writeJson(res, 200, { data: users });
          return;
        }

        if (pathname === '/api/db/company-users') {
          const session = getActiveSession(req);
          if (!session) {
            writeJson(res, 401, { error: 'Unauthorized' });
            return;
          }
          const users = await loadCompanyUsers(session.companyId);

          writeJson(res, 200, { data: users });
          return;
        }

        if (pathname === '/api/db/roles') {
          const roles = await getRoles();
          writeJson(res, 200, { data: roles.map((role) => role.name) });
          return;
        }

        if (pathname === '/api/db/line-managers') {
          const users = await getUsers();
          const lineManagers = uniqueSorted([
            ...users.map((user) => user.lineManager),
            ...users.filter((user) => Boolean(user.isLineManager)).map((user) => user.name)
          ]);
          writeJson(res, 200, { data: lineManagers });
          return;
        }

        if (pathname === '/api/db/service-users') {
          const session = getActiveSession(req);
          const serviceUsers = session ? await loadCompanyServiceUsers(session.companyId) : await getServiceUsers();
          writeJson(res, 200, { data: serviceUsers });
          return;
        }

        if (pathname === '/api/db/rota-shifts') {
          const shifts = await getRotaShifts();
          writeJson(res, 200, {
            data: shifts.map((shift) => ({
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
            }))
          });
          return;
        }

        if (pathname === '/api/auth/me') {
          const session = getActiveSession(req);
          if (!session) {
            writeJson(res, 401, { error: 'Session expired' });
            return;
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
          return;
        }

        if (pathname === '/api/auth/devices/pending') {
          const session = getActiveSession(req);
          if (!session) {
            writeJson(res, 401, { error: 'Session expired' });
            return;
          }
          if (!isAdminRole(session.roles)) {
            writeJson(res, 403, { error: 'Admin role required' });
            return;
          }

          const pendingDevices = await listPendingDevices(session.companyId);
          writeJson(res, 200, { data: pendingDevices });
          return;
        }

        if (pathname === '/api/auth/debug-config') {
          const hasAzureClientId = Boolean(process.env.AZURE_CLIENT_ID || process.env.VITE_AZURE_CLIENT_ID);
          const hasAzureSqlConnectionString = Boolean(
            process.env.AZURE_SQL_CONNECTION_STRING || process.env.SQLSERVER_CONNECTION_STRING
          );
          writeJson(res, 200, {
            data: {
              hasAzureClientId,
              hasViteAzureClientId: Boolean(process.env.VITE_AZURE_CLIENT_ID),
              hasAzureClientIdServerVar: Boolean(process.env.AZURE_CLIENT_ID),
              hasAzureSqlConnectionString
            }
          });
          return;
        }
      }

      if (method === 'POST') {
        const companyInviteUserId = getCompanyUserInviteIdFromPath(pathname);
        if (companyInviteUserId) {
          const session = getActiveSession(req);
          if (!session) {
            writeJson(res, 401, { error: 'Unauthorized' });
            return;
          }

          const parsedUserId = Number.parseInt(companyInviteUserId, 10);
          if (!Number.isFinite(parsedUserId)) {
            throw Object.assign(new Error('Invalid user id'), { code: 'VALIDATION_ERROR' });
          }

          const users = await loadCompanyUsers(session.companyId, parsedUserId);
          const user = users[0];
          if (!user) {
            throw Object.assign(new Error('User not found'), { code: 'P2025' });
          }
          if (!user.email) {
            throw Object.assign(new Error('User does not have an email address'), { code: 'VALIDATION_ERROR' });
          }

          const inviteResult = await sendCompanyUserInvite(user.email, user.name);
          writeJson(res, 200, {
            data: {
              email: user.email,
              inviteRedeemUrl: inviteResult.inviteRedeemUrl
            }
          });
          return;
        }

        if (pathname === '/api/auth/email/request-link') {
          const body = await readJsonBody(req);
          const email = readString(body.email);
          await requestMagicLink(email);
          writeJson(res, 200, { ok: true });
          return;
        }

        if (pathname === '/api/auth/email/verify') {
          const body = await readJsonBody(req);
          const token = readString(body.token);
          const result = await verifyMagicLink(token);
          writeJson(res, 200, { data: result });
          return;
        }

        if (pathname === '/api/auth/totp/setup') {
          const body = await readJsonBody(req);
          const challengeToken = readString(body.challengeToken);
          const result = await createTotpSetup(challengeToken);
          writeJson(res, 200, { data: result });
          return;
        }

        if (pathname === '/api/auth/totp/enable') {
          const body = await readJsonBody(req);
          const challengeToken = readString(body.challengeToken);
          const code = readString(body.code);
          await enableTotp(challengeToken, code);
          writeJson(res, 200, { ok: true });
          return;
        }

        if (pathname === '/api/auth/login/complete') {
          const body = await readJsonBody(req);
          const challengeToken = readString(body.challengeToken);
          const code = readString(body.code);
          const deviceFingerprint = readString(body.deviceFingerprint);
          const deviceLabel = readString(body.deviceLabel);
          const result = await completeMagicLogin({ challengeToken, code, deviceFingerprint, deviceLabel });
          if (result.pendingApproval) {
            writeJson(res, 202, { data: { pendingApproval: true } });
            return;
          }
          writeJson(res, 200, { data: result.session });
          return;
        }

        if (pathname === '/api/auth/microsoft/exchange') {
          writeJson(res, 410, { error: 'Microsoft sign-in has been disabled for this environment.' });
          return;
        }

        if (pathname === '/api/auth/logout') {
          const token = parseAuthHeader(req);
          if (token) {
            authSessions.delete(token);
          }
          writeJson(res, 200, { ok: true });
          return;
        }

        const pendingDeviceId = getPendingDeviceIdFromPath(pathname);
        const pendingDeviceAction = getPendingDeviceActionFromPath(pathname);
        if (pendingDeviceId && pendingDeviceAction) {
          const session = getActiveSession(req);
          if (!session) {
            writeJson(res, 401, { error: 'Session expired' });
            return;
          }
          if (!isAdminRole(session.roles)) {
            writeJson(res, 403, { error: 'Admin role required' });
            return;
          }

          await setDeviceStatus(
            session.companyId,
            pendingDeviceId,
            session.userId,
            pendingDeviceAction === 'approve' ? 'Approved' : 'Rejected'
          );
          writeJson(res, 200, { ok: true });
          return;
        }

        if (pathname === '/api/db/users') {
          const body = await readJsonBody(req);
          const user = await createUser(sanitizeCreateUserBody(body));
          writeJson(res, 201, { data: user });
          return;
        }

        if (pathname === '/api/db/service-users') {
          const session = getActiveSession(req);
          if (!session) {
            writeJson(res, 401, { error: 'Unauthorized' });
            return;
          }
          const body = await readJsonBody(req);
          const created = await createCompanyServiceUser(session.companyId, sanitizeCreateServiceUserBody(body));
          writeJson(res, 201, { data: created });
          return;
        }

        if (pathname === '/api/db/company-users') {
          const session = getActiveSession(req);
          if (!session) {
            writeJson(res, 401, { error: 'Unauthorized' });
            return;
          }

          const body = await readJsonBody(req);
          const user = await createCompanyUser(session, sanitizeCompanyUserBody(body));
          writeJson(res, 201, { data: user });
          return;
        }

        if (pathname === '/api/db/roles') {
          const body = await readJsonBody(req);

          if (Array.isArray(body.roles)) {
            const result = await syncRoles((body.roles as unknown[]).map((role) => readString(role)));
            writeJson(res, 200, { data: result.roles, skippedInUse: result.skippedInUse });
            return;
          }

          const role = await createRole(readString(body.name));
          writeJson(res, 201, { data: role.name });
          return;
        }
      }

      if (method === 'PUT') {
        const companyUserId = getCompanyUserIdFromPath(pathname);
        if (companyUserId) {
          const session = getActiveSession(req);
          if (!session) {
            writeJson(res, 401, { error: 'Unauthorized' });
            return;
          }

          const parsedUserId = Number.parseInt(companyUserId, 10);
          if (!Number.isFinite(parsedUserId)) {
            throw Object.assign(new Error('Invalid user id'), { code: 'VALIDATION_ERROR' });
          }

          const body = await readJsonBody(req);
          const user = await updateCompanyUser(session, parsedUserId, sanitizeCompanyUserBody(body));
          writeJson(res, 200, { data: user });
          return;
        }

        const serviceUserId = getServiceUserIdFromPath(pathname);
        if (serviceUserId) {
          const session = getActiveSession(req);
          if (!session) {
            writeJson(res, 401, { error: 'Unauthorized' });
            return;
          }

          const parsedServiceUserId = Number.parseInt(serviceUserId, 10);
          if (!Number.isFinite(parsedServiceUserId)) {
            throw Object.assign(new Error('Invalid service user id'), { code: 'VALIDATION_ERROR' });
          }

          const body = await readJsonBody(req);
          const user = await updateCompanyServiceUser(
            session.companyId,
            parsedServiceUserId,
            sanitizeUpdateServiceUserBody(body)
          );
          writeJson(res, 200, { data: user });
          return;
        }

        const userId = getUserIdFromPath(pathname);
        if (userId) {
          const body = await readJsonBody(req);
          const user = await updateUser(userId, sanitizeUpdateUserBody(body));
          writeJson(res, 200, { data: user });
          return;
        }

        const currentRoleName = getRoleNameFromPath(pathname);
        if (currentRoleName) {
          const body = await readJsonBody(req);
          const role = await updateRole(currentRoleName, readString(body.name));
          writeJson(res, 200, { data: role.name });
          return;
        }
      }

      if (method === 'DELETE') {
        const userId = getUserIdFromPath(pathname);
        if (userId) {
          await deleteUser(userId);
          writeJson(res, 200, { ok: true });
          return;
        }

        const roleName = getRoleNameFromPath(pathname);
        if (roleName) {
          await deleteRole(roleName);
          writeJson(res, 200, { ok: true });
          return;
        }
      }

      writeJson(res, 404, { error: 'Not found' });
    } catch (error) {
      const err = error as { code?: string; message?: string; count?: number };

      if (err.code === 'JSON_PARSE_ERROR' || err.code === 'VALIDATION_ERROR') {
        writeJson(res, 400, { error: err.message || 'Invalid request' });
        return;
      }

      if (err.code === 'ROLE_IN_USE') {
        writeJson(res, 409, { error: err.message || 'Role in use', count: err.count ?? 0 });
        return;
      }

      if (err.code === 'ROLE_NOT_FOUND' || err.code === 'P2025') {
        writeJson(res, 404, { error: err.message || 'Not found' });
        return;
      }

      if (err.code === 'ROLE_EXISTS' || err.code === 'P2002') {
        writeJson(res, 409, { error: err.message || 'Already exists' });
        return;
      }

      if (err.code === 'AUTH_INVALID_TOKEN' || err.code === 'AUTH_CONFIG_MISSING') {
        writeJson(res, 401, { error: err.message || 'Authentication failed' });
        return;
      }

      if (err.code === 'AUTH_MAGIC_INVALID') {
        writeJson(res, 401, { error: err.message || 'Magic link is invalid or expired' });
        return;
      }

      if (err.code === 'AUTH_MAGIC_SSO_REQUIRED') {
        writeJson(res, 403, { error: err.message || 'This account requires Microsoft sign-in' });
        return;
      }

      if (err.code === 'AUTH_MAGIC_RATE_LIMITED') {
        writeJson(res, 429, { error: err.message || 'Too many magic link requests' });
        return;
      }

      if (err.code === 'AUTH_NOT_MAPPED') {
        writeJson(res, 403, { error: err.message || 'User is not mapped to a company' });
        return;
      }

      if (err.code === 'AZURE_SQL_CONFIG_MISSING') {
        writeJson(res, 500, { error: err.message || 'Azure SQL auth config missing' });
        return;
      }

      if (err.code === 'INVITE_CONFIG_MISSING') {
        writeJson(res, 501, { error: err.message || 'Invite service not configured' });
        return;
      }

      if (err.code === 'INVITE_FAILED') {
        writeJson(res, 502, { error: err.message || 'Invite delivery failed' });
        return;
      }

      if (err.code === 'AUTH_MAGIC_CONFIG_MISSING') {
        writeJson(res, 500, { error: err.message || 'Magic link email not configured' });
        return;
      }

      if (err.code === 'AUTH_MAGIC_SEND_FAILED') {
        writeJson(res, 502, { error: err.message || 'Magic link email delivery failed' });
        return;
      }

      if (err.code === 'AZURE_SQL_UNAVAILABLE' || err.code === 'ETIMEOUT' || err.code === 'ESOCKET' || err.code === 'ELOGIN') {
        writeJson(res, 503, { error: 'Azure SQL unavailable' });
        return;
      }

      if (isPrismaUnavailable(err.code)) {
        writeJson(res, 503, { error: 'Database unavailable' });
        return;
      }

      writeJson(res, 500, { error: err.message || 'Request failed' });
    }
  };
}
