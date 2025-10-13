import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class SecurityDevice {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    user_id: string;

    @Column()
    device_id: string;

    @Column()
    ip: string;
    
    @Column()
    title: string;

    @Column({ default: Date.now })
    last_active_date: Date;

    @Column()
    expires_at: Date;

    @Column({ nullable: true })
    deleted_at: Date | null;
}