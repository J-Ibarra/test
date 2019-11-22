export interface RedisConfig {
    host: string;
    port: number;
    db: number;
}
export interface DbConfig {
    username: string;
    password: string;
    schema: string;
    dialect: string;
    host: string;
    port: number;
    pool: {
        max: number;
        min: number;
        idle: number;
    };
}
export interface EnvironmentConfig {
    exchangeDb: DbConfig;
    redisDb: RedisConfig;
}
