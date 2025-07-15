const path = require("path");
const fs = require("fs/promises");
const fsSync = require("fs");

const RUTRACKER_COOKIE_KEY = "rutracker";

function cookiesFileExists(cookiesFilePath) {
  return fs
    .access(cookiesFilePath)
    .then(() => true)
    .catch(() => false);
}

function setAllCookies(cookiesFilePath, allCookies = {}) {
  return fs.writeFile(cookiesFilePath, JSON.stringify(allCookies));
}

async function getAllCookies(cookiesFilePath) {
  if (!(await cookiesFileExists(cookiesFilePath))) {
    await setAllCookies(cookiesFilePath);
  }
  const content = (await fs.readFile(cookiesFilePath)).toString() || "{}";
  return JSON.parse(content);
}

class CookiesProvider {
  constructor(cookiesFilePath, rutrackerCookieKey = RUTRACKER_COOKIE_KEY) {
    this.cookiesFilePath = cookiesFilePath
      ? path.resolve(cookiesFilePath)
      : undefined;
    this.rutrackerCookieKey = rutrackerCookieKey;
  }

  getCookie() {
    return getAllCookies(this.cookiesFilePath).then(
      (cookies) => cookies[this.rutrackerCookieKey]
    );
  }

  getCookieSync() {
    if (!fsSync.existsSync(this.cookiesFilePath)) {
      fsSync.writeFileSync(this.cookiesFilePath, "{}");
    }
    const content = fsSync.readFileSync(this.cookiesFilePath).toString();
    return JSON.parse(content)[this.rutrackerCookieKey];
  }

  async setCookie(cookie) {
    const allCookies = await getAllCookies(this.cookiesFilePath);
    allCookies[this.rutrackerCookieKey] = cookie;
    return setAllCookies(this.cookiesFilePath, allCookies);
  }
}

module.exports = CookiesProvider;
