window.LyricsApp = window.LyricsApp || {};

// User-adjustable settings persisted in localStorage.
LyricsApp.Settings = {
  AUTO_TRANSLATE_KEY: "country_lyrics_auto_translate",

  // Auto-translate right after fetching lyrics. OFF by default — translation
  // only runs when the user explicitly turns this on. This is what stopped
  // the silent flood of 1000 translation requests.
  autoTranslateOnFetch: function () {
    return localStorage.getItem(this.AUTO_TRANSLATE_KEY) === "1";
  },
  setAutoTranslateOnFetch: function (on) {
    localStorage.setItem(this.AUTO_TRANSLATE_KEY, on ? "1" : "0");
  }
};

// Tracks how many characters were sent to DeepL each month, so the free
// tier (500,000 chars/month) is never exceeded.
LyricsApp.TranslateUsage = {
  USAGE_ENDPOINT: "/api/deepl-usage",
  KEY: "country_lyrics_deepl_usage",
  LIMIT: 500000,
  WARN: 450000,

  _month: function () {
    var d = new Date();
    var m = d.getMonth() + 1;
    return d.getFullYear() + "-" + (m < 10 ? "0" + m : m);
  },

  _read: function () {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || {}; }
    catch (e) { return {}; }
  },

  get: function () {
    return this._read()[this._month()] || 0;
  },

  add: function (chars) {
    if (!chars || chars <= 0) return this.get();
    var data = this._read();
    var mk = this._month();
    data[mk] = (data[mk] || 0) + chars;
    try { localStorage.setItem(this.KEY, JSON.stringify(data)); } catch (e) {}
    return data[mk];
  },

  // true if `estimate` more chars would push us over the monthly limit
  wouldExceed: function (estimate) {
    return (this.get() + (estimate || 0)) > this.LIMIT;
  },

  isWarn: function () {
    return this.get() >= this.WARN;
  },

  // Rough estimate of billable chars for a set of lyrics (mirrors the
  // server's rule: skip blank lines and [Section] headers).
  estimateChars: function (rawLyrics) {
    if (!rawLyrics) return 0;
    var lines = rawLyrics.split(/\n/);
    var total = 0;
    for (var i = 0; i < lines.length; i++) {
      var s = lines[i].trim();
      if (s === "" || /^\[.*\]$/.test(s)) continue;
      total += s.length;
    }
    return total;
  },

  // Real usage straight from DeepL (via the local server). Resolves with
  // { count, limit }; rejects with an Error whose .code is set on failure.
  fetchReal: function () {
    return window.fetch(this.USAGE_ENDPOINT)
      .then(function (res) { return res.json().catch(function () { return null; }); })
      .then(function (data) {
        if (!data || data.error) {
          var e = new Error((data && data.error) || "usage_unavailable");
          e.code = (data && data.error) || "usage_unavailable";
          if (data && data.status !== undefined) e.status = data.status;
          throw e;
        }
        return {
          count: data.character_count || 0,
          limit: data.character_limit || 0
        };
      });
  }
};

