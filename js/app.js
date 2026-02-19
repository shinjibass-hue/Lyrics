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

    // Check URL for shared sync settings (from another device)
    this._checkUrlSyncParams();

    // Auto-sync: set up status indicator and start
    this._initAutoSync();

    this.navigate("song-list");
  },

  // If URL contains ?token=...&gist=..., auto-configure and clean URL
  _checkUrlSyncParams: function () {
    var params = new URLSearchParams(window.location.search);
    var token = params.get("token");
    var gistId = params.get("gist");
    if (token && gistId) {
      // Always overwrite - allows re-linking or updating credentials
      LyricsApp.GistSync.saveSettings({ token: token, gistId: gistId });
      // Clean URL (remove params)
      window.history.replaceState({}, "", window.location.pathname);
    }
  },

  _initAutoSync: function () {
    var indicator = document.getElementById("sync-indicator");
    if (!indicator) return;

    // Update indicator based on sync status
    LyricsApp.GistSync.onStatusChange(function (status) {
      indicator.className = "sync-indicator";
      switch (status) {
        case "syncing":
          indicator.classList.add("syncing");
          indicator.title = "Syncing...";
          break;
        case "synced":
          indicator.classList.add("synced");
          var t = LyricsApp.GistSync.getLastSyncTime();
          indicator.title = "Synced: " + (t ? new Date(t).toLocaleTimeString() : "just now");
          break;
        case "error":
          indicator.classList.add("sync-error");
          indicator.title = "Sync error - tap Sync to retry";
          break;
        case "offline":
          indicator.classList.add("sync-offline");
          indicator.title = "Offline - will sync when back online";
          break;
        default:
          indicator.classList.add("hidden");
          break;
      }
    });

    // Auto-setup or start sync
    if (LyricsApp.GistSync.isConfigured()) {
      indicator.classList.remove("hidden");
      LyricsApp.GistSync.startAutoSync();
    } else if (LyricsApp.GistSync._embeddedToken) {
      // Auto-setup with embedded token
      indicator.classList.remove("hidden");
      indicator.classList.add("syncing");
      indicator.title = "Setting up sync...";
      LyricsApp.GistSync.autoSetup(function (err, gistId) {
        if (err) {
          indicator.classList.remove("syncing");
          indicator.classList.add("sync-error");
          indicator.title = "Auto-setup failed";
        } else {
          LyricsApp.GistSync.startAutoSync();
          LyricsApp.SongListView.render();
        }
      });
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
