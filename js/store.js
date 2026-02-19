window.LyricsApp = window.LyricsApp || {};

LyricsApp.Store = {
  STORAGE_KEY: "country_lyrics_songs",
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

  getAll: function () {
    var songs = this._read();
    // Sort by order field if present, otherwise by createdAt
    songs.sort(function (a, b) {
      var oa = (typeof a.order === "number") ? a.order : 99999;
      var ob = (typeof b.order === "number") ? b.order : 99999;
      if (oa !== ob) return oa - ob;
      return a.createdAt - b.createdAt;
    });
    return songs;
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
        songs[i].lyrics = data.lyrics || "";
        songs[i].updatedAt = Date.now();
        this._write(songs);
        return songs[i];
      }
    }
    return null;
  },

  delete: function (id) {
    var songs = this._read().filter(function (s) { return s.id !== id; });
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

  // Seed preset country standards on first launch
  seedPresets: function () {
    var songs = this._read();
    if (songs.length > 0) return; // already has data

    var presets = [
      { title: "Ring of Fire", artist: "Johnny Cash", bpm: 108, beatsPerLine: 8 },
      { title: "Folsom Prison Blues", artist: "Johnny Cash", bpm: 104, beatsPerLine: 8 },
      { title: "I Walk the Line", artist: "Johnny Cash", bpm: 104, beatsPerLine: 8 },
      { title: "Take Me Home, Country Roads", artist: "John Denver", bpm: 82, beatsPerLine: 8 },
      { title: "Rocky Mountain High", artist: "John Denver", bpm: 76, beatsPerLine: 8 },
      { title: "On the Road Again", artist: "Willie Nelson", bpm: 126, beatsPerLine: 8 },
      { title: "Blue Eyes Crying in the Rain", artist: "Willie Nelson", bpm: 72, beatsPerLine: 8 },
      { title: "Mammas Don't Let Your Babies Grow Up to Be Cowboys", artist: "Waylon Jennings & Willie Nelson", bpm: 100, beatsPerLine: 8 },
      { title: "Friends in Low Places", artist: "Garth Brooks", bpm: 82, beatsPerLine: 8 },
      { title: "The Dance", artist: "Garth Brooks", bpm: 68, beatsPerLine: 8 },
      { title: "Achy Breaky Heart", artist: "Billy Ray Cyrus", bpm: 120, beatsPerLine: 8 },
      { title: "Boot Scootin' Boogie", artist: "Brooks & Dunn", bpm: 132, beatsPerLine: 8 },
      { title: "Chattahoochee", artist: "Alan Jackson", bpm: 138, beatsPerLine: 8 },
      { title: "Amarillo by Morning", artist: "George Strait", bpm: 96, beatsPerLine: 8 },
      { title: "Check Yes or No", artist: "George Strait", bpm: 120, beatsPerLine: 8 },
      { title: "The Gambler", artist: "Kenny Rogers", bpm: 92, beatsPerLine: 8 },
      { title: "Lucille", artist: "Kenny Rogers", bpm: 108, beatsPerLine: 8 },
      { title: "He Stopped Loving Her Today", artist: "George Jones", bpm: 72, beatsPerLine: 8 },
      { title: "King of the Road", artist: "Roger Miller", bpm: 120, beatsPerLine: 8 },
      { title: "Gentle on My Mind", artist: "Glen Campbell", bpm: 112, beatsPerLine: 8 },
      { title: "Rhinestone Cowboy", artist: "Glen Campbell", bpm: 108, beatsPerLine: 8 },
      { title: "El Paso", artist: "Marty Robbins", bpm: 168, beatsPerLine: 8 },
      { title: "Jambalaya (On the Bayou)", artist: "Hank Williams", bpm: 116, beatsPerLine: 8 },
      { title: "Your Cheatin' Heart", artist: "Hank Williams", bpm: 100, beatsPerLine: 8 },
      { title: "Hey, Good Lookin'", artist: "Hank Williams", bpm: 132, beatsPerLine: 8 },
      { title: "I'm So Lonesome I Could Cry", artist: "Hank Williams", bpm: 72, beatsPerLine: 8 },
      { title: "Act Naturally", artist: "Buck Owens", bpm: 128, beatsPerLine: 8 },
      { title: "Okie from Muskogee", artist: "Merle Haggard", bpm: 100, beatsPerLine: 8 },
      { title: "Mama Tried", artist: "Merle Haggard", bpm: 132, beatsPerLine: 8 },
      { title: "Always on My Mind", artist: "Willie Nelson", bpm: 76, beatsPerLine: 8 },
      { title: "Pancho and Lefty", artist: "Merle Haggard & Willie Nelson", bpm: 96, beatsPerLine: 8 },
      { title: "Stand by Your Man", artist: "Tammy Wynette", bpm: 66, beatsPerLine: 8 },
      { title: "Coal Miner's Daughter", artist: "Loretta Lynn", bpm: 104, beatsPerLine: 8 },
      { title: "Crazy", artist: "Patsy Cline", bpm: 72, beatsPerLine: 8 },
      { title: "I Fall to Pieces", artist: "Patsy Cline", bpm: 80, beatsPerLine: 8 },
      { title: "Jolene", artist: "Dolly Parton", bpm: 112, beatsPerLine: 8 },
      { title: "9 to 5", artist: "Dolly Parton", bpm: 120, beatsPerLine: 8 },
      { title: "Islands in the Stream", artist: "Kenny Rogers & Dolly Parton", bpm: 100, beatsPerLine: 8 },
      { title: "The Devil Went Down to Georgia", artist: "Charlie Daniels Band", bpm: 132, beatsPerLine: 8 },
      { title: "Mountain Music", artist: "Alabama", bpm: 128, beatsPerLine: 8 },
    ];

    var now = Date.now();
    for (var i = 0; i < presets.length; i++) {
      songs.push({
        id: "song_preset_" + i,
        title: presets[i].title,
        artist: presets[i].artist,
        bpm: presets[i].bpm,
        beatsPerLine: presets[i].beatsPerLine,
        lyrics: "",
        order: i,
        createdAt: now - (presets.length - i),
        updatedAt: now - (presets.length - i)
      });
    }
    this._write(songs);
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
