window.LyricsApp = window.LyricsApp || {};

// Cloud sync via jsonblob.com - no auth, CORS-friendly
LyricsApp.CloudSync = {
  SETTINGS_KEY: "country_lyrics_sync_settings",
  LAST_SYNC_KEY: "country_lyrics_last_sync",
  API: "https://jsonblob.com/api/jsonBlob",

  _autoSyncTimer: null,
  _autoSyncDelay: 3000,
  _syncInProgress: false,
  _pendingSync: false,
  _listeners: [],

  getSettings: function () {
    try { return JSON.parse(localStorage.getItem(this.SETTINGS_KEY)) || {}; }
    catch (e) { return {}; }
  },

  saveSettings: function (s) {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(s));
  },

  isConfigured: function () {
    return !!this.getSettings().blobId;
  },

  getBlobId: function () {
    return this.getSettings().blobId || null;
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

  // Create new blob (first device)
  createNew: function (callback) {
    var self = this;
    var data = this._buildData();

    this._req("POST", this.API, data, function (err, resp, xhr) {
      if (err) return callback(err);
      // blob ID is in the Location header or response
      var loc = xhr.getResponseHeader("Location") || "";
      var blobId = loc.split("/").pop();
      if (!blobId) return callback("Failed to create blob");
      self.saveSettings({ blobId: blobId });
      self._saveLastSyncTime();
      callback(null, blobId);
    });
  },

  // Join existing blob (second device)
  join: function (blobId, callback) {
    var self = this;
    blobId = blobId.trim();
    if (!blobId) return callback("ID is empty");

    this._req("GET", this.API + "/" + blobId, null, function (err, data) {
      if (err) return callback("ID not found");
      self.saveSettings({ blobId: blobId });
      if (data) self._mergeData(data);
      self._saveLastSyncTime();
      callback(null);
    });
  },

  // Full sync: pull, merge, push
  sync: function (callback) {
    if (!this.isConfigured()) return callback("Not configured");
    var self = this;
    var blobId = this.getSettings().blobId;

    this._req("GET", this.API + "/" + blobId, null, function (err, data) {
      if (err) return callback(err);
      if (data) self._mergeData(data);

      self._req("PUT", self.API + "/" + blobId, self._buildData(), function (err2) {
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
    this._doAutoSync();
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
      var ls = LyricsApp.Store._read();
      var m = {};
      for (var i = 0; i < ls.length; i++) m[ls[i].id] = i;
      for (var j = 0; j < data.songs.length; j++) {
        var r = data.songs[j], idx = m[r.id];
        if (idx === undefined) ls.push(r);
        else if (r.updatedAt > ls[idx].updatedAt) ls[idx] = r;
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

  _req: function (method, url, body, callback) {
    var opts = {
      method: method,
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    };
    if (body) opts.body = JSON.stringify(body);

    fetch(url, opts)
      .then(function (resp) {
        if (!resp.ok) return callback("HTTP " + resp.status);
        var loc = resp.headers.get("Location") || "";
        return resp.text().then(function (text) {
          var data = {};
          try { data = JSON.parse(text); } catch (e) {}
          callback(null, data, { getResponseHeader: function () { return loc; } });
        });
      })
      .catch(function (e) {
        callback("Network error: " + e.message);
      });
  }
};

LyricsApp.NasSync = LyricsApp.CloudSync;
LyricsApp.GistSync = LyricsApp.CloudSync;
