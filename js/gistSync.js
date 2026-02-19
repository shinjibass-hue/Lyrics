window.LyricsApp = window.LyricsApp || {};

// Synology NAS sync module
// Stores songs + playlists as a JSON file on Synology via File Station API
LyricsApp.NasSync = {
  SETTINGS_KEY: "country_lyrics_nas_settings",
  LAST_SYNC_KEY: "country_lyrics_last_sync",
  REMOTE_PATH: "/home/country-lyrics-data.json",

  // Auto-sync state
  _autoSyncTimer: null,
  _autoSyncDelay: 3000,
  _syncInProgress: false,
  _pendingSync: false,
  _listeners: [],
  _sid: null,

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
    return !!(s.url && s.account && s.passwd);
  },

  getLastSyncTime: function () {
    return localStorage.getItem(this.LAST_SYNC_KEY) || null;
  },

  _saveLastSyncTime: function () {
    localStorage.setItem(this.LAST_SYNC_KEY, new Date().toISOString());
  },

  onStatusChange: function (listener) {
    this._listeners.push(listener);
  },

  _notifyStatus: function (status) {
    for (var i = 0; i < this._listeners.length; i++) {
      this._listeners[i](status);
    }
  },

  // Login to Synology DSM
  _login: function (callback) {
    var settings = this.getSettings();
    if (!settings.url || !settings.account || !settings.passwd) return callback("Not configured");

    // If already have sid, try using it
    if (this._sid) return callback(null, this._sid);

    var url = settings.url + "/webapi/entry.cgi?api=SYNO.API.Auth&version=6&method=login"
      + "&account=" + encodeURIComponent(settings.account)
      + "&passwd=" + encodeURIComponent(settings.passwd)
      + "&format=sid";

    this._get(url, function (err, resp) {
      if (err) return callback(err);
      if (!resp.success) return callback("Login failed" + (resp.error ? " (code " + resp.error.code + ")" : ""));
      LyricsApp.NasSync._sid = resp.data.sid;
      callback(null, resp.data.sid);
    });
  },

  // Download the sync file from NAS
  _download: function (sid, callback) {
    var settings = this.getSettings();
    var url = settings.url + "/webapi/entry.cgi?api=SYNO.FileStation.Download&version=2&method=download"
      + "&path=" + encodeURIComponent(this.REMOTE_PATH)
      + "&mode=open&_sid=" + sid;

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          // If it's an error response from API
          if (data.success === false) return callback("not_found");
          callback(null, data);
        } catch (e) {
          callback("Parse error");
        }
      } else {
        callback("HTTP " + xhr.status);
      }
    };
    xhr.onerror = function () { callback("Network error"); };
    xhr.send();
  },

  // Upload the sync file to NAS
  _upload: function (sid, data, callback) {
    var settings = this.getSettings();
    var url = settings.url + "/webapi/entry.cgi?_sid=" + sid;

    var formData = new FormData();
    formData.append("api", "SYNO.FileStation.Upload");
    formData.append("version", "2");
    formData.append("method", "upload");
    formData.append("path", "/home");
    formData.append("create_parents", "true");
    formData.append("overwrite", "true");
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    formData.append("file", blob, "country-lyrics-data.json");

    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          var resp = JSON.parse(xhr.responseText);
          if (resp.success) return callback(null);
          callback("Upload failed" + (resp.error ? " (code " + resp.error.code + ")" : ""));
        } catch (e) {
          callback("Upload parse error");
        }
      } else {
        callback("HTTP " + xhr.status);
      }
    };
    xhr.onerror = function () { callback("Network error"); };
    xhr.send(formData);
  },

  // Connect: login and do first sync
  connect: function (url, account, passwd, callback) {
    this.saveSettings({ url: url, account: account, passwd: passwd });
    this._sid = null;
    var self = this;

    this._login(function (err) {
      if (err) {
        self.disconnect();
        return callback(err);
      }
      // Try download existing data, then push
      self._download(self._sid, function (dlErr, remoteData) {
        if (!dlErr && remoteData) {
          self._mergeData(remoteData);
        }
        // Push current state
        var data = self._buildData();
        self._upload(self._sid, data, function (upErr) {
          if (upErr) return callback(upErr);
          self._saveLastSyncTime();
          callback(null);
        });
      });
    });
  },

  // Full sync: login, pull, merge, push
  sync: function (callback) {
    if (!this.isConfigured()) return callback("Not configured");
    var self = this;

    this._login(function (loginErr, sid) {
      if (loginErr) {
        self._sid = null;
        // Retry login once
        self._login(function (retryErr, sid2) {
          if (retryErr) return callback(retryErr);
          self._doSync(sid2, callback);
        });
        return;
      }
      self._doSync(sid, callback);
    });
  },

  _doSync: function (sid, callback) {
    var self = this;
    this._download(sid, function (dlErr, remoteData) {
      if (!dlErr && remoteData) {
        self._mergeData(remoteData);
      }
      var data = self._buildData();
      self._upload(sid, data, function (upErr) {
        if (upErr) return callback(upErr);
        self._saveLastSyncTime();
        callback(null);
      });
    });
  },

  // Auto-sync
  startAutoSync: function () {
    if (!this.isConfigured()) return;
    var self = this;

    this._doAutoSync();

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible" && self.isConfigured()) {
        self._doAutoSync();
      }
    });

    window.addEventListener("online", function () {
      if (self.isConfigured()) self._doAutoSync();
    });

    window.addEventListener("offline", function () {
      self._notifyStatus("offline");
    });
  },

  scheduleSync: function () {
    if (!this.isConfigured()) return;
    var self = this;
    if (this._autoSyncTimer) clearTimeout(this._autoSyncTimer);
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
        self._notifyStatus("error");
      } else {
        self._notifyStatus("synced");
        if (LyricsApp.SongListView && document.getElementById("view-song-list").classList.contains("active")) {
          LyricsApp.SongListView.render(document.getElementById("search-input").value);
        }
      }
      if (self._pendingSync) {
        self._pendingSync = false;
        self._doAutoSync();
      }
    });
  },

  disconnect: function () {
    localStorage.removeItem(this.SETTINGS_KEY);
    localStorage.removeItem(this.LAST_SYNC_KEY);
    this._sid = null;
    if (this._autoSyncTimer) {
      clearTimeout(this._autoSyncTimer);
      this._autoSyncTimer = null;
    }
    this._notifyStatus("disconnected");
  },

  _buildData: function () {
    return {
      version: 1,
      syncedAt: new Date().toISOString(),
      songs: LyricsApp.Store.getAll(),
      playlists: LyricsApp.PlaylistStore.getAll()
    };
  },

  _mergeData: function (data) {
    LyricsApp.Store._suppressSync = true;
    LyricsApp.PlaylistStore._suppressSync = true;

    if (data.songs && Array.isArray(data.songs)) {
      var localSongs = LyricsApp.Store._read();
      var localMap = {};
      for (var i = 0; i < localSongs.length; i++) {
        localMap[localSongs[i].id] = i;
      }
      for (var j = 0; j < data.songs.length; j++) {
        var remote = data.songs[j];
        var idx = localMap[remote.id];
        if (idx === undefined) {
          localSongs.push(remote);
        } else if (remote.updatedAt > localSongs[idx].updatedAt) {
          localSongs[idx] = remote;
        }
      }
      LyricsApp.Store._write(localSongs);
    }

    if (data.playlists && Array.isArray(data.playlists)) {
      var localPl = LyricsApp.PlaylistStore._read();
      var plMap = {};
      for (var m = 0; m < localPl.length; m++) {
        plMap[localPl[m].id] = m;
      }
      for (var n = 0; n < data.playlists.length; n++) {
        var rpl = data.playlists[n];
        var pidx = plMap[rpl.id];
        if (pidx === undefined) {
          localPl.push(rpl);
        } else if (rpl.updatedAt > localPl[pidx].updatedAt) {
          localPl[pidx] = rpl;
        }
      }
      LyricsApp.PlaylistStore._write(localPl);
    }

    LyricsApp.Store._suppressSync = false;
    LyricsApp.PlaylistStore._suppressSync = false;
  },

  _get: function (url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try { callback(null, JSON.parse(xhr.responseText)); }
        catch (e) { callback("Parse error"); }
      } else {
        callback("HTTP " + xhr.status);
      }
    };
    xhr.onerror = function () { callback("Network error"); };
    xhr.send();
  }
};

// Backward compatibility alias
LyricsApp.GistSync = LyricsApp.NasSync;
