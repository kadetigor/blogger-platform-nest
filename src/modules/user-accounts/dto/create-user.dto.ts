export class CreateUserDomainDto {
    login: string;
    password: string;
    email: string;
}

export class CreateUserDto {
    login: string;
    password: string;
    email: string;
}

// TODO: decise what to keep and what to delete
export class UpdateUserDto {
  email: string;
}