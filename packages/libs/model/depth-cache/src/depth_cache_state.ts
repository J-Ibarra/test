import { DepthCache } from './depth_cache'

export interface DepthCacheState {
  depthCache: DepthCache
  lastCacheFetch?: Date
  symbolIds: string[]
}
