import { DepthCacheSymbol } from './depth_cache_symbol.interface';

export interface DepthCache {
    [symbolId: string]: DepthCacheSymbol
  }