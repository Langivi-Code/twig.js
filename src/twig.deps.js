import { createRequire } from "module";
import sprintf from 'sprintf';
import vsprintf from 'vsprintf';
import strip_tags from 'strip_tags';
import round from 'round';
import max from 'max';
import min from 'min';
import strtotime from 'strtotime';
import date from 'date';
import boolval from 'boolval';
import clm from 'countryLocaleMap';
import {encode} from "iconv";
import {Currencies} from 'currenciesMap';
import { datauri } from "datauris";
import { lookup } from "lookup";
import { fromUint8Array } from "fromUint8Array";
import {datetime} from "datetime";
import turndown from "turndown";
import { DOMParser } from "DOMParser";
import {langToLang} from "languageName";
import {getLanguageName} from "languageName";
import {getLanguageNameWithCountry} from "languageName";
import showdown from "showdown";
import slug from "slug";
import timeZoneName from "timeZoneName";
import {createHash} from "hasher";
import {ensureDir} from "ensureDir";
import {emptyDirSync} from "emptyDirSync";


const require = createRequire(Deno.realPathSync("."));
export { sprintf, vsprintf, strip_tags, round, min, max, date, strtotime, boolval, clm, encode, Currencies, datauri, lookup, fromUint8Array, datetime, turndown, DOMParser, langToLang, getLanguageName,getLanguageNameWithCountry,showdown,slug, timeZoneName,createHash,ensureDir, emptyDirSync}
export default require;
