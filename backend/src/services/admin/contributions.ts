import { query } from '../../lib/db';
import { badRequest, notFound } from '../../lib/http';
import type { LngLatPair } from './routes';

export const REVIEW_STATUSES = ['approved', 'rejected', 'needs_revision'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export interface ContributionInput {
  route_code: string;
  contributor_name: string;
  contributor_email: string | null;
  coordinates_forward: LngLatPair[];
}

export function parseContributionInput(body: unknown): ContributionInput {
  const b = (body ?? {}) as Record<string, unknown>;
  const { route_code, contributor_name, contributor_email, coordinates_forward } = b;

  if (
    typeof route_code !== 'string' ||
    !route_code ||
    typeof contributor_name !== 'string' ||
    !contributor_name ||
    !Array.isArray(coordinates_forward) ||
    coordinates_forward.length < 2
  ) {
    throw badRequest('Missing required fields or insufficient coordinates');
  }

  const coords = coordinates_forward.map((c): LngLatPair => {
    if (!Array.isArray(c) || c.length !== 2 || !Number.isFinite(c[0]) || !Number.isFinite(c[1])) {
      throw badRequest('coordinates_forward must be [lng, lat] number pairs');
    }
    return [c[0], c[1]];
  });

  return {
    route_code,
    contributor_name,
    contributor_email: typeof contributor_email === 'string' ? contributor_email : null,
    coordinates_forward: coords,
  };
}

// Public: anyone can submit a route for review.
export async function submitContribution(input: ContributionInput) {
  const forwardGeojson = { type: 'LineString', coordinates: input.coordinates_forward };
  const result = await query(
    `
    INSERT INTO route_contributions (
      route_code, contributor_name, contributor_email, forward_geojson, status,
      start_point_name, end_point_name
    ) VALUES ($1, $2, $3, $4::jsonb, 'pending', $5, $6)
    RETURNING id, route_code, contributor_name, status;
  `,
    [
      input.route_code,
      input.contributor_name,
      input.contributor_email,
      JSON.stringify(forwardGeojson),
      'Terminal A',
      'Terminal B',
    ],
  );
  return result[0];
}

export async function listContributions(status: string) {
  return query(
    `
    SELECT
      id, route_code, contributor_name, contributor_email, forward_geojson, status,
      review_notes, created_at, start_point_name, end_point_name
    FROM route_contributions
    WHERE status = $1
    ORDER BY created_at DESC;
  `,
    [status],
  );
}

export async function getContribution(id: string) {
  const result = await query(
    `
    SELECT
      id, route_code, contributor_name, contributor_email, forward_geojson, status,
      review_notes, created_at, reviewed_at, transferred_route_id
    FROM route_contributions
    WHERE id = $1;
  `,
    [id],
  );
  if (result.length === 0) throw notFound('Contribution not found');
  return result[0];
}

export async function reviewContribution(
  id: string,
  review: {
    status: ReviewStatus;
    review_notes: string | null;
    transferred_route_id: string | null;
  },
) {
  const result = await query(
    `
    UPDATE route_contributions
    SET
      status = $1,
      review_notes = $2,
      reviewed_at = CURRENT_TIMESTAMP,
      transferred_route_id = $3,
      transferred_at = CASE WHEN $1 = 'approved' THEN CURRENT_TIMESTAMP ELSE NULL END
    WHERE id = $4
    RETURNING id, route_code, status;
  `,
    [review.status, review.review_notes, review.transferred_route_id, id],
  );
  if (result.length === 0) throw notFound('Contribution not found');
  return result[0];
}
