import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from '../entities/user.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    configService: ConfigService,
  ) {
    super({
      secretOrKey: configService.get<string>('JWT_SECRET')!,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const { id } = payload;

    const user = await this.userRepository.findOne({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
        roles: true,
      },
    });

    if (!user) throw new UnauthorizedException('Token not valid');

    if (!user.isActive) throw new UnauthorizedException('User inactive');

    return user; // Retornamos el usuario sin la contraseña
  }

  // constructor(private readonly authService: AuthService) {
  //   super({
  //     jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  //     ignoreExpiration: false,
  //     secretOrKey: process.env.JWT_SECRET,
  //   });
  // }

  // async validate(payload: JwtPayload): Promise<User> {
  //   const user = await this.authService.validateUser(payload);
  //   if (!user) throw new UnauthorizedException('Token not valid');
  //   return user;
  // }
}
