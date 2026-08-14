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
    // サーバーがあると確認できたときだけ書きます。
    // 「false のときだけ止める」にすると、有無が分かる前の1回目が飛んでしまい、
    // サーバーの無い端末で毎回メッセージが出ます（2026-08-15、iPhone）。
    if (this._available !== true) return;
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
        var firstTime = self._available !== false;
        self._available = false;
        self._lastError = String(e);
        // サーバーが無い場所では、一度きり静かに知らせて以降は黙ります。
        // 毎回赤字を出すと、正常に使えているのに壊れて見えます（2026-08-15）。
        self._say(firstTime ? "この端末では保存しません（表示のみ）" : "", "");
      });
  },

  // ファイルの中身を返します。無ければ null。
  // サーバーが無い場所（NAS の Web に置いた版を iPhone から開いたときなど）では
  // _available を false にして、以降の保存を試みないようにします。
  // これをしないと毎回「サーバーに繋がりません」が出ます（2026-08-15）。
  // 経過を画面に出します。iPhone は開発者ツールが繋げず、原因が推測になるためです。
  _log: function (msg) {
    if (window.__diag) window.__diag("● " + msg);
  },

  load: function () {
    var self = this;
    self._log("api/data を確認します");
    return window.fetch(this.ENDPOINT)
      .then(function (res) {
        self._log("api/data → " + res.status);
        if (!res.ok) { self._available = false; return null; }
        return res.json();
      })
      .then(function (j) {
        if (!j || j.error || !j.exists) return self._loadBundled();
        self._available = true;
        self._log("サーバーから取得 " + (j.songs || []).length + "曲");
        return j;
      })
      .catch(function (e) {
        self._log("api/data 失敗: " + (e && e.message ? e.message : e));
        self._available = false;
        return self._loadBundled();
      });
  },

  // サーバーが無い場所（NAS の Web に置いた版）では、一緒に置いてある
  // data/country-lyrics.json を読みます。これが無いと、そのアドレスは
  // 取り込みボタンを押すまでずっと空のままになります（2026-08-15）。
  BUNDLED: "data/country-lyrics.json",
  BUNDLED_INDEX: "data/index.json",

  // まず索引（曲名だけ・約20KB）を読んで一覧を出し、歌詞と訳は後ろで読みます。
  // 全部（約530KB）を読み終えてから一覧を出していたため、iPhone で2分かかっていました
  // （2026-08-15）。索引だけなら27分の1です。
  _loadBundled: function () {
    var self = this;
    self._log("索引 " + this.BUNDLED_INDEX + " を読みます");
    return window.fetch(this.BUNDLED_INDEX)
      .then(function (res) {
        self._log("索引 → " + res.status);
        return res.ok ? res.json() : null;
      })
      .then(function (j) {
        if (!j || !Array.isArray(j.songs) || j.songs.length === 0) {
          self._log("索引が空。全体を読みます");
          return self._loadFull();
        }
        self._log("索引を取得 " + j.songs.length + "曲");
        self._markReadOnly();
        self._fillLyricsLater();
        return { exists: true, songs: j.songs, playlists: j.playlists || [], bundled: true };
      })
      .catch(function (e) {
        self._log("索引 失敗: " + (e && e.message ? e.message : e));
        return self._loadFull();
      });
  },

  // サーバーが無い端末だと分かった時点で、この端末では保存しないことにします。
  // あわせて、以前の訪問で書き込まれた大きなデータを消します。残っていると
  // 起動のたびに解析され、iPhone では数十秒かかって画面が固まります（2026-08-15）。
  _markReadOnly: function () {
    this._readOnly = true;
    try {
      var k = LyricsApp.Store.STORAGE_KEY;
      if (localStorage.getItem(k)) localStorage.removeItem(k);
    } catch (e) {}
  },

  _loadFull: function () {
    var self = this;
    return window.fetch(this.BUNDLED)
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (j) {
        if (!j || !Array.isArray(j.songs) || j.songs.length === 0) return null;
        self._markReadOnly();
        return { exists: true, songs: j.songs, playlists: j.playlists || [], bundled: true };
      })
      .catch(function () { return null; });
  },

  // 一覧が出たあとで、歌詞と訳を流し込みます。画面は止めません。
  _fillLyricsLater: function () {
    var self = this;
    setTimeout(function () {
      window.fetch(self.BUNDLED)
        .then(function (res) { return res.ok ? res.json() : null; })
        .then(function (j) {
          if (!j || !Array.isArray(j.songs)) return;
          var byId = {};
          j.songs.forEach(function (s) { byId[s.id] = s; });
          var here = LyricsApp.Store._read();
          var n = 0;
          here.forEach(function (s) {
            var full = byId[s.id];
            if (!full) return;
            if (!s.lyrics && full.lyrics) { s.lyrics = full.lyrics; n++; }
            if (!s.lyricsJa && full.lyricsJa) { s.lyricsJa = full.lyricsJa; }
            if (!s.lyricsJaSource && full.lyricsJaSource) { s.lyricsJaSource = full.lyricsJaSource; }
          });
          LyricsApp.Store._cache = here;   // 画面用に手元だけ更新（保存は試みません）
          if (LyricsApp.SongListView) {
            try { LyricsApp.SongListView.render(document.getElementById("search-input").value); } catch (e) {}
          }
          self._say("歌詞を読み込みました（" + n + "曲）", "");
        })
        .catch(function () {});
    }, 0);
  },

  // 曲・歌詞・訳の数を数えます（削除済みは除く）。どちらが充実しているかの判定に使います。
  _mark: function (songs) {
    var n = 0, ly = 0, ja = 0;
    (songs || []).forEach(function (s) {
      if (s && !s.deleted) { n++; if (s.lyrics) ly++; if (s.lyricsJa) ja++; }
    });
    return { songs: n, lyrics: ly, ja: ja };
  },

  // 起動時に1回だけ呼びます。
  // ブラウザ側が空のときだけファイルから読み込みます。
  // 既にデータがある場合は触りません（消さないため）。
  initOnBoot: function () {
    var self = this;
    var here = LyricsApp.Store.getAll();
    return this.load().then(function (data) {
      if (!data) {
        // サーバーが無い場所では、保存を試みません。
        // 試みると毎回「サーバーに繋がりません」と出て、壊れたように見えます。
        if (self._available === false) { self._say("", ""); return null; }
        // ファイルがまだ無い場合は、いま手元にあるものを書いておきます。
        if (here && here.length > 0) return self.save();
        return null;
      }
      // 手元より充実していれば入れ替えます。
      // 「手元が空のときだけ」にすると、seedPresets() が入れた曲名だけの511曲が
      // 先に居座り、歌詞も訳も入りません（2026-08-15、iPhone で空になった原因）。
      var fileMark = self._mark(data.songs || []);
      var hereMark = self._mark(here);
      if (fileMark.songs <= hereMark.songs &&
          fileMark.lyrics <= hereMark.lyrics &&
          fileMark.ja <= hereMark.ja) {
        self._log("手元(" + hereMark.songs + "曲)の方が充実。入れ替えません");
        self._say("", "");
        return null;
      }
      self._log("画面へ入れます " + fileMark.songs + "曲");
      LyricsApp.Store._write(data.songs || []);
      if (LyricsApp.PlaylistStore && data.playlists) {
        LyricsApp.PlaylistStore._write(data.playlists);
      }
      self._say("ファイルから読み込みました（" + (data.songs || []).length + "曲）", "success");
      return data;
    });
  }
};
