// Команда files: реестр документов папки. Её логику вы пишете по шагам, начиная с шага
// «Список файлов».
import { getFiles } from "./directory.js";

export const runFiles = ({ directory }) => {
  const files = getFiles(directory);
  const tabular = files.filter((file) => file.type === "tabular").length;
  const text = files.filter((file) => file.type === "text").length;
  const unparsable = files.filter((file) => file.type === "unparsable").length;
  const documents = files.filter((file) => file.status === "document").length;
  const manual = files.filter((file) => file.status === "manual").length;
  const post = files.filter((file) => file.status === "post").length;

  console.log(`Файлов найдено: ${files.length}`);
  console.log(
    `Табличных документов: ${tabular}, текстовых: ${text}, непарсимых: ${unparsable}`,
  );
  console.log(
    `Документов: ${documents}, требуют ручного разбора: ${manual}, посторонних: ${post}`,
  );

  return files.length;
};
