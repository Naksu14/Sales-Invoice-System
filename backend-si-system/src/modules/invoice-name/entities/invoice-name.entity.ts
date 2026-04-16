import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'invoice_names' })
export class InvoiceName {
	@PrimaryGeneratedColumn()
	id!: number

	@Column({ name: 'invoice_name', type: 'varchar', length: 200 })
	name!: string

	@Column({ type: 'text', nullable: true })
	description?: string
}
