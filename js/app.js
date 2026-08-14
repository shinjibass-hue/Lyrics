window.LyricsApp = window.LyricsApp || {};

LyricsApp.App = {
  _views: {},

  init: function () {
    this._views = {
      "song-list": document.getElementById("view-song-list"),
      "song-editor": document.getElementById("view-song-editor"),
      "performer": document.getElementById("view-performer"),
      "playlists": document.getElementById("view-playlists"),
      "playlist-detail": document.getElementById("view-playlist-detail")
    };

    // ファイル保存（~/SynologyDrive）。Export を押さなくて済むようにするため。
    // 初期データを入れるより先にファイルを読みます。順番が逆だと、seedPresets() が
    // 入れた511曲でファイルが上書きされ、歌詞と訳が消えます（2026-08-15 に発生）。
    var self = this;
    this._initFileStore().then(function () {
      LyricsApp.Store.seedPresets();
      self._initViews();
    });
  },

  _initViews: function () {
    LyricsApp.SongListView.init();
    LyricsApp.SongEditorView.init();
    LyricsApp.PerformerView.init();
    LyricsApp.PlaylistListView.init();
    LyricsApp.PlaylistDetailView.init();

    // Playlists button on song list
    document.getElementById("btn-playlists").addEventListener("click", function () {
      LyricsApp.App.navigate("playlists");
    });

    // Auto-sync: set up status indicator and start
    this._initAutoSync();

    this.navigate("song-list");
  },

  _initFileStore: function () {
    if (!LyricsApp.FileStore) return Promise.resolve(null);
    var el = document.getElementById("file-store-status");
    LyricsApp.FileStore.onStatus(function (text, kind) {
      if (!el) return;
      el.textContent = text;
      el.className = "fetch-status" + (kind ? " " + kind : "");
    });
    var btn = document.getElementById("btn-file-save");
    // ボタンを押した保存は必ず通します（force）。消したものを消したままにできるように。
    if (btn) btn.addEventListener("click", function () { LyricsApp.FileStore.save(true); });
    return LyricsApp.FileStore.initOnBoot().catch(function () { return null; });
  },

  _initAutoSync: function () {
    var indicator = document.getElementById("sync-indicator");
    if (!indicator) return;

    LyricsApp.CloudSync.onStatusChange(function (status) {
      indicator.className = "sync-indicator";
      switch (status) {
        case "syncing":
          indicator.classList.add("syncing");
          indicator.title = "Syncing...";
          break;
        case "synced":
          indicator.classList.add("synced");
          var t = LyricsApp.CloudSync.getLastSyncTime();
          indicator.title = "Synced: " + (t ? new Date(t).toLocaleTimeString() : "just now");
          break;
        case "error":
          indicator.classList.add("sync-error");
          indicator.title = "Sync error";
          break;
        case "offline":
          indicator.classList.add("sync-offline");
          indicator.title = "Offline";
          break;
        default:
          indicator.classList.add("hidden");
          break;
      }
    });

    if (LyricsApp.CloudSync.isConfigured()) {
      indicator.classList.remove("hidden");
      LyricsApp.CloudSync.startAutoSync();
    } else {
      indicator.classList.add("hidden");
    }
  },

  navigate: function (viewName, params) {
    params = params || {};

    // Hide all views
    var keys = Object.keys(this._views);
    for (var i = 0; i < keys.length; i++) {
      this._views[keys[i]].classList.remove("active");
    }

    // Show target view
    var target = this._views[viewName];
    if (target) {
      target.classList.add("active");
    }

    // View-specific setup
    switch (viewName) {
      case "song-list":
        document.getElementById("search-input").value = "";
        LyricsApp.SongListView.render();
        break;
      case "song-editor":
        LyricsApp.SongEditorView.show(params.songId);
        break;
      case "performer":
        LyricsApp.PerformerView.show(params.songId, params.playlistId);
        break;
      case "playlists":
        LyricsApp.PlaylistListView.render();
        break;
      case "playlist-detail":
        LyricsApp.PlaylistDetailView.show(params.playlistId);
        break;
    }
  }
};

document.addEventListener("DOMContentLoaded", function () {
  LyricsApp.App.init();
});
