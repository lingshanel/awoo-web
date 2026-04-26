import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import {
  getAdminCsrfCookieName,
  getAdminSessionCookieName,
  hashToken,
  parseCookie,
  timingSafeTokenEqual,
} from 'src/modules/admin/admin-auth';
import { AdminRequest } from 'src/modules/admin/admin-request';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const sessionToken = parseCookie(request.headers.cookie, getAdminSessionCookieName());

    if (!sessionToken) {
      throw new ForbiddenException('관리자 로그인이 필요합니다.');
    }

    const session = await this.prisma.adminSession.findUnique({
      where: { tokenHash: hashToken(sessionToken) },
      include: {
        user: true,
      },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      !session.user.isActive
    ) {
      throw new ForbiddenException('관리자 세션이 유효하지 않습니다.');
    }

    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      const csrfCookie = parseCookie(request.headers.cookie, getAdminCsrfCookieName());
      const csrfHeader = request.headers['x-csrf-token'];

      if (
        !csrfCookie ||
        typeof csrfHeader !== 'string' ||
        hashToken(csrfCookie) !== session.csrfTokenHash ||
        !timingSafeTokenEqual(csrfCookie, csrfHeader)
      ) {
        throw new ForbiddenException('관리자 요청 보안 토큰이 올바르지 않습니다.');
      }
    }

    (request as AdminRequest).adminUser = {
      id: session.user.id,
      username: session.user.username,
      role: session.user.role,
      sessionId: session.id,
    };

    return true;
  }
}
