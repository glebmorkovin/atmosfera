import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const auth = request.headers.authorization;
    if (!auth || typeof auth !== "string" || !auth.startsWith("Bearer ")) {
      throw new UnauthorizedException("Требуется авторизация");
    }
    const token = auth.slice("Bearer ".length);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
      if (decoded.type && decoded.type !== "access") {
        throw new Error("INVALID_TOKEN_TYPE");
      }
      request.user = { id: decoded.sub, email: decoded.email, role: decoded.role };
      return true;
    } catch {
      throw new UnauthorizedException("Недействительный токен");
    }
  }
}
