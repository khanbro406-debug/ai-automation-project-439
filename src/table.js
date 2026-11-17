import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse as parseCsv } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

// Готовый блок из стартера: чтение табличных файлов и запись csv, общее для обеих команд.

// Часть выгрузок пришла из Excel: с BOM в начале и с точкой с запятой вместо запятой.
export const parseTable = (content, extension) => {
  if (extension.toLowerCase() === ".json") {
    const records = JSON.parse(content);

    if (!Array.isArray(records)) {
      throw new TypeError("JSON table must contain an array of objects");
    }

    const columns = records.length > 0 ? Object.keys(records[0]) : [];

    return {
      columns,
      rows: records.map((record) =>
        columns.map((column) => String(record[column] ?? "")),
      ),
    };
  }

  if (extension.toLowerCase() === ".csv") {
    const records = parseCsv(content, {
      bom: true,
      delimiter: [",", ";"],
      skip_empty_lines: true,
      relax_column_count: true,
    });

    return {
      columns: records[0] ?? [],
      rows: records.slice(1),
    };
  }

  throw new TypeError(`Unsupported table extension: ${extension}`);
};

export const readTable = (filepath) =>
  parseTable(readFileSync(filepath, "utf8"), path.extname(filepath));

export const writeCsv = (out, filename, columns, rows) => {
  const target = path.join(out, filename);

  mkdirSync(out, { recursive: true });
  writeFileSync(target, stringify([columns, ...rows]));

  return target;
};

export const writeReports = (out, text, data) => {
  const textPath = path.join(out, "report.txt");
  const jsonPath = path.join(out, "report.json");

  mkdirSync(out, { recursive: true });
  writeFileSync(textPath, `${text}\n`, "utf8");
  writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");

  return { textPath, jsonPath };
};
