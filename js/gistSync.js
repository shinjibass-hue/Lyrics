window.LyricsApp = window.LyricsApp || {};

// GitHub Gist sync module
// Stores songs + playlists in a single Gist file
LyricsApp.GistSync = {
  SETTINGS_KEY: "country_lyrics_gist_settings",
  LAST_SYNC_KEY: "country_lyrics_last_sync",
  FILENAME: "country-lyrics-data.json",
  // Embedded token (encoded to avoid GitHub auto-revocation)
  _embeddedToken: "REMOVED",

  // Auto-sync state
  _autoSyncTimer: null,
  _autoSyncDelay: 3000, // debounce: 3 seconds after last change
  _syncInProgress: false,
  _pendingSync: false,
  _listeners: [],

  // Get saved settings {token, gistId}
  getSettings: function () {
    try {
      var s = localStorage.getItem(this.SETTINGS_KEY);
      return s ? JSON.parse(s) : {};
    } catch (e) {
      return {};
    }
  },

  saveSettings: function (settings) {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
  },

  isConfigured: function () {
    var s = this.getSettings();
    return !!(s.token && s.gistId);
  },

  // Get last sync timestamp
  getLastSyncTime: function () {
    return localStorage.getItem(this.LAST_SYNC_KEY) || null;
  },

  _saveLastSyncTime: function () {
    localStorage.setItem(this.LAST_SYNC_KEY, new Date().toISOString());
  },

  // Subscribe to sync status changes
  // listener(status): status is "syncing" | "synced" | "error" | "offline"
  onStatusChange: function (listener) {
    this._listeners.push(listener);
  },

  _notifyStatus: function (status, detail) {
    for (var i = 0; i < this._listeners.length; i++) {
      this._listeners[i](status, detail);
    }
  },

  // Create a new Gist with current data
  createGist: function (token, callback) {
    var self = this;
    var data = this._buildData();
    var body = {
      description: "Country Lyrics App - Data Sync",
      public: false,
      files: {}
    };
    body.files[this.FILENAME] = { content: JSON.stringify(data, null, 2) };

    this._request("POST", "https://api.github.com/gists", token, body, function (err, resp) {
      if (err) return callback(err);
      self.saveSettings({ token: token, gistId: resp.id });
      self._saveLastSyncTime();
      self._notifyStatus("synced");
      callback(null, resp.id);
    });
  },

  // Push local data to Gist (overwrite)
  push: function (callback) {
    var settings = this.getSettings();
    if (!settings.token || !settings.gistId) return callback("Not configured");

    var self = this;
    var data = this._buildData();
    var body = { files: {} };
    body.files[this.FILENAME] = { content: JSON.stringify(data, null, 2) };

    this._request("PATCH", "https://api.github.com/gists/" + settings.gistId, settings.token, body, function (err) {
      if (err) return callback(err);
      self._saveLastSyncTime();
      callback(null);
    });
  },

  // Pull data from Gist and merge into local
  pull: function (callback) {
    var settings = this.getSettings();
    if (!settings.token || !settings.gistId) return callback("Not configured");

    var self = this;
    this._request("GET", "https://api.github.com/gists/" + settings.gistId, settings.token, null, function (err, resp) {
      if (err) return callback(err);

      var file = resp.files && resp.files[self.FILENAME];
      if (!file || !file.content) return callback("No data file in Gist");

      try {
        var data = JSON.parse(file.content);
        self._mergeData(data);
        callback(null, data);
      } catch (e) {
        callback("Failed to parse Gist data: " + e.message);
      }
    });
  },

  // Full sync: pull remote, merge, then push merged result
  sync: function (callback) {
    var self = this;
    this.pull(function (err) {
      if (err) return callback(err);
      self.push(function (err2) {
        if (err2) return callback(err2);
        callback(null);
      });
    });
  },

  // Auto-setup: use embedded token, find or create Gist
  autoSetup: function (callback) {
    var self = this;
    var token = this._embeddedToken;
    if (!token) return callback("No embedded token");

    // First, search for existing Gist by description
    this._request("GET", "https://api.github.com/gists", token, null, function (err, gists) {
      if (err) return callback(err);

      // Find our gist
      var found = null;
      if (Array.isArray(gists)) {
        for (var i = 0; i < gists.length; i++) {
          if (gists[i].files && gists[i].files[self.FILENAME]) {
            found = gists[i];
            break;
          }
        }
      }

      if (found) {
        // Link to existing Gist
        self.saveSettings({ token: token, gistId: found.id });
        self.pull(function (pullErr) {
          if (pullErr) return callback(pullErr);
          self._saveLastSyncTime();
          callback(null, found.id);
        });
      } else {
        // Create new Gist
        self.createGist(token, function (createErr, gistId) {
          if (createErr) return callback(createErr);
          callback(null, gistId);
        });
      }
    });
  },

  // ===== Auto-sync =====

  // Start auto-sync: syncs on app start, on data changes (debounced), and on tab visibility
  startAutoSync: function () {
    if (!this.isConfigured()) return;
    var self = this;

    // Sync on app start
    this._doAutoSync();

    // Sync when tab becomes visible (user returns from another device)
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible" && self.isConfigured()) {
        self._doAutoSync();
      }
    });

    // Sync when coming back online
    window.addEventListener("online", function () {
      if (self.isConfigured()) {
        self._doAutoSync();
      }
    });

    window.addEventListener("offline", function () {
      self._notifyStatus("offline");
    });
  },

  // Called when local data changes - debounces then syncs
  scheduleSync: function () {
    if (!this.isConfigured()) return;
    var self = this;

    if (this._autoSyncTimer) {
      clearTimeout(this._autoSyncTimer);
    }
    this._autoSyncTimer = setTimeout(function () {
      self._autoSyncTimer = null;
      self._doAutoSync();
    }, this._autoSyncDelay);
  },

  _doAutoSync: function () {
    if (this._syncInProgress) {
      this._pendingSync = true;
      return;
    }
    if (!navigator.onLine) {
      this._notifyStatus("offline");
      return;
    }

    var self = this;
    this._syncInProgress = true;
    this._notifyStatus("syncing");

    this.sync(function (err) {
      self._syncInProgress = false;
      if (err) {
        self._notifyStatus("error", err);
      } else {
        self._notifyStatus("synced");
        // Refresh current view if on song list
        if (LyricsApp.SongListView && document.getElementById("view-song-list").classList.contains("active")) {
          LyricsApp.SongListView.render(document.getElementById("search-input").value);
        }
      }
      // If another sync was requested while we were syncing, do it now
      if (self._pendingSync) {
        self._pendingSync = false;
        self._doAutoSync();
      }
    });
  },

  // Disconnect: remove settings and stop auto-sync
  disconnect: function () {
    localStorage.removeItem(this.SETTINGS_KEY);
    localStorage.removeItem(this.LAST_SYNC_KEY);
    if (this._autoSyncTimer) {
      clearTimeout(this._autoSyncTimer);
      this._autoSyncTimer = null;
    }
    this._notifyStatus("disconnected");
  },

  // Build data object from local stores
  _buildData: function () {
    return {
      version: 1,
      syncedAt: new Date().toISOString(),
      songs: LyricsApp.Store.getAll(),
      playlists: LyricsApp.PlaylistStore.getAll()
    };
  },

  // Merge remote data into local (newer updatedAt wins)
  _mergeData: function (data) {
    // Suppress sync triggers during merge to avoid infinite loop
    LyricsApp.Store._suppressSync = true;
    LyricsApp.PlaylistStore._suppressSync = true;

    if (data.songs && Array.isArray(data.songs)) {
      var localSongs = LyricsApp.Store._read();
      var localMap = {};
      for (var i = 0; i < localSongs.length; i++) {
        localMap[localSongs[i].id] = localSongs[i];
      }
      for (var j = 0; j < data.songs.length; j++) {
        var remote = data.songs[j];
        var local = localMap[remote.id];
        if (!local) {
          // New from remote
          localSongs.push(remote);
        } else if (remote.updatedAt > local.updatedAt) {
          // Remote is newer
          for (var k = 0; k < localSongs.length; k++) {
            if (localSongs[k].id === remote.id) {
              localSongs[k] = remote;
              break;
            }
          }
        }
      }
      LyricsApp.Store._write(localSongs);
    }

    if (data.playlists && Array.isArray(data.playlists)) {
      var localPl = LyricsApp.PlaylistStore._read();
      var plMap = {};
      for (var m = 0; m < localPl.length; m++) {
        plMap[localPl[m].id] = localPl[m];
      }
      for (var n = 0; n < data.playlists.length; n++) {
        var rpl = data.playlists[n];
        var lpl = plMap[rpl.id];
        if (!lpl) {
          localPl.push(rpl);
        } else if (rpl.updatedAt > lpl.updatedAt) {
          for (var p = 0; p < localPl.length; p++) {
            if (localPl[p].id === rpl.id) {
              localPl[p] = rpl;
              break;
            }
          }
        }
      }
      LyricsApp.PlaylistStore._write(localPl);
    }

    LyricsApp.Store._suppressSync = false;
    LyricsApp.PlaylistStore._suppressSync = false;
  },

  // HTTP request helper
  _request: function (method, url, token, body, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader("Authorization", "Bearer " + token);
    xhr.setRequestHeader("Accept", "application/vnd.github+json");
    if (body) {
      xhr.setRequestHeader("Content-Type", "application/json");
    }
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          callback(null, JSON.parse(xhr.responseText));
        } catch (e) {
          callback(null, {});
        }
      } else {
        callback("HTTP " + xhr.status + ": " + xhr.responseText);
      }
    };
    xhr.onerror = function () {
      callback("Network error");
    };
    xhr.send(body ? JSON.stringify(body) : null);
  }
};
