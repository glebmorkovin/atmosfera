import { BadRequestException, ConflictException, Injectable, Logger, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { RegisterDto, RegisterRole } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { UsersService } from "../users/users.service";
import { ResetRequestDto } from "./dto/reset-request.dto";
import { ResetConfirmDto } from "./dto/reset-confirm.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { LogoutDto } from "./dto/logout.dto";
import { UserRole } from "@prisma/client";
import { ACCESS_TTL, REFRESH_TTL_SEC } from "./auth.constants";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

type TokenType = "access" | "refresh";

const sanitizeUser = (user: { id: string; email: string; role: UserRole; firstName: string; lastName: string; country?: string | null; city?: string | null }) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  firstName: user.firstName,
  lastName: user.lastName,
  country: user.country ?? undefined,
  city: user.city ?? undefined
});

const mapRole = (role: RegisterRole): UserRole => {
  const upper = role.toUpperCase();
  if (!Object.prototype.hasOwnProperty.call(UserRole, upper)) {
    throw new BadRequestException("Недопустимая роль");
  }
  return UserRole[upper as keyof typeof UserRole];
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly usersService: UsersService) {}

  private signTokens(user: { id: string; email: string; role: UserRole }) {
    const payloadBase = { sub: user.id, email: user.email, role: user.role };
    const accessToken = jwt.sign({ ...payloadBase, type: "access" as TokenType }, JWT_SECRET, {
      expiresIn: ACCESS_TTL
    });
    const refreshToken = jwt.sign({ ...payloadBase, type: "refresh" as TokenType, jti: randomUUID() }, JWT_SECRET, {
      expiresIn: `${REFRESH_TTL_SEC}s`
    });
    return { accessToken, refreshToken };
  }

  async register(payload: RegisterDto) {
    const role = mapRole(payload.role);
    let user;
    try {
      user = await this.usersService.createUser({
        email: payload.email,
        password: payload.password,
        role,
        firstName: payload.firstName,
        lastName: payload.lastName,
        country: payload.country,
        city: payload.city
      });
    } catch (err) {
      if (err instanceof Error && err.message === "EMAIL_EXISTS") {
        throw new ConflictException("Пользователь с таким email уже существует");
      }
      throw err;
    }
    const tokens = this.signTokens(user);
    await this.usersService.saveRefreshToken(user.id, tokens.refreshToken, REFRESH_TTL_SEC);
    return { ...tokens, user: sanitizeUser(user) };
  }

  async login(payload: LoginDto) {
    try {
      const user = await this.usersService.validateUser(payload.email, payload.password);
      if (!user) {
        this.logger.warn(`Invalid login attempt for ${payload.email}`);
        throw new UnauthorizedException("Неверный email или пароль");
      }
      const tokens = this.signTokens(user);
      await this.usersService.saveRefreshToken(user.id, tokens.refreshToken, REFRESH_TTL_SEC);
      return { ...tokens, user: sanitizeUser(user) };
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      this.logger.error(`Login failed for ${payload.email}`, err instanceof Error ? err.stack : undefined);
      throw new ServiceUnavailableException("Сервис авторизации временно недоступен");
    }
  }

  async refresh(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as jwt.JwtPayload;
      if (decoded.type !== "refresh") throw new Error("WRONG_TOKEN_TYPE");
      const user = await this.usersService.findById(decoded.sub as string);
      if (!user || !user.isActive) throw new Error("USER_NOT_FOUND");
      const tokenExists = await this.usersService.validateRefreshToken(decoded.jti as string, refreshToken, user.id);
      if (!tokenExists) throw new Error("TOKEN_REVOKED");
      const tokens = this.signTokens(user);
      await this.usersService.saveRefreshToken(user.id, tokens.refreshToken, REFRESH_TTL_SEC);
      await this.usersService.revokeRefreshToken(decoded.jti as string);
      return { ...tokens, user: sanitizeUser(user) };
    } catch (err) {
      throw new UnauthorizedException("Недействительный refresh токен");
    }
  }

  async requestReset(payload: ResetRequestDto) {
    const user = await this.usersService.findByEmail(payload.email);
    if (user) {
      const token = await this.usersService.createResetToken(user.id);
      // MVP: логируем токен для ручной проверки
      // eslint-disable-next-line no-console
      console.log(`[reset-token] email=${payload.email} token=${token}`);
    }
    return { message: "Если такой email существует, мы отправили ссылку для восстановления" };
  }

  async confirmReset(payload: ResetConfirmDto) {
    const user = await this.usersService.consumeResetToken(payload.token);
    if (!user) throw new UnauthorizedException("Недействительный или просроченный токен");
    await this.usersService.updatePassword(user.id, payload.newPassword);
    return { message: "Пароль обновлён" };
  }

  async changePassword(payload: ChangePasswordDto) {
    const user = await this.usersService.validateUser(payload.email, payload.oldPassword);
    if (!user) throw new UnauthorizedException("Неверные учётные данные");
    await this.usersService.updatePassword(user.id, payload.newPassword);
    return { message: "Пароль успешно изменён" };
  }

  async logout(payload: LogoutDto) {
    if (payload.refreshToken) {
      try {
        const decoded = jwt.verify(payload.refreshToken, JWT_SECRET, { ignoreExpiration: true }) as jwt.JwtPayload;
        if (decoded.jti) {
          await this.usersService.revokeRefreshToken(decoded.jti as string);
        }
      } catch {
        // ignore invalid tokens on logout
      }
    }
    return { message: "Вы вышли из системы" };
  }
}
