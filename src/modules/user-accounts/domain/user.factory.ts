// user.factory.ts (new file)
export class UserFactory {
  static createInstance(dto: any) {
    return {
      id: null,
      email: dto.email,
      login: dto.login,
      passwordHash: dto.passwordHash,
      isEmailConfirmed: false,
      emailConfirmation: {
        confirmationCode: null,
        expirationDate: null
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      
      // Add these methods that your services might call
      setConfirmationCode(code: string) {
        this.emailConfirmation = {
          confirmationCode: code,
          expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
      },
      
      confirmEmail(code: string) {
        if (this.emailConfirmation.confirmationCode !== code) {
          return false;
        }
        this.isEmailConfirmed = true;
        return true;
      },
      
      makeDeleted() {
        this.deletedAt = new Date();
      },
      
      update(dto: any) {
        Object.assign(this, dto);
      }
    };
  }
}