'use client';

import Button from '@/components/ui/Button';
import type { ContributionsReview } from '@/hooks/useContributionsReview';
import type { Contribution } from '@/lib/routes/types';
import ContributionPointsEditor from './ContributionPointsEditor';

interface ContributionReviewDetailsProps {
  contribution: Contribution;
  review: ContributionsReview;
  isEditing: boolean;
}

/** Left side of an open contribution: route details, point editor and approve/reject flow. */
export default function ContributionReviewDetails({
  contribution,
  review,
  isEditing,
}: ContributionReviewDetailsProps) {
  const { reviewAction, reviewNotes } = review;

  return (
    <div className="space-y-4">
      <div className="rounded-lg">
        <h4 className="font-semibold mb-3 text-lg text-white">Route Details</h4>
        <div className="space-y-3">
          <div className="text-sm space-y-2">
            <p className="flex justify-between text-white">
              <strong>Route Code:</strong>
              <span className="text-[#FFCC66] font-medium">{contribution.route_code}</span>
            </p>
            <p className="flex justify-between text-white">
              <strong>Total Points:</strong>
              <span>{review.points.length}</span>
            </p>
            <p className="flex justify-between text-white">
              <strong>Route Type:</strong>
              <span>{contribution.forward_geojson.type}</span>
            </p>
          </div>
        </div>
      </div>

      {isEditing && (
        <ContributionPointsEditor
          points={review.points}
          selectedIndex={review.selectedPointIndex}
          onSelectPoint={review.setSelectedPointIndex}
          onRemovePoint={review.removePoint}
        />
      )}

      {!reviewAction && (
        <div className="flex gap-2">
          <Button variant="success" onClick={() => review.setReviewAction('approve')}>
            Approve
          </Button>
          <Button variant="danger" onClick={() => review.setReviewAction('reject')}>
            Reject
          </Button>
        </div>
      )}

      {reviewAction && (
        <div className="bg-[#111111] p-4 rounded-xl border border-[#2A2A2A]">
          <label className="block text-sm font-semibold mb-1 text-gray-200">Review Notes:</label>
          <textarea
            value={reviewNotes}
            onChange={(e) => review.setReviewNotes(e.target.value)}
            className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#333] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFCC66]"
            rows={3}
            placeholder={
              reviewAction === 'approve'
                ? 'Optional approval notes...'
                : 'Please provide rejection reason...'
            }
            required={reviewAction === 'reject'}
          />
          <div className="flex gap-2 mt-2">
            <Button
              variant={reviewAction === 'approve' ? 'success' : 'danger'}
              onClick={() => review.confirmAction(contribution)}
            >
              Confirm {reviewAction === 'approve' ? 'Approval' : 'Rejection'}
            </Button>
            <Button variant="secondary" onClick={review.cancelAction}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
