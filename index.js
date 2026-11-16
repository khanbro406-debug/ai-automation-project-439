import { runContacts } from "./src/contacts.js";
import { runFiles } from "./src/files.js";

// Точка входа библиотеки. Разбором командной строки она не занимается, этим занят bin:
// так программу можно позвать из другого кода, и терминал перестаёт быть единственным входом.
const commands = {
  files: runFiles,
  contacts: runContacts,
};

export const commandNames = Object.keys(commands);

export const run = ({ command, directory, out }) => commands[command]({ directory, out });
