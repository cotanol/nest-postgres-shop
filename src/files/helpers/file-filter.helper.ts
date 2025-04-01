// import { ParseFilePipeBuilder } from '@nestjs/common';
import { extname } from 'path';

// export function createFileValidationPipe() {
//   return new ParseFilePipeBuilder()
//     .addFileTypeValidator({
//       fileType: 'application/pdf',
//     })
//     .addMaxSizeValidator({
//       maxSize: 2 * 1024 * 1024, // 2MB
//     })
//     .build();
// }

export const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: Function,
) => {
  if (!file) {
    return cb(null, false);
  }

  const fileExt = extname(file.originalname);
  const allowedExtensions = ['.pdf'];

  if (allowedExtensions.includes(fileExt)) {
    return cb(null, true);
  }

  return cb(null, false);
};
