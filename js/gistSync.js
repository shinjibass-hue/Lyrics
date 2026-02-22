window.LyricsApp = window.LyricsApp || {};

// Cloud sync via Firebase Realtime Database (with Anonymous Auth)
LyricsApp.CloudSync = {
  SETTINGS_KEY: "country_lyrics_sync_settings",
  LAST_SYNC_KEY: "country_lyrics_last_sync",
  DB_URL: "https://country-lyrics-d9b76-default-rtdb.firebaseio.com",

  _autoSyncTimer: null,
  _autoSyncDelay: 3000,
  _syncInProgress: false,
  _pendingSync: false,
  _listeners: [],
  _firebaseInited: false,

  getSettings: function () {
    try { return JSON.parse(localStorage.getItem(this.SETTINGS_KEY)) || {}; }
    catch (e) { return {}; }
  },

  saveSettings: function (s) {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(s));
  },

  isConfigured: function () {
    var s = this.getSettings();
    return !!s.syncId && !!s.apiKey;
  },

  hasSyncId: function () {
    return !!this.getSettings().syncId;
  },

  getSyncId: function () {
    return this.getSettings().syncId || null;
  },

  // Keep backward compat with UI code that calls getBlobId
  getBlobId: function () {
    return this.getSyncId();
  },

  getLastSyncTime: function () {
    return localStorage.getItem(this.LAST_SYNC_KEY) || null;
  },

  _saveLastSyncTime: function () {
    localStorage.setItem(this.LAST_SYNC_KEY, new Date().toISOString());
  },

  onStatusChange: function (fn) { this._listeners.push(fn); },

  _notifyStatus: function (s) {
    for (var i = 0; i < this._listeners.length; i++) this._listeners[i](s);
  },

  _generateId: function () {
    var chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    var id = "";
    for (var i = 0; i < 8; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  },

  _syncUrl: function (syncId) {
    return this.DB_URL + "/sync/" + syncId + ".json";
  },

  // Initialize Firebase App + Anonymous Auth
  _initFirebase: function (callback) {
    if (typeof firebase === "undefined") {
      return callback("Firebase SDK not loaded");
    }

    var settings = this.getSettings();
    if (!settings.apiKey) {
      return callback("API Key not set. Open Sync settings to configure.");
    }

    // Initialize Firebase App once
    if (!this._firebaseInited) {
      try {
        firebase.initializeApp({
          apiKey: settings.apiKey,
          authDomain: "country-lyrics-d9b76.firebaseapp.com",
          databaseURL: this.DB_URL,
          projectId: "country-lyrics-d9b76"
        });
      } catch (e) {
        // App already initialized
      }
      this._firebaseInited = true;
    }

    // Sign in anonymously if not already signed in
    var auth = firebase.auth();
    if (auth.currentUser) {
      return callback(null);
    }

    auth.signInAnonymously()
      .then(function () { callback(null); })
      .catch(function (e) { callback("Auth failed: " + e.message); });
  },

  // Get fresh ID token (auto-refreshes if expired)
  _getToken: function (callback) {
    var self = this;
    this._initFirebase(function (err) {
      if (err) return callback(err);
      var user = firebase.auth().currentUser;
      if (!user) return callback("Not authenticated");
      user.getIdToken().then(function (token) {
        callback(null, token);
      }).catch(function (e) {
        callback("Token error: " + e.message);
      });
    });
  },

  // Create new sync (first device)
  createNew: function (callback) {
    var self = this;
    var syncId = this._generateId();
    var data = this._buildData();

    this._req("PUT", this._syncUrl(syncId), data, function (err) {
      if (err) return callback(err);
      var settings = self.getSettings();
      settings.syncId = syncId;
      self.saveSettings(settings);
      self._saveLastSyncTime();
      callback(null, syncId);
    });
  },

  // Join existing sync (other devices)
  join: function (syncId, callback) {
    var self = this;
    syncId = syncId.trim().toLowerCase();
    if (!syncId) return callback("ID is empty");

    this._req("GET", this._syncUrl(syncId), null, function (err, data) {
      if (err) return callback(err);
      if (!data || !data.songs) return callback("ID not found");
      var settings = self.getSettings();
      settings.syncId = syncId;
      self.saveSettings(settings);
      self._mergeData(data);
      self._saveLastSyncTime();
      callback(null);
    });
  },

  // Full sync: pull, merge, push
  sync: function (callback) {
    if (!this.isConfigured()) return callback("Not configured");
    var self = this;
    var syncId = this.getSettings().syncId;

    this._req("GET", this._syncUrl(syncId), null, function (err, data) {
      if (err) return callback(err);
      if (data) self._mergeData(data);

      self._req("PUT", self._syncUrl(syncId), self._buildData(), function (err2) {
        if (err2) return callback(err2);
        self._saveLastSyncTime();
        callback(null);
      });
    });
  },

  // Auto-sync
  startAutoSync: function () {
    if (!this.isConfigured()) return;
    var self = this;

    // Initialize Firebase auth first
    this._initFirebase(function (err) {
      if (err) {
        self._notifyStatus("error");
        return;
      }
      self._doAutoSync();
    });

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible" && self.isConfigured()) self._doAutoSync();
    });
    window.addEventListener("online", function () {
      if (self.isConfigured()) self._doAutoSync();
    });
    window.addEventListener("offline", function () { self._notifyStatus("offline"); });
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
    if (this._syncInProgress) { this._pendingSync = true; return; }
    if (!navigator.onLine) { this._notifyStatus("offline"); return; }
    var self = this;
    this._syncInProgress = true;
    this._notifyStatus("syncing");
    this.sync(function (err) {
      self._syncInProgress = false;
      self._notifyStatus(err ? "error" : "synced");
      if (!err && LyricsApp.SongListView && document.getElementById("view-song-list").classList.contains("active")) {
        LyricsApp.SongListView.render(document.getElementById("search-input").value);
      }
      if (self._pendingSync) { self._pendingSync = false; self._doAutoSync(); }
    });
  },

  disconnect: function () {
    localStorage.removeItem(this.SETTINGS_KEY);
    localStorage.removeItem(this.LAST_SYNC_KEY);
    if (this._autoSyncTimer) { clearTimeout(this._autoSyncTimer); this._autoSyncTimer = null; }
    this._firebaseInited = false;
    this._notifyStatus("disconnected");
  },

  _buildData: function () {
    return {
      version: 1,
      syncedAt: new Date().toISOString(),
      songs: LyricsApp.Store.getAllIncludingDeleted(),
      playlists: LyricsApp.PlaylistStore.getAll()
    };
  },

  // Force push: overwrite remote with local data (no merge)
  forcePush: function (callback) {
    if (!this.hasSyncId()) return callback("No sync ID");
    var self = this;
    var syncId = this.getSettings().syncId;
    this._req("PUT", this._syncUrl(syncId), this._buildData(), function (err) {
      if (err) return callback(err);
      self._saveLastSyncTime();
      callback(null);
    });
  },

  _mergeData: function (data) {
    LyricsApp.Store._suppressSync = true;
    LyricsApp.PlaylistStore._suppressSync = true;

    if (data.songs && Array.isArray(data.songs)) {
      var ls = LyricsApp.Store._read();
      var m = {};
      for (var i = 0; i < ls.length; i++) m[ls[i].id] = i;
      for (var j = 0; j < data.songs.length; j++) {
        var r = data.songs[j], idx = m[r.id];
        if (idx === undefined) {
          // Only add if not deleted on remote
          if (!r.deleted) ls.push(r);
        } else if (r.updatedAt > ls[idx].updatedAt) {
          ls[idx] = r;
        }
      }
      LyricsApp.Store._write(ls);
    }

    if (data.playlists && Array.isArray(data.playlists)) {
      var lp = LyricsApp.PlaylistStore._read();
      var pm = {};
      for (var k = 0; k < lp.length; k++) pm[lp[k].id] = k;
      for (var n = 0; n < data.playlists.length; n++) {
        var rp = data.playlists[n], pi = pm[rp.id];
        if (pi === undefined) lp.push(rp);
        else if (rp.updatedAt > lp[pi].updatedAt) lp[pi] = rp;
      }
      LyricsApp.PlaylistStore._write(lp);
    }

    LyricsApp.Store._suppressSync = false;
    LyricsApp.PlaylistStore._suppressSync = false;
  },

  // HTTP request with Firebase Auth token
  _req: function (method, url, body, callback) {
    var self = this;
    this._getToken(function (err, token) {
      if (err) return callback(err);

      var authUrl = url + "?auth=" + token;
      var opts = {
        method: method,
        mode: "cors",
        headers: { "Content-Type": "application/json" }
      };
      if (body) opts.body = JSON.stringify(body);

      fetch(authUrl, opts)
        .then(function (resp) {
          if (!resp.ok) return callback("HTTP " + resp.status);
          return resp.json().then(function (data) {
            callback(null, data);
          });
        })
        .catch(function (e) {
          callback("Network error: " + e.message);
        });
    });
  }
};
