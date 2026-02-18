import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Connect } from 'vite';
import { getRotaShifts, getServiceUsers, getUsers, pingDatabase } from '@halo/hub-db';

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

export function dbApiMiddleware(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    const pathname = getPathname(req);

    if (!pathname || !pathname.startsWith('/api/db')) {
      next();
      return;
    }

    if (req.method !== 'GET') {
      writeJson(res, 405, { error: 'Method not allowed' });
      return;
    }

    try {
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

      writeJson(res, 404, { error: 'Not found' });
    } catch {
      writeJson(res, 503, { error: 'Database unavailable' });
    }
  };
}
