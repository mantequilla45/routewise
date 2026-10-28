import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { HttpError } from './lib/http';
import { auth } from './routes/auth';
import { me } from './routes/me';
import { routes } from './routes/routes';
import { savedRoutes } from './routes/savedRoutes';

export const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.get('/', (c) => c.json({ name: 'routewise-api', status: 'ok' }));
app.get('/health', (c) => c.json({ status: 'ok', time: new Date().toISOString() }));

app.route('/auth', auth);
app.route('/me', me);
app.route('/saved-routes', savedRoutes);
app.route('/routes', routes);

app.notFound((c) => c.json({ error: 'Not found' }, 404));

app.onError((err, c) => {
    if (err instanceof HttpError) {
        return c.json(err.body, err.status as 400);
    }
    console.error('Unhandled error:', err);
    return c.json({ error: 'Internal server error' }, 500);
});
