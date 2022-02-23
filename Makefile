install:
	npm install

build: install compile_translations
	npm run build

lint: install
	npm run lint

generate_translations:
	bash generate_po.sh de src locales
	bash generate_po.sh es src locales
	bash generate_po.sh fi src locales
	bash generate_po.sh fr src locales
	bash generate_po.sh nl src locales

compile_translations: install
	npm run translations_de
	npm run translations_es
	npm run translations_fi
	npm run translations_fr
	npm run translations_nl
