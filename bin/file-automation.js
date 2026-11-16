#!/usr/bin/env node

import { program } from "commander";

// Импортируется ровно одна функция нужной сигнатуры, остальное — внутренности программы.
import { run } from "../index.js";

const describe = {
  files: "собрать реестр документов папки",
  contacts: "собрать чистую таблицу контактов",
};

program
  .name("file-automation")
  .description("Автоматизация разбора файлов компании")
  .version("1.0.0")
  // Без этого неизвестная команда даёт одну строку «unknown command», и список команд
  // приходится искать самому.
  .showHelpAfterError();

Object.entries(describe).forEach(([command, description]) => {
  program
    .command(command)
    .description(description)
    .argument("<папка>", "папка с файлами компании")
    .option("-o, --out <папка>", "куда положить результат", "./out")
    .action((directory, options) => run({ command, directory, out: options.out }));
});

// Запуск без аргументов объясняет, как пользоваться программой, и это не ошибка.
if (process.argv.length <= 2) {
  program.outputHelp();
} else {
  program.parse();
}
