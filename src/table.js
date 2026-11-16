import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// Готовый блок из стартера: чтение табличных файлов и запись csv, общее для обеих команд.

const splitLines = (content) =>
  content
    .split("\n")
    .map((line) => (line.endsWith("\r") ? line.slice(0, -1) : line))
    .filter((line) => line !== "");

// Часть выгрузок пришла из Excel: с BOM в начале и с точкой с запятой вместо запятой.
export const readTable = (filepath) => {
  const content = readFileSync(filepath, "utf8");
  const text = content.startsWith("﻿") ? content.slice(1) : content;

  if (path.extname(filepath).toLowerCase() === ".json") {
    const records = JSON.parse(text);
    const [first] = records;
    const columns = first ? Object.keys(first) : [];

    return {
      columns,
      rows: records.map((record) => columns.map((column) => String(record[column] ?? ""))),
    };
  }

  const lines = splitLines(text);
  const [header = ""] = lines;
  const separator = header.split(";").length > header.split(",").length ? ";" : ",";

  return {
    columns: header.split(separator).map((column) => column.trim()),
    rows: lines.slice(1).map((line) => line.split(separator)),
  };
};

const toCsvValue = (value) => {
  const text = String(value);

  return text.includes(",") || text.includes('"') || text.includes("\n")
    ? `"${text.split('"').join('""')}"`
    : text;
};

export const writeCsv = (out, filename, columns, rows) => {
  const target = path.join(out, filename);
  const lines = [columns, ...rows].map((values) => values.map(toCsvValue).join(","));

  mkdirSync(out, { recursive: true });
  // Текстовый файл заканчивается переводом строки: иначе последняя запись склеивается
  // с тем, что допишут следом, а `wc -l` считает на строку меньше.
  writeFileSync(target, `${lines.join("\n")}\n`);

  return target;
};
