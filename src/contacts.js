import { getFiles } from "./directory.js";
import { contactColumnMap } from "./contact-columns.js";
import { readTable } from "./table.js";

const normalizeColumn = (column) => column.trim().toLowerCase();

const getContactField = (column) => {
  const normalizedColumn = normalizeColumn(column);

  return Object.entries(contactColumnMap).find(([, aliases]) =>
    aliases.includes(normalizedColumn),
  )?.[0];
};

export const runContacts = ({ directory }) => {
  const tableFiles = getFiles(directory)
    .filter((file) => file.type === "tabular" && file.status === "document" && file.size > 0)
    .sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0));
  const sources = [];
  const contacts = [];
  const unmatchedColumns = [];

  tableFiles.forEach((file) => {
    const { columns, rows } = readTable(file.path);
    const fieldsByColumn = columns.map((column) => getContactField(column));
    const isContactExport = fieldsByColumn.some((field) =>
      field === "телефон" || field === "почта",
    );

    if (!isContactExport) {
      return;
    }

    sources.push({ name: file.name, records: rows.length });
    columns.forEach((column, index) => {
      if (!fieldsByColumn[index]) {
        unmatchedColumns.push(`${column} (${file.name})`);
      }
    });

    rows.forEach((row) => {
      const contact = {
        имя: "",
        телефон: "",
        почта: "",
        источник: file.name,
      };

      fieldsByColumn.forEach((field, index) => {
        if (field) {
          contact[field] = row[index] ?? "";
        }
      });

      contacts.push(contact);
    });
  });

  sources.forEach(({ name, records }) => {
    console.log(`${name}: записей ${records}`);
  });

  const recordCount = sources.reduce((total, source) => total + source.records, 0);
  console.log(`Выгрузок прочитано: ${sources.length}, записей: ${recordCount}`);
  console.log(`Колонки без соответствия: ${unmatchedColumns.join(", ")}`);

  return contacts;
};
