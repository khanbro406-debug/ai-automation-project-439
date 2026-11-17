# Автоматизация разбора файлов


[![hexlet-check](https://github.com/khanbro406-debug/ai-automation-project-439/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/khanbro406-debug/ai-automation-project-439/actions)

Напишите консольную программу на JavaScript, которая разбирает папку с документами
компании: определяет тип каждого файла, находит дубликаты, отделяет полезные документы
от посторонних и собирает реестр. Отдельная команда сводит выгрузки контактов из разных
источников в одну таблицу — приводит колонки к единому виду, нормализует телефоны
и email, убирает повторы.

Учебный проект Хекслета: https://ru.hexlet.io/programs/ai-automation


## Стек

- JavaScript

## Установка

Нужен Node.js 20.1 или новее. Папка `company-files` с данными компании не включена
в репозиторий: возьмите её из материалов задания Хекслета и разместите в корне проекта
рядом с `package.json`.

```powershell
git clone https://github.com/khanbro406-debug/ai-automation-project-439.git
cd ai-automation-project-439
npm install
```

## Использование

Из корня проекта запустите обе команды. По умолчанию результаты сохраняются в `.\out`:

```powershell
node .\bin\file-automation.js files .\company-files --out .\out
node .\bin\file-automation.js contacts .\company-files --out .\out
```

Команда `files` создаёт `registry.csv`, а команда `contacts` — `contacts.csv`.
Каждая команда также записывает собственные `report.txt` и `report.json` в ту же
папку результата. Путь можно изменить параметром `--out`.

---

<details>
<summary>Автоматические тесты Хекслета</summary>

Тесты запускаются на каждый коммит. За запуск отвечает файл `.github/workflows/hexlet-check.yml` — не удаляйте и не переименовывайте ни его, ни репозиторий.

</details>

## О Хекслете

[Хекслет](https://ru.hexlet.io/) — школа программирования: авторские программы обучения с практикой, поддержкой наставников и реальными проектами, которые остаются в резюме. Этот репозиторий — один из таких проектов.
