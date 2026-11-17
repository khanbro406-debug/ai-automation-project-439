// Команда files: реестр документов папки. Её логику вы пишете по шагам, начиная с шага
// «Список файлов».
import path from "node:path";

import { getDuplicateGroups, getFiles } from "./directory.js";
import { readTable, writeCsv, writeReports } from "./table.js";

const relativeFilePath = (directory, filePath) =>
  path.relative(path.resolve(directory), path.resolve(filePath)).replace(/\\/g, "/");

const registryHeaders = [
  "путь",
  "имя",
  "тип",
  "размер",
  "хеш",
  "статус",
  "основная копия",
  "строк",
  "колонки",
];

const fileTypes = {
  tabular: "табличный документ",
  text: "текстовый документ",
  unparsable: "непарсимый",
};

const fileStatuses = {
  document: "документ",
  manual: "требует ручного разбора",
  post: "постороннее",
};

export const runFiles = ({ directory, out = "./out" }) => {
  const files = getFiles(directory);
  const { files: groupedFiles, duplicates, groups } = getDuplicateGroups(files);
  const tabular = groupedFiles.filter((file) => file.type === "tabular").length;
  const text = groupedFiles.filter((file) => file.type === "text").length;
  const unparsable = groupedFiles.filter((file) => file.type === "unparsable").length;
  const documents = groupedFiles.filter((file) => file.status === "document").length;
  const manual = groupedFiles.filter((file) => file.status === "manual").length;
  const post = groupedFiles.filter((file) => file.status === "post").length;
  const registryRows = groupedFiles.map((file) => {
    const table = file.type === "tabular" && file.status === "document"
      ? readTable(file.path)
      : null;

    return [
      file.path.replace(/\\/g, "/"),
      file.name,
      fileTypes[file.type],
      file.size,
      file.hash,
      fileStatuses[file.status],
      file.duplicateOf?.replace(/\\/g, "/") ?? "",
      table ? table.rows.length : "",
      table ? table.columns.join("; ") : "",
    ];
  });
  const registryPath = writeCsv(out, "registry.csv", registryHeaders, registryRows);
  const manualFiles = groupedFiles
    .filter((file) => file.status === "manual")
    .map((file) => relativeFilePath(directory, file.path));
  const unrelatedFiles = groupedFiles
    .filter((file) => file.status === "post")
    .map((file) => relativeFilePath(directory, file.path));
  const duplicateGroups = new Map();

  groupedFiles
    .filter((file) => file.duplicateOf)
    .forEach((file) => {
      const mainPath = file.duplicateOf;
      const group = duplicateGroups.get(mainPath) ?? {
        files: [relativeFilePath(directory, mainPath)],
        extraSize: 0,
      };

      group.files.push(relativeFilePath(directory, file.path));
      group.extraSize += file.size;
      duplicateGroups.set(mainPath, group);
    });

  const reportData = {
    totalFiles: groupedFiles.length,
    types: { tabular, text, unparsable },
    statuses: { documents, manual: manualFiles.length, unrelated: unrelatedFiles.length },
    duplicates: {
      count: duplicates,
      groups: [...duplicateGroups.values()],
    },
    filesForManualReview: manualFiles,
    unrelatedFiles,
  };
  const duplicateLines = reportData.duplicates.groups.flatMap((group) => [
    ...group.files.map((filePath) => `  ${filePath}`),
    `  Лишний размер: ${group.extraSize} байт`,
  ]);
  const reportText = [
    `Файлов найдено: ${groupedFiles.length}`,
    `Табличных документов: ${tabular}, текстовых: ${text}, непарсимых: ${unparsable}`,
    `Документов: ${documents}, требуют ручного разбора: ${manual}, посторонних: ${post}`,
    `Дубликатов найдено: ${duplicates} в ${reportData.duplicates.groups.length} группах`,
    "",
    `Требуют ручного разбора (${manualFiles.length})`,
    "Программа эти файлы не прочитала, содержимое придётся посмотреть человеку.",
    ...manualFiles.map((filePath) => `  ${filePath}`),
    "",
    `Посторонние файлы (${unrelatedFiles.length})`,
    "Эти файлы не относятся к документам компании; их можно удалить.",
    ...unrelatedFiles.map((filePath) => `  ${filePath}`),
    "",
    `Группы дубликатов (${reportData.duplicates.groups.length})`,
    ...(duplicateLines.length > 0 ? duplicateLines : ["  Нет дубликатов."]),
  ].join("\n");
  const reportPaths = writeReports(out, reportText, reportData);

  console.log(`Файлов найдено: ${groupedFiles.length}`);
  console.log(
    `Табличных документов: ${tabular}, текстовых: ${text}, непарсимых: ${unparsable}`,
  );
  console.log(
    `Документов: ${documents}, требуют ручного разбора: ${manual}, посторонних: ${post}`,
  );
  console.log(`Дубликатов найдено: ${duplicates} в ${groups} группах`);
  console.log(`Реестр: ${registryPath.replace(/\\/g, "/")}`);
  console.log(`Отчёт: ${reportPaths.textPath.replace(/\\/g, "/")}`);
  console.log(`Отчёт для программ: ${reportPaths.jsonPath.replace(/\\/g, "/")}`);

  return groupedFiles.length;
};
