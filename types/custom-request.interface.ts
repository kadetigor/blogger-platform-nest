import { Request } from 'express';

export interface RequestWithUser extends Request {
  user?: {
    id: string;
    login: string;
    email: string;
  };
}// This makes it a module