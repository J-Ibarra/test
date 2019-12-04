import { SupportedFeatureFlags } from './supported_feature_flags.enum';

export interface FeatureFlag {
    name: SupportedFeatureFlags
    enabled: boolean
  }