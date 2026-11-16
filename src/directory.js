import fs from "node:fs";
import path from "node:path";

import { hashFile } from "./content.js";

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

export const normalizeFileName = (fileName) => {
  const extension = path.extname(fileName);
  const baseName = extension ? fileName.slice(0, -extension.length) : fileName;
  const normalizedBase = baseName.toLowerCase().replace(/^копия\s+/, "");
  const trimmedBase = normalizedBase.replace(/\s+\(\d+\)$/, "");

  return `${trimmedBase}${extension ? extension.toLowerCase() : ""}`;
};

export const getDuplicateGroups = (files) => {
  const filesByPath = new Map(files.map((file) => [file.path, file]));
  const sortedFiles = files
    .map((file) => file.path)
    .sort()
    .map((filePath) => filesByPath.get(filePath));
  const mainByHash = new Map();
  const mainByName = new Map();
  const groupSizes = new Map();
  let duplicatesCount = 0;

  const result = sortedFiles.map((file) => {
    const hash = hashFile(file.path);
    const normalizedName = normalizeFileName(file.name);
    const mainByHashPath = mainByHash.get(hash);
    const mainByNamePath = mainByName.get(normalizedName);
    const mainPath = mainByHashPath ?? mainByNamePath;

    if (mainPath) {
      duplicatesCount += 1;
      groupSizes.set(mainPath, (groupSizes.get(mainPath) ?? 1) + 1);

      return {
        ...file,
        hash,
        normalizedName,
        duplicateOf: mainPath,
        isDuplicate: true,
      };
    }

    mainByHash.set(hash, file.path);
    mainByName.set(normalizedName, file.path);
    groupSizes.set(file.path, 1);

    return {
      ...file,
      hash,
      normalizedName,
      duplicateOf: null,
      isDuplicate: false,
    };
  });

  const groups = [...groupSizes.entries()].filter(([, size]) => size > 1).length;

  return { files: result, duplicates: duplicatesCount, groups };
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