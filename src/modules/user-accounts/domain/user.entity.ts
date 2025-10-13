import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    email: string

    @Column()
    login: string

    @Column()
    password_hash: string

    @Column({default: false})
    is_email_confirmed: boolean

    @Column({default: null})
    confirmation_code: string | null

    @Column({default: null})
    confirmation_code_expiry: Date | null

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date | null

    @DeleteDateColumn()
    deleted_at: Date | null

  
  // Business logic methods
  confirmEmail(code: string): boolean {
    if (this.confirmation_code !== code) {
      return false;
    }
    
    if (this.confirmation_code_expiry && new Date() > this.confirmation_code_expiry) {
      return false;
    }
    
    this.is_email_confirmed = true;
    this.confirmation_code = null;
    this.confirmation_code_expiry = null;
    return true;
  }
  
  setConfirmationCode(code: string): void {
    this.confirmation_code = code;
    this.confirmation_code_expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  
}

// Type exports for compatibility
// export type UserDocument = User;
// export type UserModelType = typeof User;