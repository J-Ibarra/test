export interface CacheGateway {
    quit(): Promise<void>;
    set<T>(key: string, value: T): Promise<boolean>;
    get<T>(key: string): Promise<T>;
    getList<T>(key: string, limit?: number, offset?: number): Promise<T[]>;
    trimList(key: string, start: number, end: number): Promise<void>;
    getAll<T>(keys: string[]): Promise<T[]>;
    addValueToHeadOfList<T>(key: string, value: T): Promise<number>;
    addValuesToHeadOfList<T>(key: string, values: T[]): Promise<number>;
    addValueToTailOfList<T>(key: string, ...value: T[]): Promise<number>;
    getListLength(key: string): Promise<number>;
    popLastElement<T>(key: string): Promise<T>;
    setHashValue(key: string, field: string, value: string | number): Promise<void>;
    incrementHashField(key: string, field: string, increment: number): Promise<number>;
    getAllHashValues(key: string): Promise<Record<string, string>>;
    flush(): Promise<void>;
    publish<T>(channel: string, message: T): Promise<number>;
}
