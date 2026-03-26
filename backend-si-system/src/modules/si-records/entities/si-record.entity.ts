import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Spreadsheet } from '../../spreadsheets/entities/spreadsheet.entity'
import { SiUser } from '../../si-users/entities/si-user.entity'

@Entity({ name: 'si_records' })
export class SiRecord {
	@PrimaryGeneratedColumn()
	id: number

	@ManyToOne(() => Spreadsheet, { eager: false, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'sheet_id' })
	spreadsheet: Spreadsheet

	@ManyToOne(() => SiUser, { eager: true, nullable: true, onDelete: 'SET NULL' })
	@JoinColumn({ name: 'input_user_id' })
	inputUser?: SiUser

	@Column({ type: 'json' })
	data: Record<string, unknown>

	@CreateDateColumn({ name: 'created_at', type: 'timestamp' })
	createdAt: Date
}
