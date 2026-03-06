import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum SiUserRole {
	ADMIN = 'admin',
	ENCODER = 'encoder',
}

@Entity('user_si')
export class SiUser {
	@PrimaryGeneratedColumn({ name: 'user_id', type: 'int' })
	user_id: number;

	@Column({ name: 'full_name', type: 'varchar', length: 255 })
	full_name: string;

	@Column({ type: 'varchar', length: 255, unique: true })
	email: string;

	@Column({ type: 'varchar', length: 255 })
	password: string;

	@Column({ type: 'enum', enum: SiUserRole })
	role: SiUserRole;

	@Column({ type: 'int', nullable: true })
	verifycode: number | null;

	@CreateDateColumn({ name: 'created_at', type: 'timestamp' })
	created_at: Date;
}
