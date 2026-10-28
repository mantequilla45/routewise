'use client';

import type { ContributionsReview } from '@/hooks/useContributionsReview';
import { toLngLatPairs } from '@/lib/routes/points';
import DynamicAddRouteMap from './DynamicAddRouteMap';

interface ContributionReviewMapProps {
  review: ContributionsReview;
  isEditing: boolean;
}

/** Right side of an open contribution: the route preview, editable when in edit mode. */
export default function ContributionReviewMap({ review, isEditing }: ContributionReviewMapProps) {
  return (
    <div className="bg-[#111111] p-4 rounded-xl border border-[#2A2A2A]">
      <h4 className="font-semibold mb-3 text-lg flex items-center text-white">
        <svg
          className="w-5 h-5 mr-2 text-[#FFCC66]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
        Route Preview {isEditing && '(Editing)'}
      </h4>
      <div className="h-96 border border-[#333] rounded-xl overflow-hidden">
        <DynamicAddRouteMap
          coordinates={toLngLatPairs(review.points)}
          height="384px"
          enableClickToAdd={isEditing}
          showPointNumbers={true}
          hidePOIs={false}
          highlightedIndex={isEditing ? review.selectedPointIndex : null}
          onMapClick={isEditing ? review.handleMapClick : undefined}
          onPointClick={isEditing ? review.setSelectedPointIndex : undefined}
          onSegmentClick={isEditing ? review.handleSegmentClick : undefined}
        />
      </div>
    </div>
  );
}
