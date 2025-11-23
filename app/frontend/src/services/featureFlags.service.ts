import { api } from '@/lib/axios';

export interface FeatureFlags {
  advanced_validation: boolean;
  bulk_operations: boolean;
  ai_suggestions: boolean;
  real_time_notifications: boolean;
  export_analytics: boolean;
}

class FeatureFlagsService {
  private flags: FeatureFlags | null = null;

  async fetchFlags(): Promise<FeatureFlags> {
    const response = await api.get<FeatureFlags>('/feature-flags');
    this.flags = response.data;
    return response.data;
  }

  isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags?.[flag] ?? false;
  }

  getAllFlags(): FeatureFlags | null {
    return this.flags;
  }
}

export const featureFlagsService = new FeatureFlagsService();
