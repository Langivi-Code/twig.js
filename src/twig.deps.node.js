import sprintf from 'locutus/php/strings/sprintf.js';
import vsprintf from 'locutus/php/strings/vsprintf.js';
import strip_tags from 'locutus/php/strings/strip_tags.js';
import round from 'locutus/php/math/round.js';
import max from 'locutus/php/math/max.js';
import min from 'locutus/php/math/min.js';
import strtotime from 'locutus/php/datetime/strtotime.js';
import date from 'locutus/php/datetime/date.js';
import boolval from 'locutus/php/var/boolval.js';
import clm from 'country-locale-map';
import iconv from "iconv-lite";
import currencies from 'currencies-map';
import datauri from "dauria";
import dateFns from "date-fns";
import converter from "html-to-markdown";
import {langToLang} from "language-name-to-language-name";
import {getLanguageName} from "language-name-to-language-name";
import {getLanguageNameWithCountry} from "language-name-to-language-name";
import showdown from "showdown";
import slug from "slugify";
import timeZoneName from "spacetime-informal";
import md5  from "md5";

export { sprintf, vsprintf, strip_tags, round, min, max, date, strtotime, boolval, clm, iconv, currencies, datauri, dateFns, converter, langToLang, getLanguageName,getLanguageNameWithCountry,showdown,slug, timeZoneName, md5}

