import { Injectable } from '@nestjs/common';
import { User } from '../domain/user.entity';
import { UsersRepository } from '../infrastructure/users.repository';

@Injectable()
export class UsersExternalService {
  constructor(
    private usersRepository: UsersRepository,
  ) {}

  async makeUserAsSpammer(userId: string) {
    const user = await this.usersRepository.getByIdOrNotFoundFail(userId);

    // user.makeSpammer();

    await this.usersRepository.save(user);
  }
}
