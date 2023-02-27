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
import iconv from "iconv";
import currencies from 'currenciesMap';
import datauri from "datauria";
import dateFns from "dateFns";
import converter from "converter";
import {langToLang} from "languageName";
import {getLanguageName} from "languageName";
import {getLanguageNameWithCountry} from "languageName";
import showdown from "showdown";
import slug from "slug";
import timeZoneName from "timeZoneName";
import md5 from "hasher";



export const requireNode = createRequire(Deno.realPathSync("."));
export { sprintf, vsprintf, strip_tags, round, min, max, date, strtotime, boolval, clm, iconv, currencies, datauri, dateFns, converter, langToLang, getLanguageName,getLanguageNameWithCountry,showdown,slug, timeZoneName, md5}