LyricsApp.LyricsFetcher = {
  API_BASE: "https://lrclib.net/api/search",
  TRANSLATE_ENDPOINT: "/api/translate",

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

  // Human-readable Japanese message for a translation/usage error. One place
  // so every screen says the same thing (incl. the 456 quota case).
  translateErrorMessage: function (err) {
    var code = err && err.code;
    var status = err && err.status;
    if (code === "deepl_key_missing") return "DEEPL_KEY が渡されていません。vault exec 経由で起動してください";
    if (code === "usage_limit") return "今月の DeepL 無料枠に達しています";
    if (code === "deepl_http_error" && status === 456) return "DeepL の無料枠を使い切りました";
    if (code === "deepl_http_error") return "DeepL でエラーが発生しました（HTTP " + status + "）";
    if (code === "length_mismatch" || (err && err.message === "length_mismatch")) return "行数が合わず保存を中止しました";
    if (code === "usage_unavailable") return "DeepL の使用量を取得できませんでした。サーバーを vault exec 経由で起動してください";
    return "翻訳に失敗しました";
  },

  // A fatal DeepL condition means "stop the whole run", not "skip one song".
  isFatalTranslateError: function (err) {
    if (!err) return false;
    if (err.code === "deepl_key_missing" || err.code === "usage_limit") return true;
    if (err.code === "deepl_http_error") return true; // incl. 456 quota
    return false;
  },

  // 訳す対象のアーティスト（2026-08-14 信二さんの指定）。
  // 小文字の部分一致で見ます。共演名義（"Waylon & Willie" など）も拾えます。
  // 対象外の曲に無料枠を使わないための絞り込みです。増やすときはここに足してください。
  TARGET_ARTISTS: [
    "willie nelson",
    "waylon",
    "merle haggard",
    "johnny cash",
    "kris kristofferson",
    "alan jackson",
    "george strait",
    "paycheck",
    "jerry jeff",
    "jimmy buffett"
  ],

  isTargetArtist: function (artist) {
    var a = (artist || "").toLowerCase();
    if (!a) return false;
    for (var i = 0; i < this.TARGET_ARTISTS.length; i++) {
      if (a.indexOf(this.TARGET_ARTISTS[i]) !== -1) return true;
    }
    return false;
  },

  // Songs that have lyrics but no translation yet (the bulk-translate set).
  // targetsOnly = true なら TARGET_ARTISTS の曲だけに絞ります。
  pendingForTranslation: function (targetsOnly) {
    var self = this;
    return LyricsApp.Store.getAll().filter(function (s) {
      var hasLyrics = s.lyrics && s.lyrics.trim();
      var hasJa = s.lyricsJa && s.lyricsJa.trim();
      if (!hasLyrics || hasJa || s.lyricsJaSource === "manual") return false;
      if (targetsOnly && !self.isTargetArtist(s.artist)) return false;
      return true;
    });
  },

  // Fetch lyrics for a single song and save it (also fills artist if empty).
  // Auto-translation runs ONLY when the user has explicitly enabled it
  // (LyricsApp.Settings.autoTranslateOnFetch). Errors are never swallowed.
  fetchAndSave: function (songId) {
    var self = this;
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
        if (!LyricsApp.Settings.autoTranslateOnFetch()) {
          return info.lyrics;
        }
        // Opt-in only. Let a fatal error propagate so the caller can surface it.
        return self.translateSong(songId).then(function () { return info.lyrics; });
      });
  },

  // Call the local translate endpoint. Resolves with { lines, chars } or
  // rejects with an Error whose .code is set for known conditions.
  _requestTranslation: function (lines) {
    return window.fetch(this.TRANSLATE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines: lines })
    }).then(function (res) {
      return res.json().catch(function () { return null; });
    }).then(function (data) {
      if (data && data.error) {
        var err = new Error(data.error);
        err.code = data.error;
        if (data.status !== undefined) err.status = data.status;
        throw err;
      }
      if (!data || !data.lines) {
        throw new Error("bad_response");
      }
      return data;
    });
  },

  // Translate one song's lyrics to Japanese and save the result.
  // opts.force = true allows overwriting a manual translation (user-initiated).
  // Resolves with the Japanese text on success, or null when skipped.
  translateSong: function (songId, opts) {
    opts = opts || {};
    var song = LyricsApp.Store.getById(songId);
    if (!song || !song.lyrics || !song.lyrics.trim()) return Promise.resolve(null);

    // Never overwrite a hand-edited translation unless explicitly forced.
    if (!opts.force && song.lyricsJaSource === "manual") return Promise.resolve(null);
    // Skip if already translated (auto path only).
    if (!opts.force && song.lyricsJa && song.lyricsJa.trim()) return Promise.resolve(null);

    var estimate = LyricsApp.TranslateUsage.estimateChars(song.lyrics);
    if (estimate <= 0) return Promise.resolve(null);
    if (LyricsApp.TranslateUsage.wouldExceed(estimate)) {
      var limitErr = new Error("usage_limit");
      limitErr.code = "usage_limit";
      return Promise.reject(limitErr);
    }

    var lines = song.lyrics.split(/\n/);
    return this._requestTranslation(lines).then(function (data) {
      // Line correspondence is mandatory — bail without saving on mismatch.
      if (!data.lines || data.lines.length !== lines.length) {
        var mErr = new Error("length_mismatch");
        mErr.code = "length_mismatch";
        throw mErr;
      }
      LyricsApp.TranslateUsage.add(data.chars || 0);
      var ja = data.lines.join("\n");
      LyricsApp.Store.update(songId, { lyricsJa: ja, lyricsJaSource: "deepl" });
      return ja;
    });
  },

  // Bulk-translate every song that has lyrics but no translation yet.
  // onProgress receives { completed, total, succeeded, failed, chars, done, stopped, reason }.
  // shouldStop() is polled between songs to allow cancellation.
  translateAll: function (onProgress, shouldStop, targetsOnly) {
    var self = this;
    var pending = this.pendingForTranslation(targetsOnly);
    var total = pending.length;
    var completed = 0, succeeded = 0, failed = 0;

    function report(extra) {
      if (!onProgress) return;
      var base = {
        completed: completed, total: total,
        succeeded: succeeded, failed: failed,
        chars: LyricsApp.TranslateUsage.get()
      };
      for (var k in extra) base[k] = extra[k];
      onProgress(base);
    }

    if (total === 0) {
      report({ done: true, stopped: false });
      return Promise.resolve();
    }

    function processNext(index) {
      if (index >= pending.length) {
        report({ done: true, stopped: false });
        return Promise.resolve();
      }
      if (shouldStop && shouldStop()) {
        report({ done: true, stopped: true });
        return Promise.resolve();
      }
      // Stop before exceeding the monthly limit.
      if (LyricsApp.TranslateUsage.get() >= LyricsApp.TranslateUsage.LIMIT) {
        report({ done: true, stopped: true, reason: "usage_limit" });
        return Promise.resolve();
      }

      var song = pending[index];
      return self.translateSong(song.id)
        .then(function (ja) {
          if (ja) succeeded++; else failed++;
        })
        .catch(function (err) {
          failed++;
          if (self.isFatalTranslateError(err)) {
            // Fatal for the whole run — surface and stop.
            completed++;
            report({ done: true, stopped: true, reason: err.code, status: err.status });
            throw err; // short-circuit the chain
          }
        })
        .then(function () {
          completed++;
          report({ done: false, stopped: false });
          return new Promise(function (resolve) { setTimeout(resolve, 300); });
        })
        .then(function () {
          return processNext(index + 1);
        });
    }

    return processNext(0).catch(function () { /* already reported */ });
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
