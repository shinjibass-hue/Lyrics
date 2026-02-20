window.LyricsApp = window.LyricsApp || {};

LyricsApp.SongEditorView = {
  _currentSongId: null,

  init: function () {
    var self = this;

    document.getElementById("btn-back-to-list").addEventListener("click", function () {
      LyricsApp.App.navigate("song-list");
    });

    document.getElementById("song-form").addEventListener("submit", function (e) {
      e.preventDefault();
      self._handleSave();
    });

    document.getElementById("btn-delete-song").addEventListener("click", function () {
      self._handleDelete();
    });

    document.getElementById("btn-fetch-lyrics").addEventListener("click", function () {
      self._handleFetchLyrics();
    });

    document.getElementById("btn-clear-lyrics").addEventListener("click", function () {
      document.getElementById("input-lyrics").value = "";
      document.getElementById("btn-clear-lyrics").hidden = true;
      document.getElementById("fetch-lyrics-status").textContent = "";
    });

    document.getElementById("btn-close-lyrics-results").addEventListener("click", function () {
      document.getElementById("lyrics-results-modal").classList.add("hidden");
    });
  },

  show: function (songId) {
    this._currentSongId = songId || null;

    var titleEl = document.getElementById("editor-title");
    var deleteBtn = document.getElementById("btn-delete-song");
    var inputTitle = document.getElementById("input-title");
    var inputArtist = document.getElementById("input-artist");
    var inputBpm = document.getElementById("input-bpm");
    var inputBeats = document.getElementById("input-beats-per-line");
    var inputLinesPerSlide = document.getElementById("input-lines-per-slide");
    var inputLyrics = document.getElementById("input-lyrics");

    if (this._currentSongId) {
      var song = LyricsApp.Store.getById(this._currentSongId);
      if (song) {
        titleEl.textContent = "Edit Song";
        inputTitle.value = song.title;
        inputArtist.value = song.artist;
        inputBpm.value = song.bpm;
        inputBeats.value = song.beatsPerLine;
        inputLinesPerSlide.value = song.linesPerSlide || 1;
        inputLyrics.value = song.lyrics;
        document.getElementById("btn-clear-lyrics").hidden = !song.lyrics;
        deleteBtn.hidden = false;
      }
    } else {
      titleEl.textContent = "New Song";
      inputTitle.value = "";
      inputArtist.value = "";
      inputBpm.value = "120";
      inputBeats.value = "8";
      inputLinesPerSlide.value = "1";
      inputLyrics.value = "";
      document.getElementById("btn-clear-lyrics").hidden = true;
      document.getElementById("fetch-lyrics-status").textContent = "";
      deleteBtn.hidden = true;
    }
  },

  _handleSave: function () {
    var data = {
      title: document.getElementById("input-title").value,
      artist: document.getElementById("input-artist").value,
      bpm: document.getElementById("input-bpm").value,
      beatsPerLine: document.getElementById("input-beats-per-line").value,
      linesPerSlide: document.getElementById("input-lines-per-slide").value,
      lyrics: document.getElementById("input-lyrics").value
    };

    if (!data.title.trim()) return;

    if (this._currentSongId) {
      LyricsApp.Store.update(this._currentSongId, data);
    } else {
      LyricsApp.Store.create(data);
    }

    LyricsApp.App.navigate("song-list");
  },

  _handleDelete: function () {
    if (!this._currentSongId) return;
    if (!confirm("Delete this song?")) return;
    LyricsApp.Store.delete(this._currentSongId);
    LyricsApp.App.navigate("song-list");
  },

  _handleFetchLyrics: function () {
    var title = document.getElementById("input-title").value.trim();
    var artist = document.getElementById("input-artist").value.trim();
    var statusEl = document.getElementById("fetch-lyrics-status");
    var btn = document.getElementById("btn-fetch-lyrics");

    if (!title) {
      statusEl.textContent = "Enter a song title first";
      statusEl.className = "fetch-status error";
      return;
    }

    btn.disabled = true;
    statusEl.textContent = "Searching...";
    statusEl.className = "fetch-status loading";

    var self = this;
    LyricsApp.LyricsFetcher.fetchCandidates(title, artist)
      .then(function (candidates) {
        if (!candidates || candidates.length === 0) {
          statusEl.textContent = "Not found";
          statusEl.className = "fetch-status error";
          btn.disabled = false;
          return;
        }

        if (candidates.length === 1) {
          // Only one result - use it directly
          self._applyCandidateLyrics(candidates[0]);
          statusEl.textContent = "Found! (" + candidates[0].artistName + ")";
          statusEl.className = "fetch-status success";
          btn.disabled = false;
          return;
        }

        // Multiple results - show picker modal
        statusEl.textContent = candidates.length + " results found";
        statusEl.className = "fetch-status success";
        btn.disabled = false;
        self._showLyricsResultsModal(candidates);
      })
      .catch(function () {
        statusEl.textContent = "Not found";
        statusEl.className = "fetch-status error";
        btn.disabled = false;
      });
  },

  _applyCandidateLyrics: function (candidate) {
    document.getElementById("input-lyrics").value = candidate.lyrics;
    document.getElementById("btn-clear-lyrics").hidden = false;
    // Update title to match the selected candidate
    if (candidate.trackName) {
      document.getElementById("input-title").value = candidate.trackName;
    }
    // Update artist to match the selected candidate
    if (candidate.artistName) {
      document.getElementById("input-artist").value = candidate.artistName;
    }
  },

  _showLyricsResultsModal: function (candidates) {
    var modal = document.getElementById("lyrics-results-modal");
    var listEl = document.getElementById("lyrics-results-list");
    listEl.innerHTML = "";

    var self = this;
    for (var i = 0; i < candidates.length; i++) {
      (function (candidate, index) {
        var li = document.createElement("li");
        li.className = "picker-item lyrics-result-item";

        var info = document.createElement("div");
        info.className = "lyrics-result-info";

        var titleLine = document.createElement("div");
        titleLine.className = "lyrics-result-title";
        titleLine.textContent = candidate.trackName || "(Unknown Title)";
        info.appendChild(titleLine);

        var detailLine = document.createElement("div");
        detailLine.className = "lyrics-result-detail";
        var parts = [];
        if (candidate.artistName) parts.push(candidate.artistName);
        if (candidate.albumName) parts.push(candidate.albumName);
        if (candidate.duration) {
          var min = Math.floor(candidate.duration / 60);
          var sec = candidate.duration % 60;
          parts.push(min + ":" + (sec < 10 ? "0" : "") + sec);
        }
        detailLine.textContent = parts.join(" / ");
        info.appendChild(detailLine);

        var preview = document.createElement("div");
        preview.className = "lyrics-result-preview";
        var previewText = candidate.lyrics.substring(0, 80).replace(/\n/g, " ");
        if (candidate.lyrics.length > 80) previewText += "...";
        preview.textContent = previewText;
        info.appendChild(preview);

        li.appendChild(info);

        li.addEventListener("click", function () {
          self._applyCandidateLyrics(candidate);
          modal.classList.add("hidden");
          var statusEl = document.getElementById("fetch-lyrics-status");
          statusEl.textContent = "Selected: " + candidate.artistName + " - " + candidate.trackName;
          statusEl.className = "fetch-status success";
        });

        listEl.appendChild(li);
      })(candidates[i], i);
    }

    modal.classList.remove("hidden");
  }
};
