import { DepthCacheSymbol } from './depth_cache_symbol'

export interface DepthCache {
  [symbolId: string]: DepthCacheSymbol
}
