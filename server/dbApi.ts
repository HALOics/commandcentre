import type { IncomingMessage, ServerResponse } from 'node:http';
import { createPublicKey, randomUUID, verify } from 'node:crypto';
import mssql from 'mssql';
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
};

type CompanyUserInput = {
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  lineManager: string;
  isLineManager: boolean;
};

const authSessions = new Map<string, AuthSession>();
const AUTH_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
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

function sanitizeCompanyUserBody(body: Record<string, unknown>): CompanyUserInput {
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
  const request = pool.request().input('companyId', mssql.Int, companyId);
  const userFilter = typeof userId === 'number' ? 'AND ua.UserID = @userId' : '';
  if (typeof userId === 'number') {
    request.input('userId', mssql.Int, userId);
  }

  const users = (
    await request.query<CompanyUserRow>(`
      SELECT
        CAST(ua.UserID AS NVARCHAR(50)) AS id,
        LTRIM(RTRIM(CONCAT(ISNULL(s.FirstName, N''), N' ', ISNULL(s.LastName, N'')))) AS name,
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
    `)
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

  const pool = await getAzureSqlPool();
  const tx = new mssql.Transaction(pool);
  await tx.begin();

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

    const staffRows = (
      await new mssql.Request(tx)
        .input('firstName', mssql.NVarChar(128), firstName)
        .input('lastName', mssql.NVarChar(128), lastName)
        .input('email', mssql.NVarChar(320), email)
        .input('phone', mssql.NVarChar(64), payload.phone)
        .input('isActive', mssql.Bit, isActive)
        .query<{ staffId: number }>(`
          INSERT INTO People.Staff (FirstName, LastName, Email, MobilePhone, Phone, ActiveStatus)
          VALUES (@firstName, @lastName, @email, @phone, @phone, @isActive);
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

  const pool = await getAzureSqlPool();
  const tx = new mssql.Transaction(pool);
  await tx.begin();

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

    if (staffId) {
      await new mssql.Request(tx)
        .input('staffId', mssql.Int, staffId)
        .input('firstName', mssql.NVarChar(128), firstName)
        .input('lastName', mssql.NVarChar(128), lastName)
        .input('email', mssql.NVarChar(320), email)
        .input('phone', mssql.NVarChar(64), payload.phone)
        .input('isActive', mssql.Bit, isActive)
        .query(`
          UPDATE People.Staff
          SET FirstName = @firstName,
              LastName = @lastName,
              Email = @email,
              MobilePhone = @phone,
              Phone = @phone,
              ActiveStatus = @isActive
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
    await pool.request()
      .input('tenantId', mssql.NVarChar(128), entraTenantId)
      .input('objectId', mssql.NVarChar(128), entraObjectId)
      .query<UserRow>(`
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
      `)
  ).recordset;

  if (matchedRows.length === 0 && loginEmail) {
    matchedRows = (
      await pool.request()
        .input('tenantId', mssql.NVarChar(128), entraTenantId)
        .input('email', mssql.NVarChar(320), loginEmail)
        .query<UserRow>(`
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
        `)
    ).recordset;

    if (matchedRows.length > 0) {
      await pool.request()
        .input('objectId', mssql.NVarChar(128), entraObjectId)
        .input('userId', mssql.Int, matchedRows[0].userId)
        .query(`
          UPDATE Auth.UserAccount
          SET EntraObjectID = @objectId,
              AuthProvider = N'Microsoft',
              LastModifiedDate = SYSUTCDATETIME()
          WHERE UserID = @userId
            AND (EntraObjectID IS NULL OR EntraObjectID = N'')
        `);
    }
  }

  if (matchedRows.length === 0) {
    throw Object.assign(new Error('No matching user account for this tenant'), { code: 'AUTH_NOT_MAPPED' });
  }

  const user = matchedRows[0];
  const rolesRows = (
    await pool.request()
      .input('userId', mssql.Int, user.userId)
      .input('companyId', mssql.Int, user.companyId)
      .query<{ roleName: string }>(`
        SELECT ur.RoleName AS roleName
        FROM Auth.UserRoleAssignment ura
        INNER JOIN Auth.UserRole ur
          ON ur.RoleID = ura.RoleID
         AND ur.CompanyID = ura.CompanyID
        WHERE ura.UserID = @userId
          AND ura.CompanyID = @companyId
          AND (ura.ExpiryDate IS NULL OR ura.ExpiryDate >= CAST(SYSUTCDATETIME() AS date))
          AND ISNULL(ur.IsActive, 1) = 1
      `)
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
          const serviceUsers = await getServiceUsers();
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
        if (pathname === '/api/auth/microsoft/exchange') {
          const body = await readJsonBody(req);
          const idToken = readString(body.idToken);
          if (!idToken) {
            throw Object.assign(new Error('Missing idToken'), { code: 'VALIDATION_ERROR' });
          }

          const result = await exchangeMicrosoftToken(idToken);
          writeJson(res, 200, { data: result });
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

        if (pathname === '/api/db/users') {
          const body = await readJsonBody(req);
          const user = await createUser(sanitizeCreateUserBody(body));
          writeJson(res, 201, { data: user });
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

      if (err.code === 'AUTH_NOT_MAPPED') {
        writeJson(res, 403, { error: err.message || 'User is not mapped to a company' });
        return;
      }

      if (err.code === 'AZURE_SQL_CONFIG_MISSING') {
        writeJson(res, 500, { error: err.message || 'Azure SQL auth config missing' });
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
