install:
	npm install

build: install translate
	npm run build

lint: install
	npm run lint

translate:
	npm run translations_de
	npm run translations_es
	npm run translations_fi
	npm run translations_fr
	npm run translations_nl
