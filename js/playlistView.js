window.LyricsApp = window.LyricsApp || {};

// ===== Playlist List View =====
LyricsApp.PlaylistListView = {
  init: function () {
    var self = this;
    document.getElementById("btn-back-from-playlists").addEventListener("click", function () {
      LyricsApp.App.navigate("song-list");
    });
    document.getElementById("btn-new-playlist").addEventListener("click", function () {
      self._createNewPlaylist();
    });
  },

  render: function () {
    var playlists = LyricsApp.PlaylistStore.getAll();
    var list = document.getElementById("playlist-list");
    var emptyState = document.getElementById("playlist-empty-state");
    var self = this;

    list.innerHTML = "";

    if (playlists.length === 0) {
      emptyState.classList.remove("hidden");
    } else {
      emptyState.classList.add("hidden");
      for (var i = 0; i < playlists.length; i++) {
        list.appendChild(this._renderItem(playlists[i]));
      }
    }
  },

  _renderItem: function (playlist) {
    var self = this;
    var li = document.createElement("li");
    li.className = "playlist-item";

    var info = document.createElement("div");
    info.className = "playlist-item-info";

    var name = document.createElement("div");
    name.className = "playlist-item-name";
    name.textContent = playlist.name;

    var count = document.createElement("div");
    count.className = "playlist-item-count";
    count.textContent = playlist.songIds.length + " songs";

    info.appendChild(name);
    info.appendChild(count);

    var actions = document.createElement("div");
    actions.className = "playlist-item-actions";

    var playBtn = document.createElement("button");
    playBtn.className = "btn-icon btn-play-pl";
    playBtn.innerHTML = "&#9654;";
    playBtn.title = "Play";
    playBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (playlist.songIds.length > 0) {
        LyricsApp.App.navigate("performer", {
          songId: playlist.songIds[0],
          playlistId: playlist.id
        });
      }
    });

    var editBtn = document.createElement("button");
    editBtn.className = "btn-edit";
    editBtn.innerHTML = "&#9998;";
    editBtn.title = "Edit";
    editBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      LyricsApp.App.navigate("playlist-detail", { playlistId: playlist.id });
    });

    actions.appendChild(playBtn);
    actions.appendChild(editBtn);

    li.appendChild(info);
    li.appendChild(actions);

    li.addEventListener("click", function () {
      LyricsApp.App.navigate("playlist-detail", { playlistId: playlist.id });
    });

    return li;
  },

  _createNewPlaylist: function () {
    var name = prompt("Playlist name:");
    if (name && name.trim()) {
      var pl = LyricsApp.PlaylistStore.create(name);
      LyricsApp.App.navigate("playlist-detail", { playlistId: pl.id });
    }
  }
};

