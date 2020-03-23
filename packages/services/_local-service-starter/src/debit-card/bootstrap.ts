import sourceMapSupport from 'source-map-support'
import { startAllServices } from './services_starter'

sourceMapSupport.install()

async function bootstrap() {
  await startAllServices()
}

bootstrap()
