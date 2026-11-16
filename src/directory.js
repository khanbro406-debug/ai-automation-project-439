import fs from "node:fs";
import path from "node:path";

export const getFiles = (directory) => {
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const filePath = path.join(directory, entry.name);
      const stats = fs.statSync(filePath);

      return {
        path: filePath,
        name: entry.name,
        extension: path.extname(entry.name),
        size: stats.size,
      };
    });
};