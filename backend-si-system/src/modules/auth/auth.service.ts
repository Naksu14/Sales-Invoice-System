import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { Repository } from 'typeorm';
import { CreateAuthDto } from './dto/create-auth.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { SiUser } from '../si-users/entities/si-user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(SiUser)
    private readonly siUserRepository: Repository<SiUser>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(createAuthDto: CreateAuthDto) {
    const { email, password } = createAuthDto;

    const user = await this.siUserRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user.user_id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    };
    const access_token = await this.jwtService.signAsync(payload);

    return {
      message: 'Login successful',
      access_token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async sendOtpInEMail(sendOtpDto: SendOtpDto) {
    const { email } = sendOtpDto;

    const user = await this.siUserRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const mailHost = this.configService.get<string>('MAIL_HOST');
    const mailPort = Number(this.configService.get<string>('MAIL_PORT') ?? 587);
    const mailUser = this.configService.get<string>('MAIL_USER');
    const mailPass = this.configService.get<string>('MAIL_PASS');
    const mailSecure = this.configService.get<string>('MAIL_SECURE') === 'true';
    const mailFrom =
      this.configService.get<string>('MAIL_FROM') ??
      this.configService.get<string>('MAIL_USER');

    if (!mailHost || !mailUser || !mailPass || !mailFrom) {
      throw new BadRequestException(
        'Mail configuration is incomplete. Please set MAIL_HOST, MAIL_USER, MAIL_PASS, and MAIL_FROM in .env',
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    await this.siUserRepository.update({ user_id: user.user_id }, { verifycode: otp });

    const transporter = nodemailer.createTransport({
      host: mailHost,
      port: mailPort,
      secure: mailSecure,
      auth: {
        user: mailUser,
        pass: mailPass,
      },
    });

    try {
      await transporter.sendMail({
        from: mailFrom,
        to: email,
        subject: 'SI System OTP Code',
        text: `Your OTP code is ${otp}. It expires in 10 minutes.`,
        html: `<p>Your OTP code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
      });
    } catch {
      throw new InternalServerErrorException('Failed to send OTP email');
    }

    return {
      message: 'OTP sent successfully',
      email,
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, otp } = verifyOtpDto;
    const normalizedOtp = Number(otp);

    const user = await this.siUserRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.verifycode !== normalizedOtp) {
      throw new BadRequestException('Invalid OTP');
    }

    await this.siUserRepository.update({ user_id: user.user_id }, { verifycode: null });

    return {
      message: 'OTP verified successfully',
      email,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, new_password, newPassword } = resetPasswordDto;
    const passwordToHash = new_password ?? newPassword;

    if (!passwordToHash) {
      throw new BadRequestException('new_password is required');
    }

    const user = await this.siUserRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await bcrypt.hash(passwordToHash, 10);
    await this.siUserRepository.update({ user_id: user.user_id }, { password: hashedPassword });

    return {
      message: 'Password reset successfully',
      email,
    };
  }
}
