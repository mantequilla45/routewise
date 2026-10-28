'use client';

import type { FormEvent } from 'react';
import type { Coordinate, ContributeFormData, SubmitStatus } from '@/hooks/useContributeRoute';
import RoutePointsList from '@/components/contribute/RoutePointsList';

interface ContributeRouteFormProps {
  formData: ContributeFormData;
  onFormDataChange: (data: ContributeFormData) => void;
  mapCoordinates: Coordinate[];
  selectedPointIndex: number | null;
  insertMode: boolean;
  onToggleInsertMode: () => void;
  onPointSelect: (index: number) => void;
  onRemovePoint: (index: number) => void;
  onCloseLoopClick: () => void;
  onSubmit: (e: FormEvent) => void;
  isSubmitting: boolean;
  status: SubmitStatus;
}

const INPUT_CLASS =
  'w-full px-4 py-3 text-sm sm:text-base border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200';

const LABEL_CLASS = 'block text-sm sm:text-base font-semibold text-gray-700 mb-2';

export default function ContributeRouteForm({
  formData,
  onFormDataChange,
  mapCoordinates,
  selectedPointIndex,
  insertMode,
  onToggleInsertMode,
  onPointSelect,
  onRemovePoint,
  onCloseLoopClick,
  onSubmit,
  isSubmitting,
  status,
}: ContributeRouteFormProps) {
  const isLoopClosed =
    mapCoordinates.length > 2 &&
    mapCoordinates[mapCoordinates.length - 1].lat === mapCoordinates[0].lat &&
    mapCoordinates[mapCoordinates.length - 1].lng === mapCoordinates[0].lng;
  const tooFewPoints = mapCoordinates.length < 2;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 w-full lg:w-1/3 min-w-0">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Route Information</h2>

      <form onSubmit={onSubmit} className="space-y-5 lg:space-y-6">
        {/* Route Code */}
        <div>
          <label className={LABEL_CLASS}>Route Code* (e.g., 01A, 23B)</label>
          <input
            type="text"
            value={formData.route_code}
            onChange={(e) => onFormDataChange({ ...formData, route_code: e.target.value })}
            className={INPUT_CLASS}
            placeholder="Enter route code"
            required
          />
        </div>

        {/* Contributor Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>Your Name*</label>
            <input
              type="text"
              value={formData.contributor_name}
              onChange={(e) => onFormDataChange({ ...formData, contributor_name: e.target.value })}
              className={INPUT_CLASS}
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Email (optional)</label>
            <input
              type="email"
              value={formData.contributor_email}
              onChange={(e) => onFormDataChange({ ...formData, contributor_email: e.target.value })}
              className={INPUT_CLASS}
              placeholder="your@email.com"
            />
          </div>
        </div>

        <RoutePointsList
          mapCoordinates={mapCoordinates}
          selectedPointIndex={selectedPointIndex}
          insertMode={insertMode}
          onToggleInsertMode={onToggleInsertMode}
          onPointSelect={onPointSelect}
          onRemove={onRemovePoint}
        />

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-4">
          <button
            type="button"
            onClick={onCloseLoopClick}
            className={`px-4 py-3 rounded-lg font-semibold transition-all ${
              tooFewPoints
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : isLoopClosed
                  ? 'bg-green-500 text-white cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
            disabled={tooFewPoints || isLoopClosed}
            title={tooFewPoints ? 'Need at least 2 points to close loop' : ''}
          >
            {isLoopClosed ? '✓ Loop Closed' : 'Close Loop'}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || tooFewPoints}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold text-white transition-all ${
              isSubmitting || tooFewPoints
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Route for Review'}
          </button>
        </div>

        {/* Status Message */}
        {status.message && (
          <div
            className={`p-4 rounded-lg ${
              status.type === 'error'
                ? 'bg-red-100 text-red-700 border border-red-300'
                : 'bg-green-100 text-green-700 border border-green-300'
            }`}
          >
            {status.message}
          </div>
        )}
      </form>
    </div>
  );
}
