import environmentConfig from '../../env-config'
const dbConfig = environmentConfig.redisDb
import epicurusConnector, { EpicurusPublicInterface } from 'epicurus-node'

let epicurus: EpicurusPublicInterface

export function getEpicurusInstance() {
  if (epicurus) {
    return epicurus
  }

  epicurus = epicurusConnector({
    host: dbConfig.host,
    port: dbConfig.port,
  })

  return epicurus
}

export function closeInstance() {
  if (epicurus) {
    epicurus.close()
    epicurus = (null as unknown) as EpicurusPublicInterface
  }
}
