const cheerio = require("cheerio");
const Torrent = require("./torrent");
const { parseRussianDate, parseSizeToBytes } = require("./utils");

function normalizeMetadataEntryKey(unformattedKey) {
  return unformattedKey.replace(/[^\p{L} ]+/gu, "").trim();
}

function normalizeMetadataEntryValue(unformattedValue) {
  return unformattedValue.replace(/^[:：]\s*/, "").trim();
}

function parseMetadataEntries($) {
  const detailEntries = [];
  $(".post_wrap .post_body")
    .first()
    .find(".post-b")
    .each((i, el) => {
      if ($(el).find(".post-b").length) {
        return;
      }

      if (el.next && el.next.type === "text") {
        detailEntries.push({
          key: normalizeMetadataEntryKey($(el).text()),
          value: normalizeMetadataEntryValue($(el.next).text()),
        });
      } else {
        detailEntries.push(
          ...$(el)
            .text()
            .split("\n")
            .map((line) => {
              const parts = line.split(":");
              return {
                key: normalizeMetadataEntryKey(parts.shift()),
                value: parts.join(":").trim(),
              };
            })
        );
      }
    });
  return detailEntries.filter((e) => !!e.key && !!e.value);
}

function parseThreadCategory($) {
  return $("td.nav.t-breadcrumb-top.w100.pad_2")
    .first()
    .text()
    .split("»")
    .pop()
    .trim();
}

function parseThreadTitle($) {
  return $("h1.maintitle").first().text().trim();
}

function parseThreadAuthor($) {
  return $("td.poster_info p.nick.nick-author").first().text().trim();
}

function parseThreadTorrentSize($) {
  return parseSizeToBytes($(`span[id="tor-size-humn"]`).first().text().trim());
}

function parseThreadDownloads($) {
  const registrationElement = $(
    `table.attach.bordered.med tr.row1 td ul.inlined.middot-separated li`
  );
  // Specified in format: "Скачан: 13,195 раз"
  const downloadsCount = $(registrationElement[1])
    .text()
    .replaceAll(",", "")
    .trim()
    .split(" ")[1];
  return Number(downloadsCount || 0);
}

function parseThreadRegistrationDate($) {
  const registrationElement = $(
    `table.attach.bordered.med tr.row1 td ul.inlined.middot-separated li`
  );
  return parseRussianDate($(registrationElement[0]).text().trim());
}

class Parser {
  constructor(host = "https://rutracker.org") {
    this.host = host;
  }

  parseSearch(rawHtml) {
    const $ = cheerio.load(rawHtml, { decodeEntities: false });
    const results = [];

    let tracks = $("#tor-tbl tbody").find("tr");
    const { length } = tracks;

    for (let i = 0; i < length; i += 1) {
      // Ah-m... Couldn't find any better method
      const document = tracks.find("td");
      const state = document.next();
      const category = state.next();
      const title = category.next();
      const author = title.next();
      const size = author.next();
      const seeds = size.next();
      const leeches = seeds.next();
      const downloads = leeches.next();
      const registered = downloads.next();

      const id = title.find("div a").attr("data-topic_id");

      // Handle case where search has no results
      if (id) {
        const torrent = new Torrent({
          state: state.attr("title"),
          id: title.find("div a").attr("data-topic_id"),
          category: category.find(".f-name a").html(),
          title: title.find("div a ").html(),
          author: author.find("div a ").html(),
          size: Number(size.attr("data-ts_text")),
          seeds: Number(seeds.find("b").html()),
          leeches: Number(leeches.html()),
          downloads: Number(downloads.html()),
          registered: new Date(Number(registered.attr("data-ts_text")) * 1000),
          host: this.host,
        });

        results.push(torrent);
      }

      tracks = tracks.next();
    }

    return results;
  }

  parseThread(id, rawHtml) {
    const $ = cheerio.load(rawHtml, { decodeEntities: false });
    return {
      id,
      category: parseThreadCategory($),
      title: parseThreadTitle($),
      author: parseThreadAuthor($),
      size: parseThreadTorrentSize($),
      seeds: Number($(`span.seed b`).first().text().trim()),
      leeches: Number($(`span.leech b`).first().text().trim()),
      downloads: parseThreadDownloads($),
      registered: parseThreadRegistrationDate($),
      metadata: parseMetadataEntries($),
    };
  }

  parseMagnetLink(rawHtml) {
    const $ = cheerio.load(rawHtml, { decodeEntities: false });
    return $(".magnet-link").attr("href");
  }
}

module.exports = Parser;
