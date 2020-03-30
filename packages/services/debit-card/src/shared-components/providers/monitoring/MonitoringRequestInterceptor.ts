import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { MONITORING_SERVICE, MonitoringService } from './Monitoring.service'

@Injectable()
export class MonitoringRequestInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector,
              @Inject(MONITORING_SERVICE) private monitoringService: MonitoringService) {}

  intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const controllerPath = this.reflector.get<string>('path', context.getClass())
    const endpointPath = this.reflector.get<string>('path', context.getHandler())

    return this.monitoringService.recordExecution(`${controllerPath}${endpointPath}`, () => next.handle().toPromise())
  }
}
