// Thrown by services to produce a specific HTTP status from a route handler.
export class HttpError extends Error {
  constructor(
    public status: number,
    public body: Record<string, unknown>,
  ) {
    super(typeof body.error === 'string' ? body.error : `HTTP ${status}`);
  }
}

export function badRequest(error: string, extra: Record<string, unknown> = {}) {
  return new HttpError(400, { error, ...extra });
}

export function notFound(error: string, extra: Record<string, unknown> = {}) {
  return new HttpError(404, { error, ...extra });
}
