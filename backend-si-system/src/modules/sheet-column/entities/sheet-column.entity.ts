import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm'
import { Spreadsheet } from '../../spreadsheets/entities/spreadsheet.entity'
@Index(['spreadsheet', 'columnOrder'], { unique: true })
@Entity({ name: 'sheet_columns' })
export class SheetColumn {
	@PrimaryGeneratedColumn()
	id: number

	@ManyToOne(() => Spreadsheet, { eager: false, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'spreadsheet_id' })
	spreadsheet: Spreadsheet

	@Column({ name: 'column_name', type: 'varchar', length: 200 })
	columnName: string

	@Column({ name: 'db_field_name', type: 'varchar', length: 200 })
	dbFieldName: string

	@Column({ name: 'data_type', type: 'varchar', length: 20, default: 'text' })
	dataType: string

	@Column({ name: 'dropdown_options', type: 'text', nullable: true })
	dropdownOptions?: string | null

	@Column({ name: 'column_order', type: 'int' })
	columnOrder: number

	@Column({ name: 'is_required', type: 'boolean', default: false })
	isRequired: boolean
}
