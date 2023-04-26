DOCKER_NODE ?= node:latest
DOCKER_TRANS ?= registry.ubicast.net/devtools/translator:main
DOCKER_RUN ?= docker run \
	--name msjs-builder \
	--workdir /apps \
	--mount type=bind,src=${PWD},dst=/apps \
	--user "$(shell id -u):$(shell id -g)" \
	--rm -it


install:
	${DOCKER_RUN} ${DOCKER_NODE} make install_local

install_local:
	npm install


lint:
	${DOCKER_RUN} ${DOCKER_NODE} make lint_local

lint_local: install_local
	npm run lint


build:
	${DOCKER_RUN} ${DOCKER_NODE} make build_local

build_local: install_local compile_translations_local
	npm run build


extract_translations:
	${DOCKER_RUN} ${DOCKER_TRANS} make extract_translations_local

extract_translations_local:
	sh generate_po.sh de src locales
	sh generate_po.sh es src locales
	sh generate_po.sh fi src locales
	sh generate_po.sh fr src locales
	sh generate_po.sh nl src locales


compile_translations:
	${DOCKER_RUN} ${DOCKER_NODE} make compile_translations_local

compile_translations_local: install_local
	npm run translations_de
	npm run translations_es
	npm run translations_fi
	npm run translations_fr
	npm run translations_nl


translate:
	make extract_translations
	${DOCKER_RUN} ${DOCKER_TRANS} translator \
		--api-key "${DEEPL_API_KEY}" \
		--path locales \
		--source-language EN \
		--target-language DE \
		--target-language ES \
		--target-language FI \
		--target-language FR \
		--target-language NL \
		--mark-language-fuzzy FR \
		--log-level=info ${TRANSLATE_ARGS}
	make extract_translations
	make build


shell:
	${DOCKER_RUN} ${DOCKER_NODE} sh
