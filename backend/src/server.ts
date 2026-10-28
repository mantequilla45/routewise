// Local / container entry point. Vercel uses api/index.ts instead.
import 'dotenv/config';
import { serve } from '@hono/node-server';
import { app } from './app';
import { env } from './env';

serve({ fetch: app.fetch, port: env.port }, (info) => {
    console.log(`routewise-api listening on http://localhost:${info.port}`);
});
