window.LyricsApp = window.LyricsApp || {};

// GitHub Gist sync module
// Stores songs + playlists in a single Gist file
LyricsApp.GistSync = {
  SETTINGS_KEY: "country_lyrics_gist_settings",
  FILENAME: "country-lyrics-data.json",

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
      callback(null, resp.id);
    });
  },

  // Push local data to Gist (overwrite)
  push: function (callback) {
    var settings = this.getSettings();
    if (!settings.token || !settings.gistId) return callback("Not configured");

    var data = this._buildData();
    var body = { files: {} };
    body.files[this.FILENAME] = { content: JSON.stringify(data, null, 2) };

    this._request("PATCH", "https://api.github.com/gists/" + settings.gistId, settings.token, body, function (err) {
      if (err) return callback(err);
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

  // Disconnect: remove settings
  disconnect: function () {
    localStorage.removeItem(this.SETTINGS_KEY);
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
