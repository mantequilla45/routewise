// Vercel entry point. vercel.json rewrites every path here; Hono routes on the original URL.
// Vercel's Node runtime calls a default export as `(req, res)`; Web-style handlers have to be
// exported per HTTP method instead.
import { handle } from 'hono/vercel';
import { app } from '../src/app';

const handler = handle(app);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler;
