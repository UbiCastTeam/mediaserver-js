#!/bin/bash
# Script to generate po files for a project using jsu translation functions.
# Usage:
# bash generate-po.sh <lang_code> [<sources_path>] [<locales_path>]
# Arguments:
# lang_code: The 2 letter code of the language to process. For example: "fr".
# sources_path: The source code directory path. Default is "src".
# locales_path: The po files directory. Default is "locales".

# The reference of this file is https://github.com/UbiCastTeam/jsu/translations/generate_po.sh.
# To update this file in repository which is not using jsu as a submodule, run this command:
# curl -sL https://raw.githubusercontent.com/UbiCastTeam/jsu/main/translations/generate_po.sh -o generate_po.sh

set -e
LANG=C.UTF-8

lang_code="$1"
if ( test -z "${lang_code}" ); then
	echo 'The "lang_code" argument must be set to run this script.'
	exit 1
fi

sources_path="$2"
if ( test -z "${sources_path}" ); then
	sources_path=src
fi

locales_path="$3"
if ( test -z "${locales_path}" ); then
	locales_path=locales
fi

echo "Running po generation with arguments:"
echo "sources_path: \"${sources_path}\" locales_path: \"${locales_path}\" lang_code: \"${lang_code}\""

# Generate new empty po file
cd ${sources_path}
find . -iname "*.js" | \
xargs xgettext \
	--no-wrap \
	--from-code=UTF-8 \
	--language=JavaScript \
	--output=tmp.po \
	--keyword='translate:1' \
	--keyword='translateHTML:1' \
	--keyword='translateAttribute:1' \
	--keyword='translate:1,2c' \
	--keyword='translateHTML:1,2c' \
	--keyword='translateAttribute:1,2c' \
	-
cd - >/dev/null

# Merge old and new po files
sed --in-place --expression=s/CHARSET/UTF-8/ ${sources_path}/tmp.po
msgmerge \
	--no-wrap \
	--lang=${lang_code} \
	--update \
	--sort-output \
	--backup=none \
	${locales_path}/${lang_code}.po ${sources_path}/tmp.po
rm ${sources_path}/tmp.po
