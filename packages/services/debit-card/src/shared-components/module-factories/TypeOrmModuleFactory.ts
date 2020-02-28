import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { ConfigSourceFactory } from '../providers'

export class TypeOrmModuleFactory {
  static create(): TypeOrmModuleOptions {
    const {
      host,
      port,
      username,
      password,
      database,
      customEntitiesLocation,
      customMigrationsLocation,
      keepConnectionAlive,
    } = ConfigSourceFactory.getConfigSourceForEnvironment().getDebitCardDbConfig()

    return {
      type: 'postgres',
      host,
      port,
      username,
      password,
      database,
      entities: customEntitiesLocation || [
        'dist/src/app/**/*.entity{.ts,.js}',
        'dist/src/shared-components/**/*.entity{.ts,.js}',
      ],
      migrations: [customMigrationsLocation || 'dist/src/db-migrations/*.js'],
      synchronize: false,
      migrationsRun: true,
      keepConnectionAlive,
    }
  }
}
