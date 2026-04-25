import { mkdirSync } from 'fs';
import { join } from 'path';

export function getUploadDir() {
  const dirName = process.env.UPLOAD_DIR || 'uploads';
  return join(process.cwd(), dirName);
}

export function getThumbnailDir() {
  return join(getUploadDir(), 'thumbs');
}

export function ensureUploadDir() {
  const dir = getUploadDir();
  mkdirSync(dir, { recursive: true });
  mkdirSync(getThumbnailDir(), { recursive: true });
  return dir;
}
