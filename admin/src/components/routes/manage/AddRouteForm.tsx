'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import ConfirmModal from '@/components/ui/ConfirmModal';
import type { RoutePointsEditor } from '@/hooks/useRoutePointsEditor';
import type { AddRouteForm as AddRouteFormState } from '@/hooks/useAddRouteForm';
import { CLOSE_LOOP_CONFIRM_MESSAGE, isLoopClosedExactly } from '@/lib/routes/points';
import RoutePointsList from './RoutePointsList';

const KML_INPUT_ID = 'kml-upload';

interface AddRouteFormProps {
  editor: RoutePointsEditor;
  form: AddRouteFormState;
}

/** Left-hand column of the "Add New Route" tab: route code, KML import, points and submit. */
export default function AddRouteForm({ editor, form }: AddRouteFormProps) {
  const [showCloseLoopModal, setShowCloseLoopModal] = useState(false);
  const { points } = editor;

  const clearPoints = () => {
    editor.loadPoints([]);
    const fileInput = document.getElementById(KML_INPUT_ID) as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';
  };

  return (
    <form
      onSubmit={form.handleSubmit}
      className="flex flex-col flex-1 min-h-0 gap-3 border border-[#2A2A2A] rounded-xl p-4 bg-[#111111]"
    >
      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-sm font-semibold text-white mb-1">
            Route Code
            <span className="text-red-500 ml-0.5"> *</span>
          </label>
          <input
            type="text"
            value={form.routeCode}
            onChange={(e) => form.setRouteCode(e.target.value)}
            className="w-full px-3 py-2 bg-[#2D2D2D] border border-[#4C4C4C] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFCC66] focus:border-[#FFCC66]"
            placeholder="e.g., 01A"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-1">
            Import from KML/KMZ <span className="text-gray-500 font-normal">(Optional)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="file"
              accept=".kml,.kmz"
              onChange={form.handleFileUpload}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-b file:from-[#FFCC66] file:to-[#CC9933] file:text-black hover:file:opacity-90 file:cursor-pointer file:transition-opacity"
              id={KML_INPUT_ID}
            />
            {points.length > 0 && (
              <Button type="button" size="sm" onClick={clearPoints}>
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col border-t border-[#2D2D2D] pt-3 gap-1">
        <RoutePointsList
          points={points}
          selectedIndex={editor.selectedIndex}
          insertMode={editor.insertMode}
          onSelectPoint={editor.handlePointSelect}
          onToggleInsertMode={editor.toggleInsertMode}
          onRemovePoint={editor.removePoint}
        />
      </div>

      <div className="flex space-x-3">
        {isLoopClosedExactly(points) ? (
          <Button type="button" variant="success" disabled>
            ✓ Loop Closed
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled={points.length < 2}
            title={points.length < 2 ? 'Need at least 2 points to close loop' : ''}
            onClick={() => setShowCloseLoopModal(true)}
          >
            Close Loop
          </Button>
        )}
        <Button type="submit" variant="primary" loading={form.isSubmitting} className="flex-1">
          {form.isSubmitting ? 'Adding...' : 'Add Route'}
        </Button>
      </div>

      {form.status.message && (
        <div
          className={`p-4 rounded-lg border ${
            form.status.type === 'error'
              ? 'bg-red-900/20 text-red-400 border-red-500'
              : 'bg-green-900/20 text-green-400 border-green-500'
          }`}
        >
          {form.status.message}
        </div>
      )}

      <ConfirmModal
        isOpen={showCloseLoopModal}
        onClose={() => setShowCloseLoopModal(false)}
        onConfirm={editor.closeLoop}
        title="Closing the Loop"
        message={CLOSE_LOOP_CONFIRM_MESSAGE}
        confirmText="Yes, Close Loop"
        cancelText="Cancel"
      />
    </form>
  );
}
