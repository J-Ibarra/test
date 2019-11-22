declare const dbConfig: {
    exchangeDb: {
        username: string;
        password: string;
        schema: string;
        dialect: string;
        host: string;
        port: string | number;
        pool: {
            max: number;
            min: number;
            idle: number;
            acquire: number;
        };
    };
    redisDb: {
        host: string;
        port: string | number;
        db: number;
    };
    jwtSecret: string;
};
export default dbConfig;
