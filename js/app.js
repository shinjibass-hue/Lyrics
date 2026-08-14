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

    LyricsApp.Store.seedPresets();

    LyricsApp.SongListView.init();
    LyricsApp.SongEditorView.init();
    LyricsApp.PerformerView.init();
    LyricsApp.PlaylistListView.init();
    LyricsApp.PlaylistDetailView.init();

    // Playlists button on song list
    document.getElementById("btn-playlists").addEventListener("click", function () {
      LyricsApp.App.navigate("playlists");
    });

    // ファイル保存（~/SynologyDrive）。Export を押さなくて済むようにするため。
    this._initFileStore();

    // Auto-sync: set up status indicator and start
    this._initAutoSync();

    this.navigate("song-list");
  },

  _initFileStore: function () {
    if (!LyricsApp.FileStore) return;
    var el = document.getElementById("file-store-status");
    LyricsApp.FileStore.onStatus(function (text, kind) {
      if (!el) return;
      el.textContent = text;
      el.className = "fetch-status" + (kind ? " " + kind : "");
    });
    LyricsApp.FileStore.initOnBoot();
    var btn = document.getElementById("btn-file-save");
    if (btn) btn.addEventListener("click", function () { LyricsApp.FileStore.save(); });
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

  _listScroll: 0,

  navigate: function (viewName, params) {
    params = params || {};

    // 一覧から離れるとき、見ていた位置を覚えます。
    // 582曲あるので、戻るたびに先頭へ飛ばされると探し直しになります（2026-08-15）。
    if (this._views["song-list"] &&
        this._views["song-list"].classList.contains("active") &&
        viewName !== "song-list") {
      this._listScroll = window.pageYOffset || document.documentElement.scrollTop || 0;
    }

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
        // 覚えておいた位置へ戻します。描画が終わってからでないと効きません。
        var y = this._listScroll;
        if (y > 0) {
          window.scrollTo(0, y);
          setTimeout(function () { window.scrollTo(0, y); }, 0);
        }
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
