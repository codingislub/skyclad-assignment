import { create } from 'zustand';
import { featureFlagsService, FeatureFlags } from '@/services/featureFlags.service';

interface FeatureFlagsState {
  flags: FeatureFlags | null;
  loading: boolean;
  error: string | null;
  fetchFlags: () => Promise<void>;
  isEnabled: (flag: keyof FeatureFlags) => boolean;
}

export const useFeatureFlagsStore = create<FeatureFlagsState>((set, get) => ({
  flags: null,
  loading: false,
  error: null,

  fetchFlags: async () => {
    set({ loading: true, error: null });
    try {
      const flags = await featureFlagsService.fetchFlags();
      set({ flags, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch feature flags',
        loading: false 
      });
    }
  },

  isEnabled: (flag: keyof FeatureFlags) => {
    const { flags } = get();
    return flags?.[flag] ?? false;
  },
}));
