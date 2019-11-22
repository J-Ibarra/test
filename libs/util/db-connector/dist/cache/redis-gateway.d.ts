import { RedisConfig } from '../model';
import { CacheGateway } from './cache-gateway';
export declare class RedisGateway implements CacheGateway {
    redisClient: any;
    constructor({ host, port, db }: RedisConfig);
    quit(): Promise<void>;
    set<T>(key: string, value: T): Promise<boolean>;
    get<T>(key: string): Promise<T>;
    getAll<T>(keys: string[]): Promise<T[]>;
    getList<T>(key: string, limit?: number, offset?: number): Promise<T[]>;
    trimList(key: string, start: number, end: any): Promise<void>;
    addValueToHeadOfList<T>(key: string, value: T): Promise<number>;
    addValuesToHeadOfList<T>(key: string, values: T[]): Promise<number>;
    addValueToTailOfList<T>(key: string, ...values: T[]): Promise<number>;
    getListLength(key: string): Promise<number>;
    popLastElement<T>(key: string): Promise<T>;
    incrementHashField(key: string, field: string, increment: number): Promise<number>;
    getAllHashValues(key: string): Promise<Record<string, string>>;
    setHashValue(key: string, field: string, value: string | number): Promise<void>;
    flush(): Promise<void>;
    publish<T>(channel: string, message: T): Promise<number>;
}
