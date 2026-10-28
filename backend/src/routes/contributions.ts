import { Hono } from 'hono';
import { requireAuth, type AuthVariables } from '../middleware/auth';
import { parseContributionInput, submitContribution } from '../services/admin/contributions';

// Any signed-in user can submit a route for review; review happens under /admin.
export const contributions = new Hono<{ Variables: AuthVariables }>();

contributions.use('*', requireAuth);

contributions.post('/', async (c) => {
  const input = parseContributionInput(await c.req.json().catch(() => null));
  const contribution = await submitContribution(input);
  return c.json(
    {
      success: true,
      message: 'Route contribution submitted successfully for review',
      contribution,
    },
    201,
  );
});
