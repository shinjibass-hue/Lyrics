window.LyricsApp = window.LyricsApp || {};

LyricsApp.Store = {
  STORAGE_KEY: "country_lyrics_songs",
  SORT_KEY: "country_lyrics_sort_mode",
  _suppressSync: false, // true when writing from merge (prevents sync loop)

  _read: function () {
    try {
      var data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
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

  create: function (data) {
    var songs = this._read();
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
      order: maxOrder,
      createdAt: now,
      updatedAt: now
    };
    songs.push(song);
    this._write(songs);
    return song;
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

    // Build lookup of existing IDs and titles
    var existingIds = {};
    var existingTitles = {};
    for (var e = 0; e < songs.length; e++) {
      if (!songs[e].deleted) {
        existingIds[songs[e].id] = true;
        existingTitles[songs[e].title.toLowerCase()] = true;
      }
    }

    // Find max order
    var maxOrder = 0;
    for (var o = 0; o < songs.length; o++) {
      if (typeof songs[o].order === "number" && songs[o].order >= maxOrder) {
        maxOrder = songs[o].order + 1;
      }
    }

    var now = Date.now();
    var added = 0;
    for (var i = 0; i < presets.length; i++) {
      var presetId = "song_preset_" + i;
      // Skip if this preset ID already exists or title already exists
      if (existingIds[presetId] || existingTitles[presets[i].title.toLowerCase()]) continue;
      songs.push({
        id: presetId,
        title: presets[i].title,
        artist: presets[i].artist,
        bpm: presets[i].bpm,
        beatsPerLine: presets[i].beatsPerLine,
        lyrics: "",
        order: maxOrder + added,
        createdAt: now - (presets.length - i),
        updatedAt: now - (presets.length - i)
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
      var key = songs[i].title.toLowerCase() + "|||" + (songs[i].artist || "").toLowerCase();
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
    a.download = "country-lyrics-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
        // Merge: add songs that don't exist yet (by id), update those that do
        var existingSongs = self._read();
        var existingIds = {};
        for (var i = 0; i < existingSongs.length; i++) {
          existingIds[existingSongs[i].id] = true;
        }
        var addedCount = 0;
        var updatedCount = 0;
        for (var j = 0; j < data.songs.length; j++) {
          var song = data.songs[j];
          if (existingIds[song.id]) {
            // Update existing
            for (var k = 0; k < existingSongs.length; k++) {
              if (existingSongs[k].id === song.id) {
                existingSongs[k] = song;
                updatedCount++;
                break;
              }
            }
          } else {
            existingSongs.push(song);
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

        callback(null, addedCount, updatedCount);
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
