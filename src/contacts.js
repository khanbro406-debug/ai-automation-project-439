import { getFiles } from "./directory.js";
import { contactColumnMap } from "./contact-columns.js";
import { readTable, writeCsv, writeReports } from "./table.js";

const INVALID_VALUES = new Set([
  "",
  "-",
  "—",
  "n/a",
  "null",
]);

const normalizeColumn = (column) => column.trim().toLowerCase();

const normalizeText = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value).trim();

  if (INVALID_VALUES.has(text.toLowerCase())) {
    return "";
  }

  return text.replace(/\s+/g, " ");
};

const normalizeName = (value) => {
  const text = normalizeText(value);

  if (!text) {
    return "";
  }

  return text
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ");
};

const normalizeEmail = (value) => {
  const text = normalizeText(value);

  if (!text) {
    return "";
  }

  const normalized = text.toLowerCase();
  const parts = normalized.split("@");

  return parts.length === 2 && parts.every((part) => part.length > 0) ? normalized : "";
};

const normalizePhone = (value) => {
  const text = normalizeText(value);

  if (!text) {
    return "";
  }

  let digits = text.replace(/\D/g, "");

  if (digits.length === 10) {
    digits = `7${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("8")) {
    digits = `7${digits.slice(1)}`;
  }

  if (digits.length !== 11 || !digits.startsWith("7")) {
    return "";
  }

  return digits;
};

const getContactField = (column) => {
  const normalizedColumn = normalizeColumn(column);

  return Object.entries(contactColumnMap).find(([, aliases]) =>
    aliases.includes(normalizedColumn),
  )?.[0];
};

const normalizeContact = (contact) => {
  const normalized = {
    имя: normalizeName(contact.имя),
    телефон: normalizePhone(contact.телефон),
    почта: normalizeEmail(contact.почта),
    источник: contact.источник,
  };

  let rejected = 0;

  ["имя", "телефон", "почта"].forEach((field) => {
    const original = String(contact[field] ?? "").trim();
    const isPlaceholder = INVALID_VALUES.has(original.toLowerCase());
    const hasInvalidValue = !isPlaceholder && !normalized[field];

    if (hasInvalidValue) {
      rejected += 1;
    }
  });

  const isUsefulRecord = normalized.имя || normalized.телефон || normalized.почта;

  return { contact: normalized, rejected, isUsefulRecord };
};

export const runContacts = ({ directory, out = "./out" }) => {
  const filesByPath = new Map(getFiles(directory).map((file) => [file.path, file]));
  const tableFiles = [...filesByPath.keys()]
    .sort()
    .map((filePath) => filesByPath.get(filePath))
    .filter((file) => file.type === "tabular" && file.status === "document" && file.size > 0);
  const sources = [];
  const contacts = [];
  const unmatchedColumns = [];
  let rejectedValues = 0;
  let recordsWithoutContactDetails = 0;

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

      const normalizedContact = normalizeContact(contact);
      rejectedValues += normalizedContact.rejected;

      if (!normalizedContact.contact.телефон && !normalizedContact.contact.почта) {
        recordsWithoutContactDetails += 1;
        return;
      }

      contacts.push(normalizedContact.contact);
    });
  });

  sources.forEach(({ name, records }) => {
    console.log(`${name}: записей ${records}`);
  });

  const recordCount = sources.reduce((total, source) => total + source.records, 0);
  console.log(`Выгрузок прочитано: ${sources.length}, записей: ${recordCount}`);
  console.log(`Колонки без соответствия: ${unmatchedColumns.join(", ")}`);

  const contactsByKey = new Map();

  contacts.forEach((contact) => {
    const key = contact.телефон
      ? `phone:${contact.телефон}`
      : `email:${contact.почта}`;
    const existing = contactsByKey.get(key);

    if (!existing) {
      contactsByKey.set(key, {
        имя: contact.имя,
        телефон: contact.телефон,
        почта: contact.почта,
        источники: [contact.источник],
      });
      return;
    }

    existing.имя ||= contact.имя;
    existing.телефон ||= contact.телефон;
    existing.почта ||= contact.почта;

    if (!existing.источники.includes(contact.источник)) {
      existing.источники.push(contact.источник);
    }
  });

  const uniqueContacts = [...contactsByKey.values()];
  const contactRows = uniqueContacts.map((contact) => [
    contact.имя,
    contact.телефон,
    contact.почта,
    contact.источники.join("; "),
  ]);
  const tablePath = writeCsv(
    out,
    "contacts.csv",
    ["имя", "телефон", "почта", "источники"],
    contactRows,
  );
  const reportData = {
    exports: sources,
    recordsRead: recordCount,
    uniqueContacts: uniqueContacts.length,
    rejectedValues,
    recordsWithoutContactDetails,
  };
  const reportText = [
    `Из ${sources.length} выгрузок прочитано ${recordCount} записей, после склейки осталось ${uniqueContacts.length} контактов.`,
    "",
    ...sources.map(({ name, records }) => `  ${name}: записей ${records}`),
    `Отбраковано значений: ${rejectedValues}, записей без телефона и почты: ${recordsWithoutContactDetails}`,
  ].join("\n");
  const reportPaths = writeReports(out, reportText, reportData);

  console.log(
    `Отбраковано значений: ${rejectedValues}, записей без телефона и почты: ${recordsWithoutContactDetails}`,
  );
  console.log(`Уникальных контактов: ${uniqueContacts.length}`);
  console.log(`Таблица: ${tablePath.replace(/\\/g, "/")}`);
  console.log(`Отчёт: ${reportPaths.textPath.replace(/\\/g, "/")}`);
  console.log(`Отчёт для программ: ${reportPaths.jsonPath.replace(/\\/g, "/")}`);

  return uniqueContacts;
};
