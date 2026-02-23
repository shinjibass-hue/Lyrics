window.LyricsApp = window.LyricsApp || {};

LyricsApp.SongListView = {
  _dragSrcIndex: null,

  init: function () {
    var self = this;
    var searchInput = document.getElementById("search-input");
    var addBtn = document.getElementById("btn-add-song");
    var fetchAllBtn = document.getElementById("btn-fetch-all");

    searchInput.addEventListener("input", function () {
      self.render(searchInput.value);
    });

    addBtn.addEventListener("click", function () {
      LyricsApp.App.navigate("song-editor", { songId: null });
    });

    fetchAllBtn.addEventListener("click", function () {
      self._handleFetchAll();
    });

    // Sort mode button
    var sortBtn = document.getElementById("btn-sort-mode");
    var modes = ["manual", "title", "artist"];
    var modeLabels = { manual: "Sort: Manual", title: "Sort: Title", artist: "Sort: Artist" };
    sortBtn.textContent = modeLabels[LyricsApp.Store.getSortMode()] || modeLabels.manual;
    sortBtn.addEventListener("click", function () {
      var current = LyricsApp.Store.getSortMode();
      var idx = modes.indexOf(current);
      var next = modes[(idx + 1) % modes.length];
      LyricsApp.Store.setSortMode(next);
      sortBtn.textContent = modeLabels[next];
      self.render(searchInput.value);
    });

    // Export / Import
    document.getElementById("btn-export").addEventListener("click", function () {
      LyricsApp.Store.exportAll();
    });

    var importFileInput = document.getElementById("import-file-input");
    document.getElementById("btn-import").addEventListener("click", function () {
      importFileInput.click();
    });
    importFileInput.addEventListener("change", function () {
      var file = importFileInput.files[0];
      if (!file) return;
      LyricsApp.Store.importFromFile(file, function (err, added, updated) {
        if (err) {
          alert("Import error: " + err);
        } else {
          alert("Import complete!\nAdded: " + added + " songs\nUpdated: " + updated + " songs");
          self.render();
        }
        importFileInput.value = "";
      });
    });

    // Sync modal
    var syncModal = document.getElementById("sync-modal");
    var syncSetup = document.getElementById("sync-setup");
    var syncConnected = document.getElementById("sync-connected");
    var Sync = LyricsApp.CloudSync;

    var apiKeyInput = document.getElementById("input-api-key");

    document.getElementById("btn-sync").addEventListener("click", function () {
      // Load saved API key into input
      var settings = Sync.getSettings();
      apiKeyInput.value = settings.apiKey || "";

      if (Sync.hasSyncId()) {
        syncSetup.style.display = "none";
        syncConnected.style.display = "block";
        self._updateSyncInfo();
      } else {
        syncSetup.style.display = "block";
        syncConnected.style.display = "none";
      }
      syncModal.classList.remove("hidden");
    });

    document.getElementById("btn-close-sync").addEventListener("click", function () {
      syncModal.classList.add("hidden");
    });

    // New (first device)
    document.getElementById("btn-sync-new").addEventListener("click", function () {
      var key = apiKeyInput.value.trim();
      if (!key) { alert("Please enter your Firebase API Key first."); return; }
      var settings = Sync.getSettings();
      settings.apiKey = key;
      Sync.saveSettings(settings);

      var status = document.getElementById("sync-status");
      status.textContent = "Creating...";
      status.className = "fetch-status loading";
      Sync.createNew(function (err, blobId) {
        if (err) {
          status.textContent = "Error: " + err;
          status.className = "fetch-status error";
        } else {
          status.textContent = "";
          syncSetup.style.display = "none";
          syncConnected.style.display = "block";
          self._updateSyncInfo();
          document.getElementById("sync-indicator").classList.remove("hidden");
          Sync.startAutoSync();
        }
      });
    });

    // Join (second device)
    document.getElementById("btn-sync-join").addEventListener("click", function () {
      var key = apiKeyInput.value.trim();
      if (!key) { alert("Please enter your Firebase API Key first."); return; }
      var settings = Sync.getSettings();
      settings.apiKey = key;
      Sync.saveSettings(settings);

      var id = document.getElementById("input-sync-id").value.trim();
      if (!id) return;
      var status = document.getElementById("sync-status");
      status.textContent = "Joining...";
      status.className = "fetch-status loading";
      Sync.join(id, function (err) {
        if (err) {
          status.textContent = "Error: " + err;
          status.className = "fetch-status error";
        } else {
          status.textContent = "";
          syncSetup.style.display = "none";
          syncConnected.style.display = "block";
          self._updateSyncInfo();
          document.getElementById("sync-indicator").classList.remove("hidden");
          Sync.startAutoSync();
          self.render();
        }
      });
    });

    // Sync Now
    document.getElementById("btn-sync-now").addEventListener("click", function () {
      // Save API key if updated
      var key = apiKeyInput.value.trim();
      if (key) {
        var settings = Sync.getSettings();
        settings.apiKey = key;
        Sync.saveSettings(settings);
      }
      var status = document.getElementById("sync-status-connected");
      status.textContent = "Syncing...";
      status.className = "fetch-status loading";
      Sync.sync(function (err) {
        if (err) {
          status.textContent = "Error: " + err;
          status.className = "fetch-status error";
        } else {
          status.textContent = "Synced!";
          status.className = "fetch-status success";
          self._updateSyncInfo();
          self.render();
        }
      });
    });

    // Force Push (overwrite remote with local)
    document.getElementById("btn-sync-force-push").addEventListener("click", function () {
      if (!confirm("Force push will overwrite remote data with local data. Continue?")) return;
      var key = apiKeyInput.value.trim();
      if (key) {
        var settings = Sync.getSettings();
        settings.apiKey = key;
        Sync.saveSettings(settings);
      }
      var status = document.getElementById("sync-status-connected");
      status.textContent = "Force pushing...";
      status.className = "fetch-status loading";
      Sync.forcePush(function (err) {
        if (err) {
          status.textContent = "Error: " + err;
          status.className = "fetch-status error";
        } else {
          status.textContent = "Force push complete!";
          status.className = "fetch-status success";
          self._updateSyncInfo();
        }
      });
    });

    // Disconnect
    document.getElementById("btn-sync-disconnect").addEventListener("click", function () {
      Sync.disconnect();
      document.getElementById("input-sync-id").value = "";
      apiKeyInput.value = "";
      syncConnected.style.display = "none";
      syncSetup.style.display = "block";
      document.getElementById("sync-status").textContent = "";
      document.getElementById("sync-status-connected").textContent = "";
      document.getElementById("sync-indicator").classList.add("hidden");
    });
  },

  _updateSyncInfo: function () {
    var Sync = LyricsApp.CloudSync;
    var idEl = document.getElementById("sync-id-display");
    if (idEl) {
      var bid = Sync.getBlobId();
      idEl.textContent = bid ? "Sync ID: " + bid : "";
    }
    var infoEl = document.getElementById("sync-last-time");
    if (infoEl) {
      var t = Sync.getLastSyncTime();
      if (t) {
        var d = new Date(t);
        infoEl.textContent = "Last sync: " + d.toLocaleDateString() + " " + d.toLocaleTimeString();
      } else {
        infoEl.textContent = "";
      }
    }
  },

  render: function (query) {
    var songs = LyricsApp.Store.search(query || "");
    var list = document.getElementById("song-list");
    var emptyState = document.getElementById("empty-state");
    var isManual = LyricsApp.Store.getSortMode() === "manual";

    list.innerHTML = "";

    if (songs.length === 0) {
      emptyState.classList.remove("hidden");
    } else {
      emptyState.classList.add("hidden");
      for (var i = 0; i < songs.length; i++) {
        list.appendChild(this._renderItem(songs[i], i, songs.length, isManual));
      }
    }
  },

  _renderItem: function (song, index, totalCount, isManual) {
    var self = this;
    var li = document.createElement("li");
    li.className = "song-item";
    li.dataset.index = index;
    li.draggable = isManual;

    // Drag handle
    var handle = document.createElement("span");
    handle.className = "drag-handle";
    handle.innerHTML = "&#9776;";
    handle.title = "Drag to reorder";
    if (!isManual) handle.style.display = "none";

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

    if (!song.lyrics || !song.lyrics.trim()) {
      var noLyrics = document.createElement("span");
      noLyrics.className = "no-lyrics";
      noLyrics.textContent = "no lyrics";
      meta.appendChild(noLyrics);
    }

    var badge = document.createElement("span");
    badge.className = "bpm-badge";
    badge.textContent = song.bpm + " BPM";

    // Add to Playlist button
    var addPlBtn = document.createElement("button");
    addPlBtn.className = "btn-add-to-pl";
    addPlBtn.innerHTML = "+&#9835;";
    addPlBtn.title = "Add to Playlist";
    addPlBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      self._showPlaylistPicker(song.id);
    });

    var editBtn = document.createElement("button");
    editBtn.className = "btn-edit";
    editBtn.innerHTML = "&#9998;";
    editBtn.title = "Edit";
    editBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      LyricsApp.App.navigate("song-editor", { songId: song.id });
    });

    var deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-delete-list";
    deleteBtn.innerHTML = "&#10005;";
    deleteBtn.title = "Delete";
    deleteBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (confirm("Delete \"" + song.title + "\"?")) {
        LyricsApp.Store.delete(song.id);
        self.render(document.getElementById("search-input").value);
      }
    });

    meta.appendChild(badge);
    meta.appendChild(addPlBtn);
    meta.appendChild(editBtn);
    meta.appendChild(deleteBtn);

    // Reorder buttons (only in manual mode)
    var reorderBtns = document.createElement("div");
    reorderBtns.className = "reorder-buttons";
    if (!isManual) reorderBtns.style.display = "none";

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
      LyricsApp.Store.reorder(index, index - 1);
      self.render(document.getElementById("search-input").value);
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
      LyricsApp.Store.reorder(index, index + 1);
      self.render(document.getElementById("search-input").value);
    });

    reorderBtns.appendChild(upBtn);
    reorderBtns.appendChild(downBtn);

    li.appendChild(handle);
    li.appendChild(info);
    li.appendChild(meta);
    li.appendChild(reorderBtns);

    li.addEventListener("click", function (e) {
      if (e.target.closest(".drag-handle") || e.target.closest(".btn-edit") ||
          e.target.closest(".reorder-buttons") || e.target.closest(".btn-add-to-pl") ||
          e.target.closest(".btn-delete-list")) return;
      LyricsApp.App.navigate("performer", { songId: song.id });
    });

    // Drag events
    li.addEventListener("dragstart", function (e) {
      self._dragSrcIndex = parseInt(li.dataset.index, 10);
      li.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });

    li.addEventListener("dragend", function () {
      li.classList.remove("dragging");
      var items = document.querySelectorAll(".song-item");
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
        LyricsApp.Store.reorder(self._dragSrcIndex, toIndex);
        self.render(document.getElementById("search-input").value);
      }
      self._dragSrcIndex = null;
    });

    return li;
  },

  _showPlaylistPicker: function (songId) {
    var playlists = LyricsApp.PlaylistStore.getAll();

    if (playlists.length === 0) {
      var name = prompt("No playlists yet. Create one?\nPlaylist name:");
      if (name && name.trim()) {
        var pl = LyricsApp.PlaylistStore.create(name);
        LyricsApp.PlaylistStore.addSong(pl.id, songId);
        this._showToast("Added to \"" + pl.name + "\"");
      }
      return;
    }

    // Build a quick-pick menu
    var modal = document.getElementById("playlist-picker-modal");
    var list = document.getElementById("playlist-picker-list");
    list.innerHTML = "";

    var self = this;
    for (var i = 0; i < playlists.length; i++) {
      (function (pl) {
        var li = document.createElement("li");
        li.className = "picker-item";

        var already = pl.songIds.indexOf(songId) !== -1;

        var info = document.createElement("div");
        info.className = "picker-item-info";

        var nameSpan = document.createElement("span");
        nameSpan.className = "picker-item-title";
        nameSpan.textContent = pl.name;

        var countSpan = document.createElement("span");
        countSpan.className = "picker-item-artist";
        countSpan.textContent = " (" + pl.songIds.length + " songs)";

        info.appendChild(nameSpan);
        info.appendChild(countSpan);

        var btn = document.createElement("button");
        btn.className = "btn-secondary btn-small";
        if (already) {
          btn.textContent = "Added";
          btn.disabled = true;
        } else {
          btn.textContent = "+ Add";
          btn.addEventListener("click", function (e) {
            e.stopPropagation();
            LyricsApp.PlaylistStore.addSong(pl.id, songId);
            btn.textContent = "Added";
            btn.disabled = true;
            li.classList.add("picker-item-added");
          });
        }

        li.appendChild(info);
        li.appendChild(btn);
        list.appendChild(li);
      })(playlists[i]);
    }

    // New playlist option
    var newLi = document.createElement("li");
    newLi.className = "picker-item picker-item-new";
    var newBtn = document.createElement("button");
    newBtn.className = "btn-primary btn-small";
    newBtn.textContent = "+ New Playlist";
    newBtn.style.width = "100%";
    newBtn.addEventListener("click", function () {
      var name = prompt("Playlist name:");
      if (name && name.trim()) {
        var pl = LyricsApp.PlaylistStore.create(name);
        LyricsApp.PlaylistStore.addSong(pl.id, songId);
        modal.classList.add("hidden");
        self._showToast("Added to \"" + pl.name + "\"");
      }
    });
    newLi.appendChild(newBtn);
    list.appendChild(newLi);

    modal.classList.remove("hidden");

    document.getElementById("btn-close-playlist-picker").onclick = function () {
      modal.classList.add("hidden");
    };
  },

  _showToast: function (message) {
    var toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove("hidden");
    toast.classList.add("show");
    setTimeout(function () {
      toast.classList.remove("show");
      toast.classList.add("hidden");
    }, 2000);
  },

  _handleFetchAll: function () {
    var btn = document.getElementById("btn-fetch-all");
    var statusEl = document.getElementById("fetch-all-status");
    var self = this;

    btn.disabled = true;
    statusEl.textContent = "Starting...";
    statusEl.className = "fetch-status loading";

    LyricsApp.LyricsFetcher.fetchAll(function (progress) {
      statusEl.textContent = progress.completed + "/" + progress.total +
        " (found: " + progress.succeeded + ", missed: " + progress.failed + ")";

      if (progress.done) {
        statusEl.className = "fetch-status success";
        statusEl.textContent = "Done! " + progress.succeeded + " found, " + progress.failed + " not found";
        btn.disabled = false;
        self.render();
      }
    });
  }
};
