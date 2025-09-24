import { UserDocument } from "src/modules/user-accounts/domain/user.entity";


export class UserExternalDto {
  id: string;
  login: string;
  email: string;
  createdAt: Date;
  firstName: string;
  lastName: string | null;

  static mapToView(user: UserDocument): UserExternalDto {
    const dto = new UserExternalDto();

    dto.email = user.email;
    dto.login = user.login;
    dto.id = user.id.toString();
    dto.createdAt = user.createdAt;

    return dto;
  }
}
