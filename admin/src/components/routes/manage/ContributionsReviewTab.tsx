'use client';

import type { ContributionsReview } from '@/hooks/useContributionsReview';
import ContributionCard from './ContributionCard';

interface ContributionsReviewTabProps {
  review: ContributionsReview;
}

/** "Review Contributions" tab: the list of pending contributions. */
export default function ContributionsReviewTab({ review }: ContributionsReviewTabProps) {
  const { loading, pendingContributions } = review;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="gap-3 p-3">
        <div className="p-2">
          <h2 className="text-xl font-bold text-gray-200 mb-2">PENDING ROUTE CONTRIBUTIONS</h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFCC66]"></div>
              <p className="mt-2 text-gray-400">Loading contributions...</p>
            </div>
          ) : pendingContributions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No pending contributions to review</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingContributions.map((contribution) => (
                <ContributionCard
                  key={contribution.id}
                  contribution={contribution}
                  review={review}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
