'use client';

import Button from '@/components/ui/Button';
import type { ContributionsReview } from '@/hooks/useContributionsReview';
import type { Contribution } from '@/lib/routes/types';
import ContributionReviewDetails from './ContributionReviewDetails';
import ContributionReviewMap from './ContributionReviewMap';

interface ContributionCardProps {
  contribution: Contribution;
  review: ContributionsReview;
}

/** One pending contribution: summary header plus, when opened, the review details and map. */
export default function ContributionCard({ contribution, review }: ContributionCardProps) {
  const isReviewing = review.selectedContribution?.id === contribution.id;
  const isEditing = isReviewing && review.editingContributionId === contribution.id;

  return (
    <div className="border border-[#2A2A2A] bg-[#111111] rounded-xl p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Route {contribution.route_code}</h3>
          <p className="text-sm text-gray-400">
            Contributed by: {contribution.contributor_name}
            {contribution.contributor_email && ` (${contribution.contributor_email})`}
          </p>
          <p className="text-xs text-gray-400">
            Submitted: {new Date(contribution.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          {!isReviewing ? (
            <Button size="sm" onClick={() => review.startReview(contribution)}>
              Review
            </Button>
          ) : (
            <>
              {!isEditing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => review.setEditingContributionId(contribution.id)}
                >
                  Edit
                </Button>
              )}
              {isEditing && (
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => review.setEditingContributionId(null)}
                >
                  Done Editing
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={review.closeReview}>
                Close
              </Button>
            </>
          )}
        </div>
      </div>

      {isReviewing && (
        <div className="mt-4 border-t border-[#2A2A2A] pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ContributionReviewDetails
              contribution={contribution}
              review={review}
              isEditing={isEditing}
            />
            <ContributionReviewMap review={review} isEditing={isEditing} />
          </div>
        </div>
      )}
    </div>
  );
}
