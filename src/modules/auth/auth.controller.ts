import { Controller, Post, Get, Body, Res, Req, UseGuards, BadRequestException, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { AuthGuard, AuthenticatedUser } from './auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { validatePassword } from '../../shared/validation';
import { RedisService } from '../../redis/redis.service';
import * as jwt from 'jsonwebtoken';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(RedisService) private readonly redisService: RedisService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const passValidation = validatePassword(dto.password);
    if (!passValidation.isValid) {
      throw new BadRequestException(passValidation.message || 'Invalid password format.');
    }

    const user = await this.authService.registerUser(dto);
    return {
      success: true,
      message: 'User registered successfully.',
      data: user,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, token } = await this.authService.loginUser(dto);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax',
    });

    return {
      success: true,
      message: 'Logged in successfully.',
      data: {
        user,
        token,
      },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    let token: string | null = null;
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.decode(token) as any;
        if (decoded && decoded.exp) {
          const ttlSeconds = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
          if (ttlSeconds > 0) {
            await this.redisService.set(`blacklist:${token}`, '1', ttlSeconds);
          }
        }
      } catch (err) {
        // Ignore decoding errors
      }
    }

    res.clearCookie('token');
    return {
      success: true,
      message: 'Logged out successfully.',
    };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    const userProfile = await this.authService.getUserProfile(user.id);
    return {
      success: true,
      data: userProfile,
    };
  }
}
