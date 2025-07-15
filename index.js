const Parser = require("./lib/parser");
const PageProvider = require("./lib/page-provider");

function createPageProvider(host, httpClientConfigs, sessionConfigs) {
  const pageProvider = new PageProvider(host, httpClientConfigs);
  if (sessionConfigs.cookiesFilePath) {
    pageProvider.storeCookies(sessionConfigs.cookiesFilePath);
  }
  if (
    sessionConfigs.credentials &&
    sessionConfigs.credentials.username &&
    sessionConfigs.credentials.password
  ) {
    pageProvider.storeCredentials(
      sessionConfigs.credentials.username,
      sessionConfigs.credentials.password
    );
  }
  return pageProvider;
}

class RutrackerApi {
  constructor(
    host = "https://rutracker.org",
    httpClientConfigs = {},
    sessionConfigs = {}
  ) {
    this.parser = new Parser(host);
    this.pageProvider = createPageProvider(
      host,
      httpClientConfigs,
      sessionConfigs
    );
  }

  login({ username, password }) {
    return this.pageProvider.login(username, password);
  }

  search({ query, sort, order }) {
    return this.pageProvider
      .search({ query, sort, order })
      .then((html) => this.parser.parseSearch(html));
  }

  find(id) {
    return this.pageProvider
      .thread(id)
      .then((html) => this.parser.parseThread(id, html));
  }

  download(id) {
    return this.pageProvider.torrentFile(id);
  }

  getMagnetLink(id) {
    return this.pageProvider
      .thread(id)
      .then((html) => this.parser.parseMagnetLink(html));
  }
}

module.exports = RutrackerApi;
