import type { PlaceCategory } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';

type IconName = ComponentProps<typeof Ionicons>['name'];

export const CATEGORIES: { key: PlaceCategory | 'all'; label: string; icon: IconName }[] = [
  { key: 'all', label: 'All', icon: 'apps-outline' },
  { key: 'mall', label: 'Malls', icon: 'bag-handle-outline' },
  { key: 'school', label: 'Schools', icon: 'school-outline' },
  { key: 'terminal', label: 'Terminals', icon: 'bus-outline' },
  { key: 'hospital', label: 'Hospitals', icon: 'medkit-outline' },
  { key: 'landmark', label: 'Landmarks', icon: 'flag-outline' },
];

export const iconForCategory = (category: PlaceCategory): IconName =>
  CATEGORIES.find((c) => c.key === category)?.icon ?? 'location-outline';
