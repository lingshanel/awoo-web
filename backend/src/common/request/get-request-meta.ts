import { Request } from 'express';
import { hashValue } from '../utils/request-identity';
import { RequestMeta } from './request-meta';

export function getRequestIp(request: Request) {
  const forwarded = request.headers['x-forwarded-for'];
  const forwardedIp =
    typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined;

  return (
    forwardedIp ||
    request.ip ||
    request.socket.remoteAddress ||
    'unknown-ip'
  );
}

export function getRequestMeta(request: Request): RequestMeta {
  const ip = getRequestIp(request);

  return {
    ip,
    actorHash: hashValue(ip).slice(0, 32),
  };
}
