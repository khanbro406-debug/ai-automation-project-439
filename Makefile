SET = company-files

test:
	@test "$$(find $(SET) -type f | wc -l)" = 40 || { echo "в наборе не 40 файлов"; exit 1; }
	@find $(SET) -type f | while read -r f; do \
		case "$$(file -b --mime-encoding "$$f")" in utf-8|us-ascii|binary) ;; \
		*) echo "не UTF-8: $$f"; exit 1;; esac; done
	@test "$$(head -c3 $(SET)/kontakty-vebinar.csv | od -An -tx1 | tr -d ' \n')" = efbbbf || { echo "пропал BOM"; exit 1; }
	@head -1 $(SET)/kontakty-crm.csv | grep -q ';' || { echo "пропал разделитель ;"; exit 1; }
	@grep -q 'не указан' $(SET)/kontakty-crm.csv || { echo "пропал битый телефон"; exit 1; }
	@grep -q 'Пустой Контакт' $(SET)/kontakty-vebinar.csv || { echo "пропала запись без телефона и почты"; exit 1; }
	@cmp -s $(SET)/scheta-01-2025.csv "$(SET)/Копия scheta-01-2025.csv" || { echo "пропал побайтовый дубликат"; exit 1; }
	@for f in .DS_Store Thumbs.db rekvizity pustaya-vygruzka.csv "scheta-01-2025 (1).csv" SCHETA-02-2025.CSV "Архив/kontakty-rassylka.csv"; do \
		test -e "$(SET)/$$f" || { echo "пропал $$f"; exit 1; }; done
	@test ! -s $(SET)/pustaya-vygruzka.csv || { echo "пустой файл перестал быть пустым"; exit 1; }
	@echo "набор цел: 40 файлов, ловушки на месте"

install:
	 npm ci
lint:
	 npm run lint
