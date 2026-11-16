// Команда files: реестр документов папки. Её логику вы пишете по шагам, начиная с шага
// «Список файлов».
import { getFiles } from "./directory.js";

export const runFiles = ({ directory }) => {
  const files = getFiles(directory);

  console.log(`Файлов найдено: ${files.length}`);
};
