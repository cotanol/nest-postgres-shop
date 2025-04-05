import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';

export const RawHeaders = createParamDecorator(
  (data, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const rawHeaders: string[] = req.rawHeaders; // Aquí se obtienen los headers crudos de la petición

    if (!rawHeaders) {
      throw new InternalServerErrorException(
        'Raw Headers not found in request',
      ); // Nosotros intentamos conseguir el user del Guard
    }

    return rawHeaders; // Si no se pasa data, se devuelve el user completo, si se pasa, se devuelve el campo que se pide
  },
);
