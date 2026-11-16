import fs from "node:fs";
import path from "node:path";

const systemFiles = [".ds_store", "thumbs.db", "desktop.ini"];
const allowedDocumentExtensions = [
  ".csv",
  ".json",
  ".txt",
  ".md",
  ".pdf",
  ".jpg",
  ".jpeg",
  ".xlsx",
];

const getFileType = (file) => {
  const extension = file.extension.toLowerCase();

  if ([".csv", ".json"].includes(extension)) {
    return "tabular";
  }

  if ([".txt", ".md", ""].includes(extension)) {
    return "text";
  }

  return "unparsable";
};

const getFileStatus = (file) => {
  const name = file.name.toLowerCase();
  const extension = file.extension.toLowerCase();

  if (systemFiles.includes(name)) {
    return "post";
  }

  if (file.size === 0) {
    return "post";
  }

  if (extension && !allowedDocumentExtensions.includes(extension)) {
    return "post";
  }

  if (getFileType(file) === "unparsable") {
    return "manual";
  }

  return "document";
};

export const getFiles = (directory) => {
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const filePath = path.join(directory, entry.name);
      const stats = fs.statSync(filePath);
      const file = {
        path: filePath,
        name: entry.name,
        extension: path.extname(entry.name),
        size: stats.size,
      };

      return {
        ...file,
        type: getFileType(file),
        status: getFileStatus(file),
      };
    });
};