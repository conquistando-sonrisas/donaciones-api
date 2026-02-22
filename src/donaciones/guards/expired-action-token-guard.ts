import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { verify } from "jsonwebtoken";



@Injectable()
export class ExpiredActionTokenGuard implements CanActivate {
  private readonly logger = new Logger(ExpiredActionTokenGuard.name, { timestamp: true });

  constructor(
    private readonly config: ConfigService,
  ) { }


  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const token = request.params.token;

    if (!token) throw new UnauthorizedException();

    try {
      const decoded = verify(token, this.config.getOrThrow<string>('JWT_SECRET'), { ignoreExpiration: true });
      request.idActionToken = decoded.sub;
      return true;
    } catch (err) {
      this.logger.error(err);
      return false;
    }
  }

}