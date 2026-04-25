import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AdminKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const adminKey = request.headers['x-admin-key'];
    const expected = process.env.ADMIN_API_KEY;

    if (!expected || adminKey !== expected) {
      throw new ForbiddenException('관리자 키가 올바르지 않습니다.');
    }

    return true;
  }
}
