'use client';

import dynamic from 'next/dynamic';

/** AddRouteMap loaded client-side only, since Google Maps cannot render during SSR. */
const DynamicAddRouteMap = dynamic(() => import('@/components/routes/AddRouteMap'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-[#1A1A1A] animate-pulse rounded-xl flex items-center justify-center text-gray-500">
      Loading map...
    </div>
  ),
});

export default DynamicAddRouteMap;
