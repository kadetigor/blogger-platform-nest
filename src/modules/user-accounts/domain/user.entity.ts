import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { SecurityDevice } from "./security-devices.entity";
import { RefreshTokenSession } from "./refresh-token.entity";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    email: string

    @Column()
    login: string

    @Column({ name: 'password_hash' })
    passwordHash: string

    @Column({ name: 'is_email_confirmed', default: false })
    isEmailConfirmed: boolean

    @Column({ 
        name: 'confirmation_code', 
        type: 'varchar',  // <-- Add explicit type
        nullable: true,
        default: null 
    })
    confirmationCode: string | null

    @Column({ 
        name: 'confirmation_code_expiry', 
        type: 'timestamp',  // <-- Add explicit type
        nullable: true,
        default: null 
    })
    confirmationCodeExpiry: Date | null

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date | null

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt: Date | null

    // ONE User has MANY SecurityDevices
    @OneToMany(() => SecurityDevice, (device) => device.user)
    devices: SecurityDevice[];

    @OneToMany(() => RefreshTokenSession, (session) => session.user)
    session: RefreshTokenSession[];

    // Business logic methods remain the same
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
}