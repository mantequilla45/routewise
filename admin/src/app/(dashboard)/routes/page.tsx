'use client';

import { useState } from 'react';
import RoutesList from '@/components/routes/RoutesList';
import AddRouteTab from '@/components/routes/manage/AddRouteTab';
import ContributionsReviewTab from '@/components/routes/manage/ContributionsReviewTab';
import RouteManagementTabs from '@/components/routes/manage/RouteManagementTabs';
import { useAddRouteForm } from '@/hooks/useAddRouteForm';
import { useContributionsReview } from '@/hooks/useContributionsReview';
import { useRoutePointsEditor } from '@/hooks/useRoutePointsEditor';
import type { RouteManagementTab } from '@/lib/routes/types';

export default function RouteManagementPage() {
  const [activeTab, setActiveTab] = useState<RouteManagementTab>('add');

  // State lives here so an in-progress route or review survives switching tabs
  const editor = useRoutePointsEditor();
  const form = useAddRouteForm({
    points: editor.points,
    setPoints: editor.setPoints,
    loadPoints: editor.loadPoints,
    onRouteAdded: () => setActiveTab('list'),
  });
  const review = useContributionsReview();

  const selectTab = (tab: RouteManagementTab) => {
    setActiveTab(tab);
    if (tab === 'review' && activeTab !== 'review') {
      review.fetchContributions();
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div>
        <h1 className="text-3xl font-bold text-white">Route Management</h1>
        <p className="text-gray-400 mt-1">Add and manage jeepney routes</p>
      </div>

      <div className="bg-[#161616] border border-[#222222] rounded-2xl transition-all mt-6 flex flex-col flex-1 min-h-0 overflow-hidden">
        <RouteManagementTabs
          activeTab={activeTab}
          pendingCount={review.pendingContributions.length}
          onSelectTab={selectTab}
        />

        {activeTab === 'add' ? (
          <AddRouteTab editor={editor} form={form} />
        ) : activeTab === 'list' ? (
          <div className="flex-1 min-h-0 overflow-hidden">
            <RoutesList />
          </div>
        ) : (
          <ContributionsReviewTab review={review} />
        )}
      </div>
    </div>
  );
}
