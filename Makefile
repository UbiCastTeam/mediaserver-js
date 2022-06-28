SHELL=/bin/bash

DOCKER_NODE ?= docker run \
	--name mediaserver-js-builder \
	--workdir /opt/src \
	--mount type=bind,src=${PWD},dst=/opt/src \
	--user $(shell id -u) \
	--rm \
	node:latest


install_local:
	npm install

install:
	${DOCKER_NODE} make install_local


build_local: install_local compile_translations_local
	npm run build

build:
	${DOCKER_NODE} make build_local


lint_local: install_local
	npm run lint

lint:
	${DOCKER_NODE} make lint_local


generate_translations_local:
	bash generate_po.sh de src locales
	bash generate_po.sh es src locales
	bash generate_po.sh fi src locales
	bash generate_po.sh fr src locales
	bash generate_po.sh nl src locales

generate_translations:
	${DOCKER_NODE} make generate_translations_local


compile_translations_local: install_local
	npm run translations_de
	npm run translations_es
	npm run translations_fi
	npm run translations_fr
	npm run translations_nl

compile_translations:
	${DOCKER_NODE} make compile_translations_local
