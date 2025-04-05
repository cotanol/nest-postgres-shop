import { Reflector } from '@nestjs/core';
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { User } from '../entities/user.entity';
import { META_ROLES } from '../decorators/role-protected.decorator';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const validRoles: string[] = this.reflector.get(
      META_ROLES,
      context.getHandler(),
    );

    if (!validRoles) return true;
    if (validRoles.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user as User;

    if (!user) throw new BadRequestException('User not found'); // Si no hay usuario, no se permite el acceso

    for (const role of user.roles) {
      if (validRoles.includes(role)) return true; // Si el rol del usuario está en los roles válidos, se permite el acceso
    }

    throw new ForbiddenException(
      `User ${user.fullName} need a valid role: [${validRoles}]`,
    ); // Si no, se lanza una excepción de acceso denegado
  }
}
