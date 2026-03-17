import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, In } from 'typeorm';
import { CreateSheetColumnDto } from './dto/create-sheet-column.dto';
import { UpdateSheetColumnDto } from './dto/update-sheet-column.dto';
import { SheetColumn } from './entities/sheet-column.entity';
import { Spreadsheet } from '../spreadsheets/entities/spreadsheet.entity';

@Injectable()
export class SheetColumnService {
  constructor(
    @InjectRepository(SheetColumn)
    private readonly sheetColumnRepo: Repository<SheetColumn>,
    @InjectRepository(Spreadsheet)
    private readonly spreadsheetRepo: Repository<Spreadsheet>,
  ) {}

  async create(createSheetColumnDto: CreateSheetColumnDto) {
    const { spreadsheetId, columnName, dbFieldName, dataType, columnOrder, isRequired } = createSheetColumnDto

    const spreadsheet = await this.spreadsheetRepo.findOne({ where: { id: spreadsheetId } })
    if (!spreadsheet) throw new NotFoundException('Spreadsheet not found')

    // determine final columnOrder: use provided if unique, otherwise assign next available
    let finalOrder: number
    if (columnOrder === undefined || columnOrder === null) {
      const raw = await this.sheetColumnRepo
        .createQueryBuilder('sc')
        .select('MAX(sc.columnOrder)', 'max')
        .where('sc.spreadsheet = :id', { id: spreadsheetId })
        .getRawOne()
      const max = raw?.max == null ? -1 : Number(raw.max)
      finalOrder = max + 1
    } else {
      finalOrder = columnOrder
      const exists = await this.sheetColumnRepo.findOne({ where: { spreadsheet: { id: spreadsheetId }, columnOrder: finalOrder } })
      if (exists) throw new ConflictException('columnOrder already exists for this spreadsheet')
    }

    const sheetColumn = this.sheetColumnRepo.create({
      spreadsheet,
      columnName,
      dbFieldName,
      dataType: dataType ?? 'text',
      columnOrder: finalOrder,
      isRequired: !!isRequired,
    })

    return this.sheetColumnRepo.save(sheetColumn)
  }

  /**
   * Insert multiple sheet columns in a single transaction.
   * Ensures columnOrder uniqueness per spreadsheet across existing rows and the bulk payload.
   */
  async createBulk(items: CreateSheetColumnDto[]) {
    if (!Array.isArray(items) || items.length === 0) throw new BadRequestException('Empty payload')

    const spreadsheetIds = Array.from(new Set(items.map((i) => i.spreadsheetId)))

    // load spreadsheets and ensure they exist
    const spreadsheets = await this.spreadsheetRepo.findBy({ id: In(spreadsheetIds) })
    const spreadsheetMap = new Map<number, any>()
    for (const s of spreadsheets) spreadsheetMap.set(s.id, s)
    for (const id of spreadsheetIds) {
      if (!spreadsheetMap.has(id)) throw new NotFoundException(`Spreadsheet not found: ${id}`)
    }

    return this.sheetColumnRepo.manager.transaction(async (manager) => {
      const createdEntities: SheetColumn[] = []

      // prepare per-spreadsheet state
      const state = new Map<number, { used: Set<number>; next: number }>()

      for (const sid of spreadsheetIds) {
        const raw = await manager
          .createQueryBuilder(SheetColumn, 'sc')
          .select('sc.columnOrder', 'col')
          .where('sc.spreadsheet = :id', { id: sid })
          .getRawMany()
        const used = new Set<number>(raw.map((r) => Number(r.col)))
        const next = used.size === 0 ? 0 : Math.max(...Array.from(used)) + 1
        state.set(sid, { used, next })
      }

      for (const item of items) {
        const { spreadsheetId, columnName, dbFieldName, dataType, columnOrder, isRequired } = item
        const spreadsheet = spreadsheetMap.get(spreadsheetId)
        if (!spreadsheet) throw new NotFoundException(`Spreadsheet not found: ${spreadsheetId}`)

        const st = state.get(spreadsheetId)
        if (!st) throw new BadRequestException('internal error')

        let finalOrder: number
        if (columnOrder === undefined || columnOrder === null) {
          finalOrder = st.next
          st.used.add(finalOrder)
          st.next = finalOrder + 1
        } else {
          if (st.used.has(columnOrder)) throw new ConflictException(`columnOrder ${columnOrder} already exists for spreadsheet ${spreadsheetId}`)
          finalOrder = columnOrder
          st.used.add(finalOrder)
          if (finalOrder >= st.next) st.next = finalOrder + 1
        }

        const entity = this.sheetColumnRepo.create({
          spreadsheet,
          columnName,
          dbFieldName,
          dataType: dataType ?? 'text',
          columnOrder: finalOrder,
          isRequired: !!isRequired,
        })
        createdEntities.push(entity)
      }

      return manager.save(SheetColumn, createdEntities)
    })
  }

