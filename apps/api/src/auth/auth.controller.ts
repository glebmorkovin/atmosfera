import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { ResetRequestDto } from "./dto/reset-request.dto";
import { ResetConfirmDto } from "./dto/reset-confirm.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { LogoutDto } from "./dto/logout.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() payload: RegisterDto) {
    return this.authService.register(payload);
  }

  @Post("login")
  login(@Body() payload: LoginDto) {
    return this.authService.login(payload);
  }

  @Post("refresh")
  refresh(@Body() payload: RefreshDto) {
    return this.authService.refresh(payload);
  }

  @Post("logout")
  logout(@Body() payload: LogoutDto) {
    return this.authService.logout(payload);
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
}
