// Команда files: реестр документов папки. Её логику вы пишете по шагам, начиная с шага
// «Список файлов».
import { getDuplicateGroups, getFiles } from "./directory.js";
import { readTable, writeCsv } from "./table.js";

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

  console.log(`Файлов найдено: ${groupedFiles.length}`);
  console.log(
    `Табличных документов: ${tabular}, текстовых: ${text}, непарсимых: ${unparsable}`,
  );
  console.log(
    `Документов: ${documents}, требуют ручного разбора: ${manual}, посторонних: ${post}`,
  );
  console.log(`Дубликатов найдено: ${duplicates} в ${groups} группах`);
  console.log(`Реестр: ${registryPath.replace(/\\/g, "/")}`);

  return groupedFiles.length;
};
