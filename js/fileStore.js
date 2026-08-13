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

  save: function () {
    var self = this;
    var songs = LyricsApp.Store.getAll();
    var playlists = LyricsApp.PlaylistStore ? LyricsApp.PlaylistStore.getAll() : [];
    if (!songs || songs.length === 0) {
      // 0件で上書きするのは事故です。書きません。
      this._say("0件のため保存しませんでした", "error");
      return Promise.resolve({ skipped: true });
    }
    this._say("保存中...", "loading");
    return window.fetch(this.ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version: 1, songs: songs, playlists: playlists })
    }).then(function (res) { return res.json(); })
      .then(function (j) {
        if (j && j.ok) {
          self._available = true;
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

  // 起動時に1回だけ呼びます。
  // ブラウザ側が空のときだけファイルから読み込みます。
  // 既にデータがある場合は触りません（消さないため）。
  initOnBoot: function () {
    var self = this;
    var here = LyricsApp.Store.getAll();
    return this.load().then(function (data) {
      if (!data) {
        // ファイルがまだ無い場合は、いま手元にあるものを書いておきます。
        if (here && here.length > 0) return self.save();
        return null;
      }
      if (here && here.length > 0) {
        self._say("ファイルあり（" + (data.songs || []).length + "曲）／手元 " + here.length + "曲", "");
        return null;
      }
      // 手元が空のときだけ、ファイルから入れます。
      LyricsApp.Store._write(data.songs || []);
      if (LyricsApp.PlaylistStore && data.playlists) {
        LyricsApp.PlaylistStore._write(data.playlists);
      }
      self._say("ファイルから読み込みました（" + (data.songs || []).length + "曲）", "success");
      return data;
    });
  }
};
