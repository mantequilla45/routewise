'use client';

import ConfirmModal from '@/components/ui/ConfirmModal';
import ContributeRouteForm from '@/components/contribute/ContributeRouteForm';
import ContributeMapSection from '@/components/contribute/ContributeMapSection';
import ContributeFooter from '@/components/contribute/ContributeFooter';
import { useContributeRoute } from '@/hooks/useContributeRoute';

export default function ContributeRoutePage() {
  const {
    formData,
    setFormData,
    mapCoordinates,
    status,
    isSubmitting,
    selectedPointIndex,
    insertMode,
    setInsertMode,
    showPointNumbers,
    setShowPointNumbers,
    hidePOIs,
    setHidePOIs,
    showCloseLoopModal,
    setShowCloseLoopModal,
    getDisplayCoordinates,
    handleSegmentClick,
    handleMapClick,
    handlePointSelect,
    removeMapCoordinate,
    closeLoop,
    handleSubmit,
  } = useContributeRoute();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container py-6 pb-0 min-w-[90vw] mx-auto">
        {/* Header */}
        <div className="p-6 sm:p-8 flex items-center gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-2">
              Contribute a Route
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600">
              Help map jeepney routes in your community
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex lg:flex-row flex-col gap-6 xl:gap-8 w-full">
          <ContributeRouteForm
            formData={formData}
            onFormDataChange={setFormData}
            mapCoordinates={mapCoordinates}
            selectedPointIndex={selectedPointIndex}
            insertMode={insertMode}
            onToggleInsertMode={() => setInsertMode(!insertMode)}
            onPointSelect={handlePointSelect}
            onRemovePoint={removeMapCoordinate}
            onCloseLoopClick={() => setShowCloseLoopModal(true)}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            status={status}
          />

          <ContributeMapSection
            coordinates={getDisplayCoordinates()}
            selectedPointIndex={selectedPointIndex}
            showPointNumbers={showPointNumbers}
            onShowPointNumbersChange={setShowPointNumbers}
            hidePOIs={hidePOIs}
            onHidePOIsChange={setHidePOIs}
            onMapClick={handleMapClick}
            onPointClick={handlePointSelect}
            onSegmentClick={handleSegmentClick}
          />
        </div>
      </div>

      <ContributeFooter />

      {/* Close Loop Confirmation Modal */}
      <ConfirmModal
        isOpen={showCloseLoopModal}
        onClose={() => setShowCloseLoopModal(false)}
        onConfirm={closeLoop}
        title="Closing the Loop"
        message={`Once you close the loop:
• You can only add points between existing segments
• You cannot add points at the end of the route
• The route will form a continuous loop

Are you sure you want to close the loop?`}
        confirmText="Yes, Close Loop"
        cancelText="Cancel"
        confirmButtonClass="bg-purple-600 hover:bg-purple-700"
      />
    </div>
  );
}
