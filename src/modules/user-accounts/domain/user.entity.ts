// user.entity.ts
import { randomUUID } from 'crypto';

export class User {
  constructor(
    public id: string,
    public email: string,
    public login: string,
    public passwordHash: string,
    public isEmailConfirmed: boolean = false,
    public confirmationCode: string | null = null,
    public confirmationCodeExpiry: Date | null = null,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public deletedAt: Date | null = null
  ) {}
  
  // Business logic methods
  confirmEmail(code: string): boolean {
    if (this.confirmationCode !== code) {
      return false;
    }
    
    if (this.confirmationCodeExpiry && new Date() > this.confirmationCodeExpiry) {
      return false;
    }
    
    this.isEmailConfirmed = true;
    this.confirmationCode = null;
    this.confirmationCodeExpiry = null;
    return true;
  }
  
  setConfirmationCode(code: string): void {
    this.confirmationCode = code;
    this.confirmationCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  
  makeDeleted(): void {
    this.deletedAt = new Date();
  }
  
  update(updates: Partial<User>): void {
    if (updates.email) this.email = updates.email;
    if (updates.login) this.login = updates.login;
    if (updates.passwordHash) this.passwordHash = updates.passwordHash;
    this.updatedAt = new Date();
  }
  
  // Factory method to replace Mongoose's createInstance
  static createInstance(dto: {
    email: string;
    login: string;
    passwordHash: string;
  }): User {
    return new User(
      '', // Will be set by database with gen_random_uuid()
      dto.email,
      dto.login,
      dto.passwordHash
    );
  }

  // Factory method for registration with confirmation code
  static createInstanceForRegistration(dto: {
    email: string;
    login: string;
    passwordHash: string;
  }): User {
    const user = new User(
      '', // Will be set by database with gen_random_uuid()
      dto.email,
      dto.login,
      dto.passwordHash
    );

    // Generate confirmation code for email verification
    user.setConfirmationCode(randomUUID());

    return user;
  }
  
  // Helper for backward compatibility with MongoDB _id
  get _id() {
    return {
      toString: () => this.id
    };
  }
}

// Type exports for compatibility
export type UserDocument = User;
export type UserModelType = typeof User;