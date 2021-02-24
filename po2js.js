#!/usr/bin/env node
/*
 * ps2js: gettext .po to noVNC .js converter
 * Copyright (C) 2018 The noVNC Authors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
/* globals require, process */

const getopt = require('node-getopt');
const fs = require('fs');
const po2json = require('po2json');
const path = require('path');

const opt = getopt.create([
    ['h', 'help', 'display this help'],
]).bindHelp().parseSystem();

if (opt.argv.length != 2) {
    console.error('Incorrect number of arguments given');
    process.exit(1);
}

const data = po2json.parseFileSync(opt.argv[0]);
const filename = path.parse(opt.argv[0]).base;
const lang = filename.split('.')[0];

let bodyPart = '';
for (const msgid in data) {
    if (msgid === '') {
        continue;
    }
    const msgstr = data[msgid][1];
    if (msgstr === '') {
        continue;
    }
    const jsonMsgid = JSON.stringify(msgid);
    const jsonMsgstr = JSON.stringify(msgstr);
    bodyPart += `\n    ${jsonMsgid}: ${jsonMsgstr},`;
}
bodyPart = bodyPart.slice(0, -1);

let output;
if (bodyPart) {
    output = `/* global jsu */\njsu.addTranslations({${bodyPart}\n}, "${lang}");`;
} else {
    // no translations available
    output = '';
}

const outDir = path.dirname(opt.argv[1]);
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(opt.argv[1], output);
