import { Request } from 'express';

export type AdminRequest = Request & {
  adminUser?: {
    id: number;
    username: string;
    role: string;
    sessionId: number;
  };
};
