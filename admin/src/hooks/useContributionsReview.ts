'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Contribution, Coordinate, ReviewAction } from '@/lib/routes/types';
import { fromLngLatPairs, pointLabel, toLngLatPairs } from '@/lib/routes/points';

/**
 * Pending route contributions and the state of the one currently under review:
 * which contribution is open, whether its points are being edited, and the
 * approve/reject flow with notes.
 */
export function useContributionsReview() {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedContribution, setSelectedContribution] = useState<Contribution | null>(null);
  const [reviewAction, setReviewAction] = useState<ReviewAction | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [editingContributionId, setEditingContributionId] = useState<string | null>(null);
  const [points, setPoints] = useState<Coordinate[]>([]);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);

  const fetchContributions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/routes/contribute?status=pending');
      const data = await response.json();
      if (data.success) {
        setContributions(data.contributions);
      }
    } catch (error) {
      console.error('Error fetching contributions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount so the tab badge shows the pending count
  useEffect(() => {
    fetchContributions();
  }, [fetchContributions]);

  const pendingContributions = contributions.filter((c) => c.status === 'pending');

  const startReview = (contribution: Contribution) => {
    setSelectedContribution(contribution);
    setEditingContributionId(null);
    setPoints(fromLngLatPairs(contribution.forward_geojson?.coordinates ?? []));
    setReviewAction(null);
  };

  const closeReview = () => {
    setSelectedContribution(null);
    setEditingContributionId(null);
    setPoints([]);
  };

  const finishReview = () => {
    fetchContributions();
    setSelectedContribution(null);
    setReviewAction(null);
    setReviewNotes('');
  };

  const cancelAction = () => {
    setReviewAction(null);
    setReviewNotes('');
  };

  const approveContribution = async (contribution: Contribution) => {
    try {
      // First, add the route to the main routes table
      const response = await fetch('/api/routes/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route_code: contribution.route_code,
          start_point_name: 'Terminal A',
          end_point_name: 'Terminal B',
          coordinates_forward: contribution.forward_geojson.coordinates,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetch(`/api/routes/contribute/${contribution.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'approved',
            review_notes: reviewNotes,
            transferred_route_id: result.route.id,
          }),
        });

        finishReview();
        alert(`Route ${contribution.route_code} has been approved and added to the system!`);
      }
    } catch (error) {
      console.error('Error approving contribution:', error);
      alert('Failed to approve contribution');
    }
  };

  const rejectContribution = async (contribution: Contribution) => {
    try {
      await fetch(`/api/routes/contribute/${contribution.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', review_notes: reviewNotes }),
      });

      finishReview();
      alert(`Route ${contribution.route_code} has been rejected.`);
    } catch (error) {
      console.error('Error rejecting contribution:', error);
      alert('Failed to reject contribution');
    }
  };

  /** Approve or reject using the (possibly edited) points. */
  const confirmAction = (contribution: Contribution) => {
    const updatedContribution: Contribution = {
      ...contribution,
      forward_geojson: {
        ...contribution.forward_geojson,
        coordinates: toLngLatPairs(points),
      },
    };
    if (reviewAction === 'approve') {
      approveContribution(updatedContribution);
    } else {
      rejectContribution(updatedContribution);
    }
  };

  /** Map click while editing: move the selected point, or append a new one. */
  const handleMapClick = (lat: number, lng: number) => {
    if (selectedPointIndex !== null) {
      const newCoords = [...points];
      newCoords[selectedPointIndex] = { ...newCoords[selectedPointIndex], lat, lng };
      setPoints(newCoords);
      setSelectedPointIndex(null);
    } else {
      setPoints([...points, { lat, lng, label: pointLabel(points.length) }]);
    }
  };

  const handleSegmentClick = (afterIndex: number, lat: number, lng: number) => {
    const newPoint = { lat, lng, label: pointLabel(afterIndex + 1) };
    const newCoords = [...points];
    newCoords.splice(afterIndex + 1, 0, newPoint);
    newCoords.forEach((coord, i) => {
      coord.label = pointLabel(i);
    });
    setPoints(newCoords);
  };

  const removePoint = (index: number) => {
    setPoints(points.filter((_, i) => i !== index));
  };

  return {
    contributions,
    pendingContributions,
    loading,
    fetchContributions,
    selectedContribution,
    editingContributionId,
    setEditingContributionId,
    reviewAction,
    setReviewAction,
    reviewNotes,
    setReviewNotes,
    points,
    selectedPointIndex,
    setSelectedPointIndex,
    startReview,
    closeReview,
    cancelAction,
    confirmAction,
    handleMapClick,
    handleSegmentClick,
    removePoint,
  };
}

export type ContributionsReview = ReturnType<typeof useContributionsReview>;
