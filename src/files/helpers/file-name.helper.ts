import { extname } from 'path';
import { v4 as uuid } from 'uuid';

export const fileNamer = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: Function,
) => {
  const fileExt = extname(file.originalname);

  const fileName = `${uuid()}${fileExt}`;

  cb(null, fileName);
};
