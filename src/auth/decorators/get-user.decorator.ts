import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;

    if (!user) {
      throw new InternalServerErrorException('User not found in request'); // Nosotros intentamos conseguir el user del Guard
    }

    return !data ? user : user[data]; // Si no se pasa data, se devuelve el user completo, si se pasa, se devuelve el campo que se pide
  },
);
