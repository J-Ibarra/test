import epicurusConnector, { EpicurusPublicInterface } from 'epicurus-node'
import { RedisConfig } from '../../models'
import { Logger } from '@nestjs/common'

export const EPICURUS_TOKEN = 'epicurus_token'
const logger = new Logger('getEpicurusInstance')

export function getEpicurusInstance(
  redisConfig: RedisConfig,
): EpicurusPublicInterface {
  logger.debug(
    `Creating epicurus client to ${redisConfig.host} ${redisConfig.port}`,
  )

  return epicurusConnector({
    host: redisConfig.host,
    // This is required to solve using wrong port in CI build
    port: process.env.ENV === 'CI' ? 6379 : redisConfig.port,
  })
}
