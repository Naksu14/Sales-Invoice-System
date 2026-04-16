import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm'
import { InvoiceName } from '../../invoice-name/entities/invoice-name.entity'

@Index(['invoiceName', 'sheetTabName'], { unique: true })
@Entity({ name: 'spreadsheets' })
export class Spreadsheet {
	@PrimaryGeneratedColumn()
	id!: number

	@ManyToOne(() => InvoiceName, { eager: false, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'invoice_name_id' })
	invoiceName!: InvoiceName

	@Column({ name: 'spreadsheet_id', type: 'varchar', length: 255 })
	spreadsheetUId!: string

	@Column({ name: 'sheet_tab_name', type: 'varchar', length: 200 })
	sheetTabName!: string
}
