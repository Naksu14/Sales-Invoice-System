import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SiUser } from './entities/si-user.entity';
import { CreateSiUserDto } from './dto/create-si-user.dto';
import { UpdateSiUserDto } from './dto/update-si-user.dto';

@Injectable()
export class SiUsersService {

  constructor(
    @InjectRepository(SiUser)
    private siUserRepository: Repository<SiUser>,
  ) {}

  async create(createSiUserDto: CreateSiUserDto) {
    const { email, password } = createSiUserDto;

    // Check if user with this email already exists
    const existingUser = await this.siUserRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const newUser = this.siUserRepository.create({
      ...createSiUserDto,
      password: hashedPassword,
    });

    return this.siUserRepository.save(newUser);
  }
  

  findAll() {
    return this.siUserRepository.find();
  }

  findOne(id: number) {
    return this.siUserRepository.findOne({ where: { user_id: id } });
  }

  update(id: number, updateSiUserDto: UpdateSiUserDto) {
    if (updateSiUserDto.password) {
      updateSiUserDto.password = bcrypt.hashSync(updateSiUserDto.password, 10);
    }
    this.siUserRepository.update(id, updateSiUserDto);
    return this.siUserRepository.findOne({ where: { user_id: id } });

  }

  remove(id: number) {
    return this.siUserRepository.delete({ user_id: id });
  }
}
