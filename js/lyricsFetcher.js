window.LyricsApp = window.LyricsApp || {};

LyricsApp.LyricsFetcher = {
  API_BASE: "https://lrclib.net/api/search",

  // Returns just lyrics text
  fetch: function (title, artist) {
    return this.fetchFull(title, artist).then(function (info) {
      return info.lyrics;
    });
  },

  // Extract best result with plainLyrics
  _pickBest: function (results) {
    if (!results || results.length === 0) return null;
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
    return null;
  },

  // Search API with given params, returns promise of results array
  _searchAPI: function (params) {
    var parts = [];
    for (var key in params) {
      if (params[key]) {
        parts.push(key + "=" + encodeURIComponent(params[key]));
      }
    }
    var url = this.API_BASE + "?" + parts.join("&");

    return window.fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error("API error: " + res.status);
        return res.json();
      })
      .then(function (results) {
        return results || [];
      })
      .catch(function () {
        return [];
      });
  },

  // Returns full info: { artistName, lyrics, duration }
  // Tries multiple search strategies for better matching
  fetchFull: function (title, artist) {
    var self = this;

    // Strategy 1: exact track_name + artist_name
    return this._searchAPI({ track_name: title, artist_name: artist })
      .then(function (results) {
        var best = self._pickBest(results);
        if (best) return best;

        // Strategy 2: track_name only (drop artist)
        if (artist) {
          return self._searchAPI({ track_name: title })
            .then(function (results2) {
              var best2 = self._pickBest(results2);
              if (best2) return best2;
              return null;
            });
        }
        return null;
      })
      .then(function (result) {
        if (result) return result;

        // Strategy 3: free-text search with "q" param (fuzzy)
        var q = title;
        if (artist) q = artist + " " + title;
        return self._searchAPI({ q: q })
          .then(function (results3) {
            var best3 = self._pickBest(results3);
            if (best3) return best3;
            return null;
          });
      })
      .then(function (result) {
        if (result) return result;

        // Strategy 4: simplified title (remove parentheses, punctuation)
        var simplified = title
          .replace(/\(.*?\)/g, "")
          .replace(/\[.*?\]/g, "")
          .replace(/['']/g, "'")
          .replace(/[^a-zA-Z0-9\s']/g, "")
          .replace(/\s+/g, " ")
          .trim();

        if (simplified && simplified !== title) {
          return self._searchAPI({ q: simplified })
            .then(function (results4) {
              var best4 = self._pickBest(results4);
              if (best4) return best4;
              throw new Error("No lyrics found");
            });
        }

        throw new Error("No lyrics found");
      });
  },

  // Collect all candidates with plainLyrics from results array
  _collectCandidates: function (results) {
    var candidates = [];
    if (!results || results.length === 0) return candidates;
    for (var i = 0; i < results.length; i++) {
      if (results[i].plainLyrics) {
        candidates.push({
          artistName: results[i].artistName || "",
          lyrics: results[i].plainLyrics,
          duration: results[i].duration || 0,
          albumName: results[i].albumName || "",
          trackName: results[i].trackName || results[i].name || ""
        });
      }
    }
    return candidates;
  },

  // Search and return ALL candidates (for user selection)
  fetchCandidates: function (title, artist) {
    var self = this;
    var allCandidates = [];
    var seenKeys = {};

    function addUnique(candidates) {
      for (var i = 0; i < candidates.length; i++) {
        var key = candidates[i].trackName + "|" + candidates[i].artistName + "|" + candidates[i].albumName;
        if (!seenKeys[key]) {
          seenKeys[key] = true;
          allCandidates.push(candidates[i]);
        }
      }
    }

    // Strategy 1: exact track_name + artist_name
    return this._searchAPI({ track_name: title, artist_name: artist })
      .then(function (results) {
        addUnique(self._collectCandidates(results));

        // Strategy 2: track_name only
        if (artist) {
          return self._searchAPI({ track_name: title }).then(function (r2) {
            addUnique(self._collectCandidates(r2));
          });
        }
      })
      .then(function () {
        // Strategy 3: free-text
        var q = title;
        if (artist) q = artist + " " + title;
        return self._searchAPI({ q: q }).then(function (r3) {
          addUnique(self._collectCandidates(r3));
        });
      })
      .then(function () {
        // Strategy 4: simplified title
        var simplified = title
          .replace(/\(.*?\)/g, "")
          .replace(/\[.*?\]/g, "")
          .replace(/['']/g, "'")
          .replace(/[^a-zA-Z0-9\s']/g, "")
          .replace(/\s+/g, " ")
          .trim();
        if (simplified && simplified !== title) {
          return self._searchAPI({ q: simplified }).then(function (r4) {
            addUnique(self._collectCandidates(r4));
          });
        }
      })
      .then(function () {
        return allCandidates;
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
          linesPerSlide: song.linesPerSlide || 1,
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
