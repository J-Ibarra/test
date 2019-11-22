import { RedisGateway } from './redis-gateway';
export declare class APIRedisGateway extends RedisGateway {
    private keyPrefix;
    setCache<T>(key: string, value: T, ttl?: number): Promise<boolean>;
    getCache<T>(key: string): Promise<T | null>;
    private getKey;
}
