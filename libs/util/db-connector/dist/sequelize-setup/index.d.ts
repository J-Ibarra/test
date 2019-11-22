import Sequelize from 'sequelize';
declare const sequelize: Sequelize.Sequelize;
export declare const exitOnLostConnection: (sequelizeInstance: Sequelize.Sequelize) => void;
export default sequelize;
export * from './transaction_wrapper';
export * from './migration';
export declare function setupModel(modelSetupFn: (sequelizeClient: Sequelize.Sequelize) => void): void;
export declare function getModel<T>(modelName: string): Sequelize.Model<Sequelize.Instance<T>, T>;
