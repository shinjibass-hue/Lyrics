window.LyricsApp = window.LyricsApp || {};

LyricsApp.Store = {
  STORAGE_KEY: "country_lyrics_songs",
  SORT_KEY: "country_lyrics_sort_mode",
  _suppressSync: false, // true when writing from merge (prevents sync loop)

  _read: function () {
    try {
      var data = localStorage.getItem(this.STORAGE_KEY);
      var songs = data ? JSON.parse(data) : [];
      // Migration: ensure translation fields exist on legacy data.
      for (var i = 0; i < songs.length; i++) {
        if (songs[i].lyricsJa === undefined || songs[i].lyricsJa === null) {
          songs[i].lyricsJa = "";
        }
        if (songs[i].lyricsJaSource === undefined || songs[i].lyricsJaSource === null) {
          songs[i].lyricsJaSource = "";
        }
      }
      return songs;
    } catch (e) {
      return [];
    }
  },

  _write: function (songs) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(songs));
      if (!this._suppressSync && LyricsApp.CloudSync) {
        LyricsApp.CloudSync.scheduleSync();
      }
    } catch (e) {
      alert("Storage limit reached. Please delete some songs.");
    }
  },

  getSortMode: function () {
    return localStorage.getItem(this.SORT_KEY) || "manual";
  },

  setSortMode: function (mode) {
    localStorage.setItem(this.SORT_KEY, mode);
  },

  // Get all songs (excluding soft-deleted), sorted by current mode
  getAll: function (sortMode) {
    var mode = sortMode || this.getSortMode();
    var songs = this._read().filter(function (s) { return !s.deleted; });

    if (mode === "title") {
      songs.sort(function (a, b) {
        return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
      });
    } else if (mode === "artist") {
      songs.sort(function (a, b) {
        var aa = (a.artist || "").toLowerCase();
        var ba = (b.artist || "").toLowerCase();
        var cmp = aa.localeCompare(ba);
        if (cmp !== 0) return cmp;
        return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
      });
    } else {
      // manual: sort by order field
      songs.sort(function (a, b) {
        var oa = (typeof a.order === "number") ? a.order : 99999;
        var ob = (typeof b.order === "number") ? b.order : 99999;
        if (oa !== ob) return oa - ob;
        return a.createdAt - b.createdAt;
      });
    }
    return songs;
  },

  // Get all songs including deleted (for sync)
  getAllIncludingDeleted: function () {
    return this._read();
  },

  reorder: function (fromIndex, toIndex) {
    var songs = this.getAll();
    if (fromIndex < 0 || fromIndex >= songs.length) return;
    if (toIndex < 0 || toIndex >= songs.length) return;
    var item = songs.splice(fromIndex, 1)[0];
    songs.splice(toIndex, 0, item);
    // Update order field for all
    for (var i = 0; i < songs.length; i++) {
      songs[i].order = i;
    }
    this._write(songs);
  },

  getById: function (id) {
    var songs = this._read();
    for (var i = 0; i < songs.length; i++) {
      if (songs[i].id === id) return songs[i];
    }
    return null;
  },

  // THE single place that decides when two songs are "the same song":
  // title + artist, both trimmed and lower-cased. Title alone would merge
  // different artists' covers, so both are always used. import / create /
  // seedPresets / dedup all match through this function so the rule can
  // never drift between call sites.
  songKey: function (title, artist) {
    return (title || "").trim().toLowerCase() + "|||" + (artist || "").trim().toLowerCase();
  },

  // Find a non-deleted song matching title+artist (via songKey), or null.
  _findLiveByKey: function (songs, title, artist) {
    var key = this.songKey(title, artist);
    for (var i = 0; i < songs.length; i++) {
      if (songs[i].deleted) continue;
      if (this.songKey(songs[i].title, songs[i].artist) === key) return songs[i];
    }
    return null;
  },

  // Returns { duplicate:false, song } on create, or { duplicate:true, song }
  // (the existing match) when a song with the same title+artist already
  // exists — in that case nothing is added.
  create: function (data) {
    var songs = this._read();
    var dup = this._findLiveByKey(songs, data.title, data.artist);
    if (dup) return { duplicate: true, song: dup };
    var now = Date.now();
    var maxOrder = 0;
    for (var i = 0; i < songs.length; i++) {
      if (typeof songs[i].order === "number" && songs[i].order >= maxOrder) {
        maxOrder = songs[i].order + 1;
      }
    }
    var song = {
      id: "song_" + now,
      title: data.title.trim(),
      artist: (data.artist || "").trim(),
      bpm: Math.max(1, Math.min(300, parseInt(data.bpm, 10) || 120)),
      beatsPerLine: Math.max(1, Math.min(64, parseInt(data.beatsPerLine, 10) || 8)),
      linesPerSlide: Math.max(1, Math.min(10, parseInt(data.linesPerSlide, 10) || 1)),
      lyrics: data.lyrics || "",
      lyricsJa: data.lyricsJa || "",
      lyricsJaSource: data.lyricsJaSource || "",
      order: maxOrder,
      createdAt: now,
      updatedAt: now
    };
    songs.push(song);
    this._write(songs);
    return { duplicate: false, song: song };
  },

  update: function (id, data) {
    var songs = this._read();
    for (var i = 0; i < songs.length; i++) {
      if (songs[i].id === id) {
        songs[i].title = data.title.trim();
        songs[i].artist = (data.artist || "").trim();
        songs[i].bpm = Math.max(1, Math.min(300, parseInt(data.bpm, 10) || 120));
        songs[i].beatsPerLine = Math.max(1, Math.min(64, parseInt(data.beatsPerLine, 10) || 8));
        songs[i].linesPerSlide = Math.max(1, Math.min(10, parseInt(data.linesPerSlide, 10) || 1));
        songs[i].lyrics = data.lyrics || "";
        // Only touch translation fields when the caller provides them, so
        // lyrics-only updates (e.g. from the fetcher) never clobber a translation.
        if (data.lyricsJa !== undefined) songs[i].lyricsJa = data.lyricsJa;
        if (data.lyricsJaSource !== undefined) songs[i].lyricsJaSource = data.lyricsJaSource;
        songs[i].updatedAt = Date.now();
        this._write(songs);
        return songs[i];
      }
    }
    return null;
  },

  updateField: function (id, field, value) {
    var songs = this._read();
    for (var i = 0; i < songs.length; i++) {
      if (songs[i].id === id) {
        songs[i][field] = value;
        songs[i].updatedAt = Date.now();
        this._write(songs);
        return songs[i];
      }
    }
    return null;
  },

  delete: function (id) {
    var songs = this._read();
    for (var i = 0; i < songs.length; i++) {
      if (songs[i].id === id) {
        songs[i].deleted = true;
        songs[i].updatedAt = Date.now();
        break;
      }
    }
    this._write(songs);
  },

  search: function (query) {
    if (!query || !query.trim()) return this.getAll();
    var q = query.trim().toLowerCase();
    return this.getAll().filter(function (song) {
      return song.title.toLowerCase().indexOf(q) !== -1 ||
             song.artist.toLowerCase().indexOf(q) !== -1;
    });
  },

  // Seed preset outlaw country standards (adds missing presets with deterministic IDs)
  seedPresets: function () {
    var songs = this._read();
    var presets = LyricsApp.Presets || [];
    if (presets.length === 0) return;

    // Deduplicate existing songs first
    this._deduplicateSongs(songs);

    // Build lookup of existing IDs and title+artist keys (so covers with the
    // same title but different artists are still seeded).
    var existingIds = {};
    var existingKeys = {};
    for (var e = 0; e < songs.length; e++) {
      if (!songs[e].deleted) {
        existingIds[songs[e].id] = true;
        existingKeys[this.songKey(songs[e].title, songs[e].artist)] = true;
      }
    }

    // Find max order
    var maxOrder = 0;
    for (var o = 0; o < songs.length; o++) {
      if (typeof songs[o].order === "number" && songs[o].order >= maxOrder) {
        maxOrder = songs[o].order + 1;
      }
    }

    // Fixed epoch so all devices get the same updatedAt for presets
    var presetEpoch = 1704067200000; // 2024-01-01T00:00:00Z
    var added = 0;
    for (var i = 0; i < presets.length; i++) {
      var presetId = "song_preset_" + i;
      // Skip if this preset ID already exists, or the same title+artist exists.
      if (existingIds[presetId] || existingKeys[this.songKey(presets[i].title, presets[i].artist)]) continue;
      songs.push({
        id: presetId,
        title: presets[i].title,
        artist: presets[i].artist,
        bpm: presets[i].bpm,
        beatsPerLine: presets[i].beatsPerLine,
        lyrics: "",
        order: maxOrder + added,
        createdAt: presetEpoch + i,
        updatedAt: presetEpoch + i
      });
      added++;
    }
    if (added > 0) this._write(songs);
  },

  // Remove duplicate songs (keep the one with lyrics or newest updatedAt)
  _deduplicateSongs: function (songs) {
    var groups = {};
    for (var i = 0; i < songs.length; i++) {
      if (songs[i].deleted) continue;
      var key = this.songKey(songs[i].title, songs[i].artist);
      if (!groups[key]) groups[key] = [];
      groups[key].push(i);
    }

    var changed = false;
    var keys = Object.keys(groups);
    for (var k = 0; k < keys.length; k++) {
      var indices = groups[keys[k]];
      if (indices.length <= 1) continue;

      // Find best: prefer one with lyrics, then newest updatedAt
      var bestIdx = indices[0];
      for (var j = 1; j < indices.length; j++) {
        var curr = songs[indices[j]];
        var best = songs[bestIdx];
        var currHasLyrics = curr.lyrics && curr.lyrics.trim();
        var bestHasLyrics = best.lyrics && best.lyrics.trim();
        if (currHasLyrics && !bestHasLyrics) {
          bestIdx = indices[j];
        } else if (currHasLyrics === bestHasLyrics && curr.updatedAt > best.updatedAt) {
          bestIdx = indices[j];
        }
      }

      // Soft-delete all except best
      for (var d = 0; d < indices.length; d++) {
        if (indices[d] !== bestIdx) {
          songs[indices[d]].deleted = true;
          songs[indices[d]].updatedAt = Date.now();
          changed = true;
        }
      }
    }

    if (changed) {
      // Write directly to avoid triggering sync during startup
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(songs));
      } catch (e) {}
    }
  },

  // Live-only counts for the song-list header (excludes soft-deleted).
  counts: function () {
    var live = this._read().filter(function (s) { return !s.deleted; });
    var withLyrics = 0, withJa = 0;
    for (var i = 0; i < live.length; i++) {
      if (live[i].lyrics && live[i].lyrics.trim()) withLyrics++;
      if (live[i].lyricsJa && live[i].lyricsJa.trim()) withJa++;
    }
    return { total: live.length, withLyrics: withLyrics, withJa: withJa };
  },

  // Backup filename with local date + time: country-lyrics-backup-YYYY-MM-DD-HHMM.json
  _backupFilename: function () {
    var d = new Date();
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return "country-lyrics-backup-" +
      d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) +
      "-" + p(d.getHours()) + p(d.getMinutes()) + ".json";
  },

  // Export all songs + playlists as JSON
  exportAll: function () {
    var data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      songs: this.getAll(),
      playlists: LyricsApp.PlaylistStore.getAll()
    };
    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = this._backupFilename();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Build a dedup plan WITHOUT changing anything. Key = title + artist,
  // both trimmed and lower-cased (title alone would merge different artists'
  // covers). Within a duplicate group the survivor is:
  //   - the one with lyrics; if several have lyrics, the newest updatedAt
  //   - if none have lyrics, the oldest createdAt
  // Returns { groupCount, removeCount, before, after, loserIds, mapping }
  // where mapping[loserId] = survivorId (for re-pointing playlists).
  planDedup: function () {
    var songs = this._read().filter(function (s) { return !s.deleted; });
    var groups = {};
    var order = [];
    for (var i = 0; i < songs.length; i++) {
      var s = songs[i];
      var key = this.songKey(s.title, s.artist);
      if (!groups[key]) { groups[key] = []; order.push(key); }
      groups[key].push(s);
    }

    var groupCount = 0;
    var loserIds = [];
    var mapping = {};

    function hasLyrics(x) { return !!(x.lyrics && x.lyrics.trim()); }

    for (var g = 0; g < order.length; g++) {
      var group = groups[order[g]];
      if (group.length <= 1) continue;
      groupCount++;

      var withLyrics = group.filter(hasLyrics);
      var survivor;
      if (withLyrics.length > 0) {
        survivor = withLyrics[0];
        for (var a = 1; a < withLyrics.length; a++) {
          if ((withLyrics[a].updatedAt || 0) > (survivor.updatedAt || 0)) survivor = withLyrics[a];
        }
      } else {
        survivor = group[0];
        for (var b = 1; b < group.length; b++) {
          if ((group[b].createdAt || 0) < (survivor.createdAt || 0)) survivor = group[b];
        }
      }

      for (var c = 0; c < group.length; c++) {
        if (group[c].id !== survivor.id) {
          loserIds.push(group[c].id);
          mapping[group[c].id] = survivor.id;
        }
      }
    }

    var before = songs.length;
    return {
      groupCount: groupCount,
      removeCount: loserIds.length,
      before: before,
      after: before - loserIds.length,
      loserIds: loserIds,
      mapping: mapping
    };
  },

  // Apply a plan from planDedup(): re-point playlist songIds from a removed
  // song to its survivor (de-duplicating within each playlist), then
  // soft-delete the losers so the deletion syncs to other devices.
  executeDedup: function (plan) {
    if (!plan || !plan.loserIds || plan.loserIds.length === 0) return;

    // Re-point playlists first, so no playlist loses a song.
    var playlists = LyricsApp.PlaylistStore._read();
    var plChanged = false;
    for (var p = 0; p < playlists.length; p++) {
      var ids = playlists[p].songIds || [];
      var newIds = [];
      var seen = {};
      var mapped = false;
      for (var q = 0; q < ids.length; q++) {
        var target = plan.mapping[ids[q]] || ids[q];
        if (target !== ids[q]) mapped = true;
        if (!seen[target]) { seen[target] = true; newIds.push(target); }
      }
      if (mapped || newIds.length !== ids.length) {
        playlists[p].songIds = newIds;
        playlists[p].updatedAt = Date.now();
        plChanged = true;
      }
    }
    if (plChanged) LyricsApp.PlaylistStore._write(playlists);

    // Soft-delete the losers.
    var loserSet = {};
    for (var l = 0; l < plan.loserIds.length; l++) loserSet[plan.loserIds[l]] = true;
    var all = this._read();
    for (var i = 0; i < all.length; i++) {
      if (loserSet[all[i].id] && !all[i].deleted) {
        all[i].deleted = true;
        all[i].updatedAt = Date.now();
      }
    }
    this._write(all);
  },

  // Update `target` in place from imported record `r`. Never wipes non-empty
  // lyrics or a translation with an empty one; keeps a manual translation.
  // Returns true if anything actually changed.
  _mergeImported: function (target, r) {
    var before = JSON.stringify(target);

    if (r.title !== undefined && ("" + r.title).trim()) target.title = ("" + r.title).trim();
    if (r.artist !== undefined) target.artist = ("" + r.artist).trim();
    if (r.bpm !== undefined) target.bpm = r.bpm;
    if (r.beatsPerLine !== undefined) target.beatsPerLine = r.beatsPerLine;
    if (r.linesPerSlide !== undefined) target.linesPerSlide = r.linesPerSlide;
    if (typeof r.order === "number") target.order = r.order;

    // lyrics: only overwrite when the imported side actually has lyrics.
    if (r.lyrics && r.lyrics.trim()) target.lyrics = r.lyrics;

    // translation: never overwrite a manual one; only fill/replace from a
    // non-empty imported translation.
    var rHasJa = !!(r.lyricsJa && r.lyricsJa.trim());
    var tHasJa = !!(target.lyricsJa && target.lyricsJa.trim());
    if (rHasJa && !(target.lyricsJaSource === "manual" && tHasJa)) {
      target.lyricsJa = r.lyricsJa;
      if (r.lyricsJaSource !== undefined) target.lyricsJaSource = r.lyricsJaSource;
    }

    // Timestamps: keep the earliest createdAt and the latest updatedAt.
    if (typeof r.createdAt === "number" &&
        (typeof target.createdAt !== "number" || r.createdAt < target.createdAt)) {
      target.createdAt = r.createdAt;
    }
    if (typeof r.updatedAt === "number" &&
        (typeof target.updatedAt !== "number" || r.updatedAt > target.updatedAt)) {
      target.updatedAt = r.updatedAt;
    }

    if (target.lyricsJa === undefined || target.lyricsJa === null) target.lyricsJa = "";
    if (target.lyricsJaSource === undefined || target.lyricsJaSource === null) target.lyricsJaSource = "";

    return JSON.stringify(target) !== before;
  },

  // Import songs + playlists from JSON file
  importFromFile: function (file, callback) {
    var self = this;
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var data = JSON.parse(e.target.result);
        if (!data.songs || !Array.isArray(data.songs)) {
          callback("Invalid file: no songs array found");
          return;
        }
        // Merge without ever creating a duplicate: match first by id, then by
        // title+artist (songKey). Only truly new songs are added. When a match
        // is found the existing row is updated, and non-empty lyrics/translation
        // are never overwritten by an empty imported one.
        var existingSongs = self._read();
        var byId = {};
        for (var i = 0; i < existingSongs.length; i++) byId[existingSongs[i].id] = existingSongs[i];

        var addedCount = 0, updatedCount = 0, unchangedCount = 0;
        for (var j = 0; j < data.songs.length; j++) {
          var song = data.songs[j];
          var target = byId[song.id] || self._findLiveByKey(existingSongs, song.title, song.artist);
          if (target) {
            if (self._mergeImported(target, song)) updatedCount++;
            else unchangedCount++;
          } else {
            // Normalize translation fields on brand-new imports.
            if (song.lyricsJa === undefined || song.lyricsJa === null) song.lyricsJa = "";
            if (song.lyricsJaSource === undefined || song.lyricsJaSource === null) song.lyricsJaSource = "";
            existingSongs.push(song);
            byId[song.id] = song;
            addedCount++;
          }
        }
        self._write(existingSongs);

        // Import playlists too
        if (data.playlists && Array.isArray(data.playlists)) {
          var existingPlaylists = LyricsApp.PlaylistStore._read();
          var existingPlIds = {};
          for (var m = 0; m < existingPlaylists.length; m++) {
            existingPlIds[existingPlaylists[m].id] = true;
          }
          for (var n = 0; n < data.playlists.length; n++) {
            var pl = data.playlists[n];
            if (existingPlIds[pl.id]) {
              for (var p = 0; p < existingPlaylists.length; p++) {
                if (existingPlaylists[p].id === pl.id) {
                  existingPlaylists[p] = pl;
                  break;
                }
              }
            } else {
              existingPlaylists.push(pl);
            }
          }
          LyricsApp.PlaylistStore._write(existingPlaylists);
        }

        callback(null, addedCount, updatedCount, unchangedCount);
      } catch (ex) {
        callback("Failed to parse file: " + ex.message);
      }
    };
    reader.readAsText(file);
  },

  parseLyrics: function (rawText) {
    if (!rawText || !rawText.trim()) return [];
    var sections = rawText.split(/\n\n+/);
    var slides = [];
    for (var s = 0; s < sections.length; s++) {
      if (s > 0) {
        slides.push({ text: "", sectionBreak: true });
      }
      var lines = sections[s].split(/\n/);
      for (var l = 0; l < lines.length; l++) {
        var text = lines[l].trim();
        if (text) {
          slides.push({ text: text, sectionBreak: false });
        }
      }
    }
    return slides;
  },

  // Parse lyrics into N-line slides
  parseLyricsNLines: function (rawText, n) {
    if (!n || n <= 1) return this.parseLyrics(rawText);
    if (!rawText || !rawText.trim()) return [];
    var sections = rawText.split(/\n\n+/);
    var slides = [];
    for (var s = 0; s < sections.length; s++) {
      if (s > 0) {
        slides.push({ text: "", lineCount: 1, sectionBreak: true });
      }
      var lines = sections[s].split(/\n/);
      var cleanLines = [];
      for (var l = 0; l < lines.length; l++) {
        var text = lines[l].trim();
        if (text) cleanLines.push(text);
      }
      for (var i = 0; i < cleanLines.length; i += n) {
        var chunk = cleanLines.slice(i, Math.min(i + n, cleanLines.length));
        slides.push({ text: chunk.join("\n"), lineCount: chunk.length, sectionBreak: false });
      }
    }
    return slides;
  },

  // Parse lyrics into section-based slides (1 section per slide)
  parseLyricsSections: function (rawText) {
    if (!rawText || !rawText.trim()) return [];
    var sections = rawText.split(/\n\n+/);
    var slides = [];
    for (var s = 0; s < sections.length; s++) {
      var lines = sections[s].split(/\n/);
      var cleanLines = [];
      for (var l = 0; l < lines.length; l++) {
        var text = lines[l].trim();
        if (text) cleanLines.push(text);
      }
      if (cleanLines.length > 0) {
        slides.push({ lines: cleanLines, lineCount: cleanLines.length });
      }
    }
    return slides;
  },

  // Parse lyrics into 2-section slides
  parseLyricsTwoSections: function (rawText) {
    var sections = this.parseLyricsSections(rawText);
    if (sections.length === 0) return [];
    var slides = [];
    for (var i = 0; i < sections.length; i += 2) {
      var combined = sections[i].lines.slice();
      var lineCount = sections[i].lineCount;
      if (i + 1 < sections.length) {
        combined.push(""); // blank line separator
        combined = combined.concat(sections[i + 1].lines);
        lineCount += sections[i + 1].lineCount;
      }
      slides.push({ lines: combined, lineCount: lineCount });
    }
    return slides;
  },

  // Parse lyrics + Japanese translation into bilingual slides.
  // Pairs each English line with the Japanese line at the same index
  // (the translation keeps blank lines and [Section] headers in place, so
  // line indices stay aligned). Blank lines act as slide boundaries and
  // content lines are grouped n-per-slide, matching line mode's rhythm.
  parseLyricsBilingual: function (rawText, rawJa, n) {
    if (!n || n < 1) n = 1;
    if (!rawText || !rawText.trim()) return [];
    var enLines = rawText.split(/\n/);
    var jaLines = (rawJa || "").split(/\n/);
    var slides = [];
    var current = [];
    function flush() {
      if (current.length > 0) {
        slides.push({ pairs: current, lineCount: current.length });
        current = [];
      }
    }
    for (var i = 0; i < enLines.length; i++) {
      var en = enLines[i].trim();
      if (en === "") { flush(); continue; } // blank line = section boundary
      var ja = (i < jaLines.length && jaLines[i]) ? jaLines[i].trim() : "";
      // Don't repeat a line that wasn't translated (e.g. [Section] headers,
      // which the translator passes through unchanged).
      if (ja === en) ja = "";
      current.push({ en: en, ja: ja });
      if (current.length >= n) flush();
    }
    flush();
    return slides;
  }
};

