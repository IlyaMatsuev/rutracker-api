const windows1251 = require("windows-1251");
const cheerio = require("cheerio");
const { NotAuthorizedError } = require("./errors");

const MONTHS = {
  янв: 0,
  фев: 1,
  мар: 2,
  апр: 3,
  май: 4,
  июн: 5,
  июл: 6,
  авг: 7,
  сен: 8,
  окт: 9,
  ноя: 10,
  дек: 11,
};

const SIZE_UNITS = {
  B: 1,
  KB: 1024,
  MB: 1024 ** 2,
  GB: 1024 ** 3,
  TB: 1024 ** 4,
};

module.exports = {
  decodeWindows1251: (string) =>
    string === undefined
      ? undefined
      : windows1251.decode(string.toString("binary"), { mode: "html" }),

  validateUnauthorized: (rawHtml) => {
    const $ = cheerio.load(rawHtml, { decodeEntities: false });
    const isUnauthorizedResponse =
      $('form[action="login.php"]').length ||
      $("body").text().includes("Введите логин и пароль");
    if (isUnauthorizedResponse) {
      throw new NotAuthorizedError();
    }
    return rawHtml;
  },

  parseRussianDate: (str) => {
    const match = str.match(/^(\d{2})-([А-Яа-я]{3})-(\d{2}) (\d{2}):(\d{2})$/);
    if (!match) {
      return null;
    }

    const [, day, monthStr, year, hours, minutes] = match;
    const month = MONTHS[monthStr.toLowerCase()];
    if (month === undefined) {
      return null;
    }

    const fullYear = parseInt(year, 10) + 2000;
    return new Date(
      fullYear,
      month,
      parseInt(day, 10),
      parseInt(hours, 10),
      parseInt(minutes, 10)
    );
  },

  parseSizeToBytes: (sizeStr) => {
    const match = sizeStr.trim().match(/^([\d.]+)\s*([KMGT]?B)$/i);
    if (!match) {
      return NaN;
    }

    const [, valueStr, unitRaw] = match;
    const value = parseFloat(valueStr);
    const multiplier = SIZE_UNITS[unitRaw.toUpperCase()];
    return multiplier ? Math.round(value * multiplier) : NaN;
  },

  formatSize: (sizeInBytes) => {
    const sizeInMegabytes = sizeInBytes / (1000 * 1000 * 1000);
    return `${sizeInMegabytes.toFixed(2)} GB`;
  },
};
