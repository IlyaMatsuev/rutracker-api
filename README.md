# @ilyamatsuev/rutracker-api
* [English](https://github-com.translate.goog/IlyaMatsuev/rutracker-api/blob/master/README.md?_x_tr_sl=ru&_x_tr_tl=en&_x_tr_hl=en&_x_tr_pto=wapp)

Позволяет искать по раздачам трекера Rutracker.org. Поскольку поиск запрещён для незарегистрированных пользователей, также поддерживаетcя и авторизация.

Данная библиотека - форк [rutracker-api-with-proxy](https://github.com/fertkir/rutracker-api-with-proxy), в котором:
1. Добавлена возможность переиспользования куки и автоматической аутентификации
2. Добавлена возможность поиска метадаты торент файла (качество видео, субтитры и т.д.) по идентификатору треда

## Установка
Запусти ```npm install @ilyamatsuev/rutracker-api``` (предполагается, что Node.js и пакетный менеждер npm у вас уже установлены). Для работы требуется версия Node.js >= 8.

## API

### RutrackerApi#login({ username, password })
Возвращает Promise<>. Promise упадет, если были введены неправильные `username` или `password`.

```js
const RutrackerApi = require('@ilyamatsuev/rutracker-api');
const rutracker = new RutrackerApi();

rutracker.login({ username: '', password: '' })
  .then(() => {
    console.log('Authorized');
  })
  .catch(err => console.error(err));
```

### RutrackerApi#login({ username, password })
Возвращает Promise<>. Promise упадет, если были введены неправильные `username` или `password`.

```js
const RutrackerApi = require('@ilyamatsuev/rutracker-api');
const rutracker = new RutrackerApi();

rutracker.login({ username: '', password: '' })
  .then(() => {
    console.log('Authorized');
  })
  .catch(err => console.error(err));
```

### RutrackerApi#search({ query, sort, order })
Возвращает Promise<[Torrent](#torrent)[]>. Параметр `sort` может принимать одно из следующих значений: [`"registered"`](#registered), [`"title"`](#title), [`"downloads"`](#downloads), [`"size"`](#size), `"lastMessage"`, [`"seeds"`](#seeds) или [`"leeches"`](#leeches). Параметр `order` может принимать значение `desc` или `asc`. Когда указан параметр `order`, `sort` также должен быть указан.

```js
const RutrackerApi = require('rutracker-api-with-proxy');
const rutracker = new RutrackerApi();

rutracker.login({ username: '', password: '' })
  .then(() => rutracker.search({ query: 'your query', sort: 'size' }))
  .then(torrents => console.log(torrents));
```

### RutrackerApi#find(torrentId)
Возвращает Promise<[Torrent (with metadata)](#torrent-with-metadata)>. Параметр `torrentId` содержит строку с идентификатором треда (торрента), который можно получить из метода [`RutrackerApi#search`](#rutrackerapisearch-query-sort-order-).

```js
const RutrackerApi = require('rutracker-api-with-proxy');
const rutracker = new RutrackerApi();

rutracker.login({ username: '', password: '' })
  .then(() => rutracker.find("torrent-id"))
  .then(torrent => console.log(torrent));
```

### RutrackerApi#download(torrentId)
Возвращает Promise<[fs.ReadableStream](https://nodejs.org/api/stream.html#stream_readable_streams)>.

```js
const fs = require('fs');
const RutrackerApi = require('rutracker-api-with-proxy');
const rutracker = new RutrackerApi();

rutracker.login({ username: '', password: '' })
  .then(() => rutracker.download('id'))
  .then(stream => stream.pipe(fs.createWriteStream('filename.torrent')));
```

### RutrackerApi#getMagnetLink(torrentId)
Возвращает Promise<string>.

```js
const RutrackerApi = require('rutracker-api-with-proxy');
const rutracker = new RutrackerApi();

rutracker.login({ username: '', password: '' })
  .then(() => rutracker.getMagnetLink('id'))
  .then(uri => console.log(uri));
```

### Работа с переиспользованием куки

```js
const RutrackerApi = require('rutracker-api-with-proxy');
const rutracker = new RutrackerApi("https://rutracker.org", {}, {
    // Path to a json file which will store the cookie under the {"rutracker"} key
    cookiesFilePath: 'path/to/cookies.json',
    // Credentials are needed to automatically log-in if the cookie is missing or expired
    credentials: {
        username: '',
        password: ''
    }
});
```

### Работа через HTTP(S)-proxy

```js
const RutrackerApi = require('rutracker-api-with-proxy');
const rutracker = new RutrackerApi("https://rutracker.org", {
  proxy: {
    protocol: "http",
    // protocol: "https",
    host: "127.0.0.1",
    port: "1080",
    // auth: {
    //   username: "user",
    //   password: "password"
    // }
  }
});
```

### Работа через SOCKS-proxy

```js
const {SocksProxyAgent} = require('socks-proxy-agent');
const RutrackerApi = require('rutracker-api-with-proxy');
const rutracker = new RutrackerApi("https://rutracker.org", {
  httpsAgent: new SocksProxyAgent({
    protocol: "socks5",
    hostname: "127.0.0.1",
    port: "1080",
    // username: "user",
    // password: "password"
  })
});
```


## Типы

### Torrent

#### Свойства

##### id
Тип: `string`. Уникальный идентификатор раздачи. Используйте это свойство в методах [`RutrackerApi#download`](#rutrackerapidownloadtorrentid) и [`RutrackerApi#getMagnetLink`](#rutrackerapigetmagnetlinktorrentid).

##### title
Тип: `string`. Заголовок раздачи.

##### author
Тип: `string`. Имя пользователя, который создал раздачу.

##### category
Тип: `string`. Имя категории.

##### size
Тип: `number`. Размер раздачи в байтах.

##### formattedSize
Тип: `string`. Форматированный размер раздачи, похожий на тот, что выводит сам RuTracker. Например, `"3.03 GB"`.

##### seeds
Тип: `number`. Количество активных сидеров.

##### leeches
Тип: `number`. Количество активных личеров.

##### url
Тип: `string`. Ссылка на страницу торрента.

##### state
Тип: `string`. Текущий статус раздачи. Для сравнения используйте статические свойства объекта Torrent.
```js
const approvedTorrents = torrents.filter(torrent => torrent.state === Torrent.APPROVED);
```

##### downloads
Тип: `number`. Количество скачиваний торрент-файла.

##### registered
Тип: `Date`. Дата, когда торрент был зарегистрирован.


### Torrent (with metadata)

#### Свойства

##### metadata
Тип: `Array<{ key: string, value: string }>`. Список пунктов о торренте на странице треда (например: `Год выпуска: 2017`). Это свойство возвращается как часть торрента в методе [`RutrackerApi#find`](#rutrackerapifindtorrentid).


#### Статические свойства

##### Torrent.APPROVED
Константа для статуса `проверено`.

##### Torrent.NOT_APPROVED
Константа для статуса `не проверено`.

##### Torrent.NEED_EDIT
Константа для статуса `недооформлено`.

##### Torrent.DUBIOUSLY
Константа для статуса `сомнительно`.

##### Torrent.CONSUMED
Константа для статуса `поглощена`.

##### Torrent.TEMPORARY
Константа для статуса `временная`.

## Разработка
Тесты запускаются стандартной командой `npm test`. По умолчанию будут запущены ESLint и все unit-тесты. Чтобы также запускать acceptance-тесты, необходимо положить файл `acceptance.config.js` в директорию `tests` с примерно таким содержанием:

```js
module.exports = {
  username: "USERNAME",
  password: "PASSWORD",
  cookie: "bb_session=XXX"
};
```
