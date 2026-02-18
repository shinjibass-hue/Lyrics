window.LyricsApp = window.LyricsApp || {};

LyricsApp.LyricsFetcher = {
  API_BASE: "https://lrclib.net/api/search",

  // Returns just lyrics text
  fetch: function (title, artist) {
    return this.fetchFull(title, artist).then(function (info) {
      return info.lyrics;
    });
  },

  // Returns full info: { artistName, lyrics, duration }
  fetchFull: function (title, artist) {
    var url = this.API_BASE +
      "?track_name=" + encodeURIComponent(title);
    if (artist) {
      url += "&artist_name=" + encodeURIComponent(artist);
    }

    return window.fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error("API error: " + res.status);
        return res.json();
      })
      .then(function (results) {
        if (!results || results.length === 0) {
          throw new Error("No lyrics found");
        }
        // Find best match: prefer one with plainLyrics
        for (var i = 0; i < results.length; i++) {
          if (results[i].plainLyrics) {
            return {
              artistName: results[i].artistName || "",
              lyrics: results[i].plainLyrics,
              duration: results[i].duration || 0,
              albumName: results[i].albumName || "",
              trackName: results[i].trackName || results[i].name || ""
            };
          }
        }
        throw new Error("No lyrics found");
      });
  },

  // Fetch lyrics for a single song and save it (also fills artist if empty)
  fetchAndSave: function (songId) {
    var song = LyricsApp.Store.getById(songId);
    if (!song) return Promise.reject(new Error("Song not found"));

    return this.fetchFull(song.title, song.artist)
      .then(function (info) {
        LyricsApp.Store.update(songId, {
          title: song.title,
          artist: song.artist || info.artistName,
          bpm: song.bpm,
          beatsPerLine: song.beatsPerLine,
          lyrics: info.lyrics
        });
        return info.lyrics;
      });
  },

  // Bulk fetch for all songs missing lyrics
  fetchAll: function (onProgress) {
    var songs = LyricsApp.Store.getAll();
    var missing = songs.filter(function (s) { return !s.lyrics || !s.lyrics.trim(); });
    var total = missing.length;
    var completed = 0;
    var succeeded = 0;
    var failed = 0;

    if (total === 0) {
      if (onProgress) onProgress({ completed: 0, total: 0, succeeded: 0, failed: 0, done: true });
      return Promise.resolve();
    }

    // Process sequentially with a small delay to avoid rate limiting
    var self = this;
    function processNext(index) {
      if (index >= missing.length) {
        if (onProgress) onProgress({ completed: completed, total: total, succeeded: succeeded, failed: failed, done: true });
        return Promise.resolve();
      }

      var song = missing[index];
      return self.fetchAndSave(song.id)
        .then(function () {
          succeeded++;
        })
        .catch(function () {
          failed++;
        })
        .then(function () {
          completed++;
          if (onProgress) onProgress({ completed: completed, total: total, succeeded: succeeded, failed: failed, done: false });
          // 500ms delay between requests
          return new Promise(function (resolve) {
            setTimeout(resolve, 500);
          });
        })
        .then(function () {
          return processNext(index + 1);
        });
    }

    return processNext(0);
  }
};
