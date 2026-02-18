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
  },

  show: function (songId) {
    this._currentSongId = songId || null;

    var titleEl = document.getElementById("editor-title");
    var deleteBtn = document.getElementById("btn-delete-song");
    var inputTitle = document.getElementById("input-title");
    var inputArtist = document.getElementById("input-artist");
    var inputBpm = document.getElementById("input-bpm");
    var inputBeats = document.getElementById("input-beats-per-line");
    var inputLyrics = document.getElementById("input-lyrics");

    if (this._currentSongId) {
      var song = LyricsApp.Store.getById(this._currentSongId);
      if (song) {
        titleEl.textContent = "Edit Song";
        inputTitle.value = song.title;
        inputArtist.value = song.artist;
        inputBpm.value = song.bpm;
        inputBeats.value = song.beatsPerLine;
        inputLyrics.value = song.lyrics;
        deleteBtn.hidden = false;
      }
    } else {
      titleEl.textContent = "New Song";
      inputTitle.value = "";
      inputArtist.value = "";
      inputBpm.value = "120";
      inputBeats.value = "8";
      inputLyrics.value = "";
      deleteBtn.hidden = true;
    }
  },

  _handleSave: function () {
    var data = {
      title: document.getElementById("input-title").value,
      artist: document.getElementById("input-artist").value,
      bpm: document.getElementById("input-bpm").value,
      beatsPerLine: document.getElementById("input-beats-per-line").value,
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

    LyricsApp.LyricsFetcher.fetchFull(title, artist)
      .then(function (info) {
        document.getElementById("input-lyrics").value = info.lyrics;
        // Auto-fill artist if empty
        var artistInput = document.getElementById("input-artist");
        if (!artistInput.value.trim() && info.artistName) {
          artistInput.value = info.artistName;
        }
        statusEl.textContent = "Found! (" + info.artistName + ")";
        statusEl.className = "fetch-status success";
      })
      .catch(function (err) {
        statusEl.textContent = "Not found";
        statusEl.className = "fetch-status error";
      })
      .then(function () {
        btn.disabled = false;
      });
  }
};
