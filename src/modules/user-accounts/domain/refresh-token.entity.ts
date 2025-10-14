import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity";

@Entity('refresh_token_sessions')
export class RefreshTokenSession {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'token_id' })
  tokenId: string;

  @Column({ name: 'device_id' })
  deviceId: string;

  @Column({ name: 'is_revoked', default: false })
  isRevoked: boolean;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date | null

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null

  // MANY Sessions belong to ONE User
    @ManyToOne(() => User, (user) => user.session)
    @JoinColumn({ name: 'user_id' }) // This specifies the foreign key column
    user: User;

}