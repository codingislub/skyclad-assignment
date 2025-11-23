import { Injectable } from '@nestjs/common';

export enum FeatureFlag {
  ADVANCED_VALIDATION = 'advanced_validation',
  BULK_OPERATIONS = 'bulk_operations',
  AI_SUGGESTIONS = 'ai_suggestions',
  REAL_TIME_NOTIFICATIONS = 'real_time_notifications',
  EXPORT_ANALYTICS = 'export_analytics',
}

export interface FeatureFlagConfig {
  enabled: boolean;
  enabledForRoles?: string[];
  enabledForUsers?: string[];
  rolloutPercentage?: number;
}

@Injectable()
export class FeatureFlagsService {
  private flags: Map<FeatureFlag, FeatureFlagConfig> = new Map([
    [
      FeatureFlag.ADVANCED_VALIDATION,
      {
        enabled: true,
        enabledForRoles: ['ADMIN'],
      },
    ],
    [
      FeatureFlag.BULK_OPERATIONS,
      {
        enabled: true,
        enabledForRoles: ['ADMIN'],
      },
    ],
    [
      FeatureFlag.AI_SUGGESTIONS,
      {
        enabled: false,
        rolloutPercentage: 10,
      },
    ],
    [
      FeatureFlag.REAL_TIME_NOTIFICATIONS,
      {
        enabled: true,
      },
    ],
    [
      FeatureFlag.EXPORT_ANALYTICS,
      {
        enabled: true,
        enabledForRoles: ['ADMIN'],
      },
    ],
  ]);

  isEnabled(
    flag: FeatureFlag,
    context?: {
      userId?: string;
      userRole?: string;
    },
  ): boolean {
    const config = this.flags.get(flag);
    
    if (!config) {
      return false;
    }

    // Check if globally disabled
    if (!config.enabled) {
      return false;
    }

    // Check role-based access
    if (config.enabledForRoles && context?.userRole) {
      if (!config.enabledForRoles.includes(context.userRole)) {
        return false;
      }
    }

    // Check user-based access
    if (config.enabledForUsers && context?.userId) {
      if (!config.enabledForUsers.includes(context.userId)) {
        return false;
      }
    }

    // Check rollout percentage
    if (config.rolloutPercentage !== undefined && context?.userId) {
      const hash = this.hashUserId(context.userId);
      return hash < config.rolloutPercentage;
    }

    return true;
  }

  getAllFlags(context?: {
    userId?: string;
    userRole?: string;
  }): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    
    for (const [flag] of this.flags) {
      result[flag] = this.isEnabled(flag, context);
    }
    
    return result;
  }

  setFlag(flag: FeatureFlag, config: FeatureFlagConfig): void {
    this.flags.set(flag, config);
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash) % 100;
  }
}
