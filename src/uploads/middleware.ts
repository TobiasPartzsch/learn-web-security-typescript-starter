import multer from "multer";

export function createUploadMiddleware(fieldName: string, maxBytes: number) {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxBytes,
      files: 1,
    }
  }).single(fieldName);
}
