// Vercel entry point. vercel.json rewrites every path here; Hono routes on the original URL.
import { handle } from 'hono/vercel';
import { app } from '../src/app';

export default handle(app);
