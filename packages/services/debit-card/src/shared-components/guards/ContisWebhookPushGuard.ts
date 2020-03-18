import { CanActivate, ExecutionContext, Inject, Logger } from '@nestjs/common'
import { ConfigSource, CONFIG_SOURCE_TOKEN } from '../providers'

/** When deployed in an environment, we would whitelist a single IP that we allow Contis to push data to us from. */
export class ContisWebhookPushGuard implements CanActivate {
  private logger = new Logger('ContisWebhookPushGuard')

  constructor(
    @Inject(CONFIG_SOURCE_TOKEN)
    private readonly configSource: ConfigSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    if (process.env.ENV === 'TEST' || process.env.ENV === 'CI') {
      return true
    }

    // Might need to use 'request-ip' here if API Gateway or LB changes the source IP
    const requestIpIsWhitelisted = this.configSource.getContisConfig().webhookWhitelistedIP.includes(request.ip)

    if (requestIpIsWhitelisted) {
      this.logger.warn(`Received a contis notification from a non-contis IP ${request.ip}`)
    }

    return requestIpIsWhitelisted
  }
}