// ===== PlaylistStore =====
LyricsApp.PlaylistStore = {
  STORAGE_KEY: "country_lyrics_playlists",
  _suppressSync: false,

  _read: function () {
    try {
      var data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  _write: function (playlists) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(playlists));
      if (!this._suppressSync && LyricsApp.CloudSync) {
        LyricsApp.CloudSync.scheduleSync();
      }
    } catch (e) {
      alert("Storage limit reached.");
    }
  },

  getAll: function () {
    return this._read().sort(function (a, b) {
      return a.createdAt - b.createdAt;
    });
  },

  getById: function (id) {
    var playlists = this._read();
    for (var i = 0; i < playlists.length; i++) {
      if (playlists[i].id === id) return playlists[i];
    }
    return null;
  },

  create: function (name) {
    var playlists = this._read();
    var now = Date.now();
    var pl = {
      id: "pl_" + now,
      name: name.trim(),
      songIds: [],
      createdAt: now,
      updatedAt: now
    };
    playlists.push(pl);
    this._write(playlists);
    return pl;
  },

  update: function (id, data) {
    var playlists = this._read();
    for (var i = 0; i < playlists.length; i++) {
      if (playlists[i].id === id) {
        if (data.name !== undefined) playlists[i].name = data.name.trim();
        if (data.songIds !== undefined) playlists[i].songIds = data.songIds;
        playlists[i].updatedAt = Date.now();
        this._write(playlists);
        return playlists[i];
      }
    }
    return null;
  },

  delete: function (id) {
    var playlists = this._read().filter(function (p) { return p.id !== id; });
    this._write(playlists);
  },

  addSong: function (plId, songId) {
    var pl = this.getById(plId);
    if (!pl) return null;
    if (pl.songIds.indexOf(songId) === -1) {
      pl.songIds.push(songId);
      return this.update(plId, { songIds: pl.songIds });
    }
    return pl;
  },

  removeSong: function (plId, songId) {
    var pl = this.getById(plId);
    if (!pl) return null;
    pl.songIds = pl.songIds.filter(function (id) { return id !== songId; });
    return this.update(plId, { songIds: pl.songIds });
  },

  reorderSongs: function (plId, fromIndex, toIndex) {
    var pl = this.getById(plId);
    if (!pl) return null;
    if (fromIndex < 0 || fromIndex >= pl.songIds.length) return pl;
    if (toIndex < 0 || toIndex >= pl.songIds.length) return pl;
    var item = pl.songIds.splice(fromIndex, 1)[0];
    pl.songIds.splice(toIndex, 0, item);
    return this.update(plId, { songIds: pl.songIds });
  }
};
