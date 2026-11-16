// Команда files: реестр документов папки. Её логику вы пишете по шагам, начиная с шага
// «Список файлов».
import { getDuplicateGroups, getFiles } from "./directory.js";

export const runFiles = ({ directory }) => {
  const files = getFiles(directory);
  const { files: groupedFiles, duplicates, groups } = getDuplicateGroups(files);
  const tabular = groupedFiles.filter((file) => file.type === "tabular").length;
  const text = groupedFiles.filter((file) => file.type === "text").length;
  const unparsable = groupedFiles.filter((file) => file.type === "unparsable").length;
  const documents = groupedFiles.filter((file) => file.status === "document").length;
  const manual = groupedFiles.filter((file) => file.status === "manual").length;
  const post = groupedFiles.filter((file) => file.status === "post").length;

  console.log(`Файлов найдено: ${groupedFiles.length}`);
  console.log(
    `Табличных документов: ${tabular}, текстовых: ${text}, непарсимых: ${unparsable}`,
  );
  console.log(
    `Документов: ${documents}, требуют ручного разбора: ${manual}, посторонних: ${post}`,
  );
  console.log(`Дубликатов найдено: ${duplicates} в ${groups} группах`);

  return groupedFiles.length;
};
