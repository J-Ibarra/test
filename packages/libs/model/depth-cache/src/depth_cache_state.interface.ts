import { DepthCache } from './depth_cache.interface';

export interface DepthCacheState {
    depthCache: DepthCache
    lastCacheFetch?: Date
    symbolIds: string[]
  }