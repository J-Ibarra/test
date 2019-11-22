declare const _default: {
    exchangeDb: {
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
export default _default;
