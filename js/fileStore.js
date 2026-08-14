window.LyricsApp = window.LyricsApp || {};

// ファイル保存（2026-08-14 追加）
//
// 曲データはこれまでブラウザの中（localStorage）にしかなく、控えを取るには
// 毎回 Export を押す必要がありました。ここでは server.py 経由で
// ~/SynologyDrive/data/country-lyrics.json へ自動で書きます。
// Synology Drive が NAS へ同期するので、Export を押す必要がなくなります。
//
// 方針
//   ・書き込みは変更のたびに自動（まとめて2秒後に1回）
//   ・0件では絶対に書かない（サーバー側でも受け付けません）
//   ・読み込みは、ブラウザ側が空のときだけ。既にあるデータは上書きしません
//   ・サーバーが動いていないときは何もしません（今までどおり動きます）
LyricsApp.FileStore = {
  ENDPOINT: "/api/data",
  _timer: null,
  _lastError: "",
  _available: null,   // null=未確認 / true=使える / false=使えない

  // 画面に出す状態（「保存済み 04:32」など）
  _onStatus: null,
  onStatus: function (fn) { this._onStatus = fn; },
  _say: function (text, kind) {
    if (this._onStatus) this._onStatus(text, kind || "");
  },

  _now: function () {
    var d = new Date();
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return p(d.getHours()) + ":" + p(d.getMinutes());
  },

  // まとめて2秒後に1回だけ書きます。連続した変更で何度も書かないためです。
  schedule: function () {
    var self = this;
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(function () { self.save(); }, 2000);
  },

  // ファイルを最後に読んだときの中身の量。破壊的な保存を止めるために使います。
  // 2026-08-15 追加。起動しただけで 582曲・訳582 が 511曲・訳0 に上書きされ、
  // 一晩分の翻訳が消えました。0件だけを見ていて、中身が痩せる保存を通していたためです。
  _fileMark: null,

  _mark: function (songs) {
    var n = 0, ly = 0, ja = 0;
    (songs || []).forEach(function (s) {
      if (s && !s.deleted) { n++; if (s.lyrics) ly++; if (s.lyricsJa) ja++; }
    });
    return { songs: n, lyrics: ly, ja: ja };
  },

  save: function (force) {
    var self = this;
    var songs = LyricsApp.Store.getAll();
    var playlists = LyricsApp.PlaylistStore ? LyricsApp.PlaylistStore.getAll() : [];
    if (!songs || songs.length === 0) {
      // 0件で上書きするのは事故です。書きません。
      this._say("0件のため保存しませんでした", "error");
      return Promise.resolve({ skipped: true });
    }
    // 自動保存のときだけ、中身が痩せる書き込みを見送ります。
    // ボタンを押した保存（force）は必ず通します。消したものを消したままにできないと使えません。
    if (!force && this._fileMark) {
      var now = this._mark(songs);
      var was = this._fileMark;
      if (now.songs < was.songs || now.lyrics < was.lyrics || now.ja < was.ja) {
        this._say(
          "自動保存を見送りました（ファイル " + was.songs + "曲/歌詞" + was.lyrics + "/訳" + was.ja +
          " → 手元 " + now.songs + "曲/歌詞" + now.lyrics + "/訳" + now.ja +
          "）。反映するには「ファイルへ保存」を押してください", "error");
        return Promise.resolve({ skipped: true, reason: "would_shrink", file: was, here: now });
      }
    }
    this._say("保存中...", "loading");
    // ボタンを押した保存はサーバー側の歯止めも越えます。消したものを消したままにできるように。
    return window.fetch(this.ENDPOINT + (force ? "?force=1" : ""), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version: 1, songs: songs, playlists: playlists })
    }).then(function (res) { return res.json(); })
      .then(function (j) {
        if (j && j.ok) {
          self._available = true;
          self._fileMark = self._mark(songs);   // 書けたので、ファイルの中身の量を更新します
          self._say("保存済み " + self._now() + "（" + j.songs + "曲）", "success");
          return j;
        }
        self._lastError = (j && j.error) || "unknown";
        self._say("保存できませんでした: " + self._lastError, "error");
        return j;
      })
      .catch(function (e) {
        self._available = false;
        self._lastError = String(e);
        self._say("サーバーに繋がりません（手元には残っています）", "error");
      });
  },

  // ファイルの中身を返します。無ければ null。
  load: function () {
    return window.fetch(this.ENDPOINT)
      .then(function (res) { return res.json(); })
      .then(function (j) {
        if (!j || j.error || !j.exists) return null;
        return j;
      })
      .catch(function () { return null; });
  },

  // 起動時に、初期データを入れるより先に呼びます（app.js）。
  // ファイルの方が中身が多いときは、ファイルを正としてブラウザへ入れます。
  //
  // 2026-08-15 まで、ここは「ブラウザ側が空のときだけ読む」作りでした。
  // ところが seedPresets() が先に走って511曲を入れるため、空になる瞬間が無く、
  // ファイルは一度も読まれないまま自動保存に上書きされていました。
  initOnBoot: function () {
    var self = this;
    var here = LyricsApp.Store.getAll();
    return this.load().then(function (data) {
      if (!data) {
        // ファイルがまだ無い場合は、いま手元にあるものを書いておきます。
        if (here && here.length > 0) return self.save(true);
        return null;
      }
      var fileSongs = data.songs || [];
      self._fileMark = self._mark(fileSongs);
      var hereMark = self._mark(here);
      var fileMark = self._fileMark;

      // ファイルが手元より痩せていなければ、ファイルを正として読み込みます。
      //
      // 「多いときだけ読む」にすると、件数が同じで中身だけ直した場合に読み込まれません。
      // ファイル側で訳を直しても画面に出てこない、という状態になります（2026-08-15）。
      // 手元の方が多いときだけ、読み込みを見送ります。
      var filePoorer = fileMark.songs < hereMark.songs ||
                       fileMark.lyrics < hereMark.lyrics ||
                       fileMark.ja < hereMark.ja;
      if (filePoorer) {
        self._say("ファイルの方が少ないため読み込みませんでした（ファイル " +
                  fileMark.songs + "曲/歌詞" + fileMark.lyrics + "/訳" + fileMark.ja +
                  "／手元 " + hereMark.songs + "曲/歌詞" + hereMark.lyrics +
                  "/訳" + hereMark.ja + "）", "error");
        return null;
      }
      LyricsApp.Store._suppressSync = true;    // 読み込みで自動保存を誘発させません
      try {
        LyricsApp.Store._write(fileSongs);
        if (LyricsApp.PlaylistStore && data.playlists) {
          LyricsApp.PlaylistStore._write(data.playlists);
        }
      } finally {
        LyricsApp.Store._suppressSync = false;
      }
      self._say("ファイルから読み込みました（" + fileMark.songs + "曲／訳" + fileMark.ja + "）", "success");
      return data;
    });
  }
};