  findAll() {
    return this.sheetColumnRepo.find({ relations: ['spreadsheet'], order: { columnOrder: 'ASC' } })
  }

  /**
   * Generic find that accepts plain TypeORM-like options or legacy keys
   * Example: { where: { id_sheets: 1 }, order: { column_order: 'ASC' } }
   */
  findTable(options?: any) {
    const findOptions: FindManyOptions<SheetColumn> = {}

    if (options?.where?.id_sheets) {
      findOptions.where = { spreadsheet: { id: options.where.id_sheets } } as any
    } else if (options?.where) {
      findOptions.where = options.where
    }

    if (options?.order) {
      const order: any = {}
      for (const [k, v] of Object.entries(options.order)) {
        const mappedKey = k === 'column_order' ? 'columnOrder' : k
        order[mappedKey] = (v as string).toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
      }
      findOptions.order = order
    }

    return this.sheetColumnRepo.find({ ...findOptions, relations: ['spreadsheet'] })
  }

  async findOne(id: number) {
    const sheetColumn = await this.sheetColumnRepo.findOne({ where: { id }, relations: ['spreadsheet'] })
    if (!sheetColumn) throw new NotFoundException('SheetColumn not found')
    return sheetColumn
  }

  async update(id: number, updateSheetColumnDto: UpdateSheetColumnDto) {
    const sheetColumn = await this.sheetColumnRepo.findOne({ where: { id }, relations: ['spreadsheet'] })
    if (!sheetColumn) throw new NotFoundException('SheetColumn not found')

    if (updateSheetColumnDto.spreadsheetId) {
      const spreadsheet = await this.spreadsheetRepo.findOne({ where: { id: updateSheetColumnDto.spreadsheetId } })
      if (!spreadsheet) throw new NotFoundException('Spreadsheet not found')
      sheetColumn.spreadsheet = spreadsheet
    }

    // Ensure columnOrder uniqueness within spreadsheet if provided
    const targetSpreadsheetId = updateSheetColumnDto.spreadsheetId ?? sheetColumn.spreadsheet?.id
    if (updateSheetColumnDto.columnOrder !== undefined && targetSpreadsheetId != null) {
      const conflict = await this.sheetColumnRepo.findOne({ where: { spreadsheet: { id: targetSpreadsheetId }, columnOrder: updateSheetColumnDto.columnOrder } })
      if (conflict && conflict.id !== id) throw new ConflictException('columnOrder already exists for this spreadsheet')
    }

    if (updateSheetColumnDto.columnName !== undefined) sheetColumn.columnName = updateSheetColumnDto.columnName
    if (updateSheetColumnDto.dbFieldName !== undefined) sheetColumn.dbFieldName = updateSheetColumnDto.dbFieldName
    if (updateSheetColumnDto.dataType !== undefined) sheetColumn.dataType = updateSheetColumnDto.dataType
    if (updateSheetColumnDto.columnOrder !== undefined) sheetColumn.columnOrder = updateSheetColumnDto.columnOrder
    if (updateSheetColumnDto.isRequired !== undefined) sheetColumn.isRequired = updateSheetColumnDto.isRequired

    return this.sheetColumnRepo.save(sheetColumn)
  }

  async remove(id: number) {
    const res = await this.sheetColumnRepo.delete(id)
    if (res.affected === 0) throw new NotFoundException('SheetColumn not found')
    return { deleted: true }
  }
}
