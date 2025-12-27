import { Body, Controller, Post, Req, Res, UnauthorizedException } from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { ResetRequestDto } from "./dto/reset-request.dto";
import { ResetConfirmDto } from "./dto/reset-confirm.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { LogoutDto } from "./dto/logout.dto";
import { REFRESH_COOKIE_NAME, REFRESH_TTL_SEC } from "./auth.constants";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(@Body() payload: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(payload);
    this.setRefreshCookie(res, result.refreshToken);
    return result;
  }

  @Post("login")
  async login(@Body() payload: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(payload);
    this.setRefreshCookie(res, result.refreshToken);
    return result;
  }

  @Post("refresh")
  async refresh(@Req() req: Request, @Body() payload: RefreshDto, @Res({ passthrough: true }) res: Response) {
    const token = this.getRefreshToken(req, payload?.refreshToken);
    if (!token) {
      throw new UnauthorizedException("Недействительный refresh токен");
    }
    const result = await this.authService.refresh(token);
    this.setRefreshCookie(res, result.refreshToken);
    return result;
  }

  @Post("logout")
  async logout(@Req() req: Request, @Body() payload: LogoutDto, @Res({ passthrough: true }) res: Response) {
    const token = this.getRefreshToken(req, payload?.refreshToken);
    if (token) {
      await this.authService.logout({ refreshToken: token });
    }
    this.clearRefreshCookie(res);
    return { message: "Вы вышли из системы" };
  }

  @Post("reset-request")
  resetRequest(@Body() payload: ResetRequestDto) {
    return this.authService.requestReset(payload);
  }

  @Post("reset-confirm")
  resetConfirm(@Body() payload: ResetConfirmDto) {
    return this.authService.confirmReset(payload);
  }

  @Post("change-password")
  changePassword(@Body() payload: ChangePasswordDto) {
    return this.authService.changePassword(payload);
  }

  private setRefreshCookie(res: Response, token?: string) {
    if (!token) return;
    const isProd = process.env.NODE_ENV === "production";
    res.cookie(REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: REFRESH_TTL_SEC * 1000,
      path: "/api"
    });
  }

  private clearRefreshCookie(res: Response) {
    const isProd = process.env.NODE_ENV === "production";
    res.cookie(REFRESH_COOKIE_NAME, "", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 0,
      path: "/api"
    });
  }

  private getRefreshToken(req: Request, bodyToken?: string) {
    if (bodyToken) return bodyToken;
    const header = req.headers.cookie;
    if (!header) return undefined;
    const cookies = header.split(";").reduce<Record<string, string>>((acc, part) => {
      const [key, ...rest] = part.trim().split("=");
      if (!key) return acc;
      acc[key] = decodeURIComponent(rest.join("="));
      return acc;
    }, {});
    return cookies[REFRESH_COOKIE_NAME];
  }
}
