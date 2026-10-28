'use client';

import type { RoutePointsEditor } from '@/hooks/useRoutePointsEditor';
import type { AddRouteForm as AddRouteFormState } from '@/hooks/useAddRouteForm';
import AddRouteForm from './AddRouteForm';
import RouteMapPanel from './RouteMapPanel';

interface AddRouteTabProps {
  editor: RoutePointsEditor;
  form: AddRouteFormState;
}

/** "Add New Route" tab: the form on the left and the editable map on the right. */
export default function AddRouteTab({ editor, form }: AddRouteTabProps) {
  return (
    <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 p-3 flex-1 min-h-0">
        <div className="lg:col-span-1 flex flex-col min-h-0">
          <AddRouteForm editor={editor} form={form} />
        </div>
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <RouteMapPanel editor={editor} />
        </div>
      </div>
    </div>
  );
}
