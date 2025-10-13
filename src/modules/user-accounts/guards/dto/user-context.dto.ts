/**
 * user object for the jwt token and for transfer from the request object
 */
export class UserContextDto {
  userId?: string;  // from JWT payload
  id?: string;       // alias for userId (for compatibility)
  login?: string;
  email?: string;
  deviceId?: string;
  tokenId?: string;
}

export type Nullable<T> = { [P in keyof T]: T[P] | null };
