import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

// Готовый блок из стартера: всё, что программа узнаёт о файле по его байтам.

// Подписи форматов, которые стоят в начале файла, как бы его ни назвали.
const signatures = [
  [0x25, 0x50, 0x44, 0x46], // %PDF
  [0xff, 0xd8, 0xff], // jpeg
  [0x50, 0x4b], // PK, zip: xlsx, docx
];

const startsWith = (head, signature) => signature.every((byte, index) => head[index] === byte);

// Двоичный файл выдаёт подпись формата или нулевой байт в начале. В текстовых форматах
// нулевого байта не бывает.
export const looksBinary = (filepath) => {
  const head = readFileSync(filepath).subarray(0, 8);

  return signatures.some((signature) => startsWith(head, signature)) || head.includes(0);
};

// Хеш содержимого: у файлов с одинаковыми байтами он одинаковый, как бы они ни назывались.
export const hashFile = (filepath) =>
  createHash("sha256").update(readFileSync(filepath)).digest("hex");