// ===== Playlist Detail View =====
LyricsApp.PlaylistDetailView = {
  _playlistId: null,
  _dragSrcIndex: null,

  init: function () {
    var self = this;
    document.getElementById("btn-back-from-playlist-detail").addEventListener("click", function () {
      LyricsApp.App.navigate("playlists");
    });
    document.getElementById("btn-add-song-to-playlist").addEventListener("click", function () {
      self._showSongPicker();
    });
    document.getElementById("btn-play-playlist").addEventListener("click", function () {
      self._playPlaylist();
    });
    document.getElementById("btn-delete-playlist").addEventListener("click", function () {
      self._deletePlaylist();
    });
    document.getElementById("btn-rename-playlist").addEventListener("click", function () {
      self._renamePlaylist();
    });
  },

  show: function (playlistId) {
    this._playlistId = playlistId;
    this.render();
  },

  render: function () {
    var pl = LyricsApp.PlaylistStore.getById(this._playlistId);
    if (!pl) return;

    document.getElementById("playlist-detail-title").textContent = pl.name;

    var list = document.getElementById("playlist-song-list");
    var emptyState = document.getElementById("playlist-detail-empty");
    var self = this;

    list.innerHTML = "";

    if (pl.songIds.length === 0) {
      emptyState.classList.remove("hidden");
    } else {
      emptyState.classList.add("hidden");
      for (var i = 0; i < pl.songIds.length; i++) {
        var song = LyricsApp.Store.getById(pl.songIds[i]);
        if (song) {
          list.appendChild(this._renderSongItem(song, i, pl.songIds.length));
        }
      }
    }
  },

  _renderSongItem: function (song, index, totalCount) {
    var self = this;
    var li = document.createElement("li");
    li.className = "song-item";
    li.dataset.index = index;
    li.draggable = true;

    // Drag handle
    var handle = document.createElement("span");
    handle.className = "drag-handle";
    handle.innerHTML = "&#9776;";
    handle.title = "Drag to reorder";

    var info = document.createElement("div");
    info.className = "song-item-info";

    var title = document.createElement("div");
    title.className = "song-item-title";
    title.textContent = song.title;

    var artist = document.createElement("div");
    artist.className = "song-item-artist";
    artist.textContent = song.artist || "Unknown Artist";

    info.appendChild(title);
    info.appendChild(artist);

    var meta = document.createElement("div");
    meta.className = "song-item-meta";

    var badge = document.createElement("span");
    badge.className = "bpm-badge";
    badge.textContent = song.bpm + " BPM";

    var removeBtn = document.createElement("button");
    removeBtn.className = "btn-edit";
    removeBtn.innerHTML = "&times;";
    removeBtn.title = "Remove from playlist";
    removeBtn.style.fontSize = "1.3rem";
    removeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      LyricsApp.PlaylistStore.removeSong(self._playlistId, song.id);
      self.render();
    });

    meta.appendChild(badge);
    meta.appendChild(removeBtn);

    // Reorder buttons
    var reorderBtns = document.createElement("div");
    reorderBtns.className = "reorder-buttons";

    var upBtn = document.createElement("button");
    upBtn.className = "btn-move";
    upBtn.innerHTML = "&#9650;";
    upBtn.title = "Move up";
    if (index === 0) {
      upBtn.disabled = true;
      upBtn.classList.add("btn-move-hidden");
    }
    upBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      LyricsApp.PlaylistStore.reorderSongs(self._playlistId, index, index - 1);
      self.render();
    });

    var downBtn = document.createElement("button");
    downBtn.className = "btn-move";
    downBtn.innerHTML = "&#9660;";
    downBtn.title = "Move down";
    if (index === totalCount - 1) {
      downBtn.disabled = true;
      downBtn.classList.add("btn-move-hidden");
    }
    downBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      LyricsApp.PlaylistStore.reorderSongs(self._playlistId, index, index + 1);
      self.render();
    });

    reorderBtns.appendChild(upBtn);
    reorderBtns.appendChild(downBtn);

    li.appendChild(handle);
    li.appendChild(info);
    li.appendChild(meta);
    li.appendChild(reorderBtns);

    li.addEventListener("click", function (e) {
      if (e.target.closest(".drag-handle") || e.target.closest(".btn-edit") ||
          e.target.closest(".reorder-buttons")) return;
      LyricsApp.App.navigate("performer", {
        songId: song.id,
        playlistId: self._playlistId
      });
    });

    // Drag events
    li.addEventListener("dragstart", function (e) {
      self._dragSrcIndex = parseInt(li.dataset.index, 10);
      li.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });

    li.addEventListener("dragend", function () {
      li.classList.remove("dragging");
      var items = document.querySelectorAll("#playlist-song-list .song-item");
      for (var j = 0; j < items.length; j++) {
        items[j].classList.remove("drag-over");
      }
    });

    li.addEventListener("dragover", function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      li.classList.add("drag-over");
    });

    li.addEventListener("dragleave", function () {
      li.classList.remove("drag-over");
    });

    li.addEventListener("drop", function (e) {
      e.preventDefault();
      li.classList.remove("drag-over");
      var toIndex = parseInt(li.dataset.index, 10);
      if (self._dragSrcIndex !== null && self._dragSrcIndex !== toIndex) {
        LyricsApp.PlaylistStore.reorderSongs(self._playlistId, self._dragSrcIndex, toIndex);
        self.render();
      }
      self._dragSrcIndex = null;
    });

    return li;
  },

  _showSongPicker: function () {
    var self = this;
    var pl = LyricsApp.PlaylistStore.getById(this._playlistId);
    if (!pl) return;

    var modal = document.getElementById("song-picker-modal");
    var list = document.getElementById("song-picker-list");
    var searchInput = document.getElementById("song-picker-search");

    var renderPicker = function (query) {
      var songs = LyricsApp.Store.search(query || "");
      list.innerHTML = "";

      for (var i = 0; i < songs.length; i++) {
        (function (song) {
          var li = document.createElement("li");
          li.className = "picker-item";

          var isInPlaylist = pl.songIds.indexOf(song.id) !== -1;
          if (isInPlaylist) li.classList.add("picker-item-added");

          var info = document.createElement("div");
          info.className = "picker-item-info";

          var title = document.createElement("span");
          title.className = "picker-item-title";
          title.textContent = song.title;

          var artist = document.createElement("span");
          artist.className = "picker-item-artist";
          artist.textContent = " - " + (song.artist || "Unknown");

          info.appendChild(title);
          info.appendChild(artist);

          var addBtn = document.createElement("button");
          addBtn.className = "btn-secondary btn-small";
          if (isInPlaylist) {
            addBtn.textContent = "Added";
            addBtn.disabled = true;
          } else {
            addBtn.textContent = "+ Add";
            addBtn.addEventListener("click", function (e) {
              e.stopPropagation();
              LyricsApp.PlaylistStore.addSong(self._playlistId, song.id);
              pl = LyricsApp.PlaylistStore.getById(self._playlistId);
              addBtn.textContent = "Added";
              addBtn.disabled = true;
              li.classList.add("picker-item-added");
            });
          }

          li.appendChild(info);
          li.appendChild(addBtn);
          list.appendChild(li);
        })(songs[i]);
      }
    };

    searchInput.value = "";
    renderPicker("");

    searchInput.oninput = function () {
      renderPicker(searchInput.value);
    };

    modal.classList.remove("hidden");

    document.getElementById("btn-close-song-picker").onclick = function () {
      modal.classList.add("hidden");
      self.render();
    };
  },

  _playPlaylist: function () {
    var pl = LyricsApp.PlaylistStore.getById(this._playlistId);
    if (!pl || pl.songIds.length === 0) return;
    LyricsApp.App.navigate("performer", {
      songId: pl.songIds[0],
      playlistId: pl.id
    });
  },

  _deletePlaylist: function () {
    if (confirm("Delete this playlist?")) {
      LyricsApp.PlaylistStore.delete(this._playlistId);
      LyricsApp.App.navigate("playlists");
    }
  },

  _renamePlaylist: function () {
    var pl = LyricsApp.PlaylistStore.getById(this._playlistId);
    if (!pl) return;
    var name = prompt("New name:", pl.name);
    if (name && name.trim()) {
      LyricsApp.PlaylistStore.update(this._playlistId, { name: name });
      document.getElementById("playlist-detail-title").textContent = name.trim();
    }
  }
};
