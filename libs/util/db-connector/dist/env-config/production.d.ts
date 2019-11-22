declare const _default: {
    exchangeDb: {
        username: string | undefined;
        password: string | undefined;
        schema: string | undefined;
        dialect: string;
        host: string | undefined;
        port: string | undefined;
        pool: {
            max: string | undefined;
            min: string | undefined;
            idle: number;
            acquire: number;
        };
    };
    redisDb: {
        host: string | undefined;
        port: string | undefined;
        db: number;
    };
};
export default _default;
