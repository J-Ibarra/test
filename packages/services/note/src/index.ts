import { bootstrapRestApi } from './rest-api'
import { bootstrapInternalApi } from './internal-api/note_creator'

export function bootstrap() {
  bootstrapInternalApi()
  bootstrapRestApi()
}
