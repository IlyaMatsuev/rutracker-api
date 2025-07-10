const { URL, URLSearchParams } = require("url");
const axios = require("axios");
const { AuthorizationError, NotAuthorizedError } = require("./errors");
const {
  orderMiddleware,
  queryMiddleware,
  sortMiddleware,
} = require("./middlewares");
const { decodeWindows1251 } = require("./utils");
const CookiesProvider = require("./cookies-provider");

class PageProvider {
  constructor(host = "https://rutracker.org", httpClientConfigs = {}) {
    this.authorized = false;
    this.cookie = null;
    this.host = host;
    this.loginUrl = `${this.host}/forum/login.php`;
    this.searchUrl = `${this.host}/forum/tracker.php`;
    this.threadUrl = `${this.host}/forum/viewtopic.php`;
    this.downloadUrl = `${this.host}/forum/dl.php`;

    this.searchMiddlewares = [queryMiddleware, sortMiddleware, orderMiddleware];
    this.request = axios.create(httpClientConfigs);
    this.attemptedLogin = false;
  }

  storeCredentials(username, password) {
    this.credentials = { username, password };
    return this;
  }

  storeCookies(cookiesFilePath, rutrackerCookieKey) {
    this.cookiesProvider = new CookiesProvider(
      cookiesFilePath,
      rutrackerCookieKey
    );
    this.cookie = this.cookiesProvider.getCookie() || null;
    this.authorized = !!this.cookie;
    return this;
  }

  getCookie() {
    if (this.cookiesProvider) {
      return this.cookiesProvider.getCookie();
    }
    return this.cookie;
  }

  login(
    username = this.credentials.username,
    password = this.credentials.password
  ) {
    const body = new URLSearchParams();

    body.append("login_username", username);
    body.append("login_password", password);
    body.append("login", "Вход");

    return this.request({
      url: this.loginUrl,
      method: "POST",
      data: body.toString(),
      maxRedirects: 0,
      validateStatus(status) {
        return status === 302;
      },
    })
      .then((response) => {
        const setCookie = response.headers["set-cookie"];
        this.cookie = Array.isArray(setCookie)
          ? setCookie.map((cookie) => cookie.split(";")[0]).join(";")
          : setCookie.split(";")[0];
        this.authorized = true;

        if (this.cookiesProvider) {
          return this.cookiesProvider.setCookie(this.cookie).then(() => true);
        }
        return true;
      })
      .catch(() => {
        throw new AuthorizationError();
      });
  }

  search(params) {
    if (!this.authorized) {
      return this.runWithLogin(() => this.search(params));
    }

    const url = new URL(this.searchUrl);
    const body = new URLSearchParams();

    try {
      this.searchMiddlewares.forEach((middleware) => {
        middleware(params, body, url);
      });
    } catch (err) {
      return Promise.reject(err);
    }

    return this.request({
      url: url.toString(),
      data: body.toString(),
      method: "POST",
      responseType: "arraybuffer",
      headers: {
        Cookie: this.getCookie(),
      },
    })
      .then((response) => decodeWindows1251(response.data))
      .catch((err) =>
        this.handleUnauthorizedError(err, () => this.search(params))
      );
  }

  thread(id) {
    if (!this.authorized) {
      return this.runWithLogin(() => this.thread(id));
    }

    const url = `${this.threadUrl}?t=${encodeURIComponent(id)}`;

    return this.request({
      url,
      method: "GET",
      responseType: "arraybuffer",
      headers: {
        Cookie: this.getCookie(),
      },
    })
      .then((response) => decodeWindows1251(response.data))
      .catch((err) => this.handleUnauthorizedError(err, () => this.thread(id)));
  }

  torrentFile(id) {
    if (!this.authorized) {
      return this.runWithLogin(() => this.torrentFile(id));
    }

    const url = `${this.downloadUrl}?t=${encodeURIComponent(id)}`;

    return this.request({
      url,
      method: "GET",
      responseType: "stream",
      headers: {
        Cookie: this.getCookie(),
      },
    })
      .then((response) => response.data)
      .catch((err) =>
        this.handleUnauthorizedError(err, () => this.torrentFile(id))
      );
  }

  runWithLogin(callback) {
    if (this.credentials && !this.attemptedLogin) {
      this.attemptedLogin = true;
      try {
        return this.login().then(callback);
      } finally {
        this.attemptedLogin = false;
      }
    }
    return Promise.reject(new NotAuthorizedError());
  }

  handleUnauthorizedError(error, callback) {
    if (!this.attemptedLogin) {
      this.authorized = false;
      this.cookie = null;
      return callback();
    }
    throw error;
  }
}

module.exports = PageProvider;
