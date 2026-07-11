import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { RedisService } from '../../redis/redis.service';

export interface AuthenticatedUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    let token: string | null = null;

    // 1. Try to read token from cookies
    if (request.cookies && request.cookies.token) {
      token = request.cookies.token;
    }

    // 2. Try to read token from Authorization header
    if (!token && request.headers.authorization && request.headers.authorization.startsWith('Bearer ')) {
      token = request.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedException('Access denied. No token provided.');
    }

    // Check if token is blacklisted in Redis
    const isBlacklisted = await this.redisService.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new UnauthorizedException('Session expired. Please log in again.');
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is missing.');
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as AuthenticatedUser;
      request.user = decoded;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }
}
