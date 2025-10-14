import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity('security_devices')
export class SecurityDevice {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ name: 'user_id' })
    userId: string;

    @Column({ name: 'device_id' })
    deviceId: string;

    @Column()
    ip: string;
    
    @Column()
    title: string;

    @Column({ name: 'last_active_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    lastActiveDate: Date;

    @Column({ name: 'expires_at', type: 'timestamp' })
    expiresAt: Date;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt: Date | null;

    // MANY SecurityDevices belong to ONE User
    @ManyToOne(() => User, (user) => user.devices)
    @JoinColumn({ name: 'user_id' }) // This specifies the foreign key column
    user: User;
}