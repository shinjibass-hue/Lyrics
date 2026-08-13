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

    document.getElementById("btn-translate-all").addEventListener("click", function () {
      self._handleTranslateAll();
    });
    this._updateTranslateUsage();

    // Auto-translate toggle (off by default)
    var autoChk = document.getElementById("chk-auto-translate");
    if (autoChk) {
      autoChk.checked = LyricsApp.Settings.autoTranslateOnFetch();
      autoChk.addEventListener("change", function () {
        LyricsApp.Settings.setAutoTranslateOnFetch(autoChk.checked);
      });
    }

    // Deduplicate (backs up first, then merges duplicates)
    var dedupBtn = document.getElementById("btn-dedup");
    if (dedupBtn) {
      dedupBtn.addEventListener("click", function () { self._handleDedup(); });
    }

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
      LyricsApp.Store.importFromFile(file, function (err, added, updated, unchanged) {
        if (err) {
          alert("取り込みエラー: " + err);
        } else {
          alert("取り込み完了\n新規 " + added + " 曲 ／ 更新 " + updated +
                " 曲 ／ 変更なし " + unchanged + " 曲");
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

    this._updateCountBar(query, songs.length);
  },

  // "全 N 曲 ／ 歌詞あり M ／ 訳あり K"; while searching: "表示中 X / 全 N 曲".
  _updateCountBar: function (query, shownCount) {
    var el = document.getElementById("song-count");
    if (!el) return;
    var c = LyricsApp.Store.counts();
    if (query && query.trim()) {
      el.textContent = "表示中 " + shownCount + " / 全 " + c.total + " 曲";
    } else {
      el.textContent = "全 " + c.total + " 曲 ／ 歌詞あり " + c.withLyrics +
        " 曲 ／ 訳あり " + c.withJa + " 曲";
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
        self._updateTranslateUsage();
      }
    });
  },

  _translateStopFlag: false,

  _updateTranslateUsage: function () {
    var el = document.getElementById("translate-usage");
    if (!el) return;
    el.textContent = "使用量を確認中...";
    el.className = "fetch-status";
    LyricsApp.TranslateUsage.fetchReal()
      .then(function (u) {
        el.textContent = "今月 " + u.count.toLocaleString() + " / " + u.limit.toLocaleString() + " 文字";
        el.className = "fetch-status" + (u.count >= u.limit * 0.9 ? " error" : "");
      })
      .catch(function () {
        el.textContent = "使用量: 取得不可（サーバー未起動の可能性）";
        el.className = "fetch-status";
      });
  },

  _handleTranslateAll: function () {
    var statusEl = document.getElementById("translate-all-status");
    var self = this;

    // If already running, this press means "stop".
    if (this._translateRunning) {
      this._translateStopFlag = true;
      statusEl.textContent = "停止中...";
      return;
    }

    // 対象アーティストだけに絞るか（既定オン）。対象外の曲に無料枠を使わないため。
    var targetsChk = document.getElementById("chk-targets-only");
    var targetsOnly = targetsChk ? targetsChk.checked : true;

    var pending = LyricsApp.LyricsFetcher.pendingForTranslation(targetsOnly);
    if (pending.length === 0) {
      statusEl.textContent = targetsOnly
        ? "未訳の曲はありません（対象アーティストの中に）"
        : "未訳の曲はありません";
      statusEl.className = "fetch-status success";
      return;
    }
    var chars = 0;
    for (var i = 0; i < pending.length; i++) {
      chars += LyricsApp.TranslateUsage.estimateChars(pending[i].lyrics);
    }

    statusEl.textContent = "DeepL の使用量を確認中...";
    statusEl.className = "fetch-status loading";

    // Never send a single character before the user confirms against the
    // REAL remaining quota.
    LyricsApp.TranslateUsage.fetchReal()
      .then(function (u) {
        var remaining = u.limit - u.count;
        if (chars > remaining) {
          statusEl.textContent = "残りが足りません（対象 " + pending.length + " 曲／送信 約 " +
            chars.toLocaleString() + " 文字／残り " + remaining.toLocaleString() + " 文字）";
          statusEl.className = "fetch-status error";
          return;
        }
        var msg =
          (targetsOnly ? "対象アーティストのみ\n" : "全アーティスト\n") +
          "対象 " + pending.length + " 曲 ／ 送信する文字数 約 " + chars.toLocaleString() + " 文字\n" +
          "今月の使用量 " + u.count.toLocaleString() + " / " + u.limit.toLocaleString() +
          " 文字（残り " + remaining.toLocaleString() + " 文字）\n\n翻訳を実行しますか？";
        if (!confirm(msg)) {
          statusEl.textContent = "キャンセルしました（1文字も送信していません）";
          statusEl.className = "fetch-status";
          return;
        }
        self._startTranslateRun(targetsOnly);
      })
      .catch(function (err) {
        statusEl.textContent = LyricsApp.LyricsFetcher.translateErrorMessage(err);
        statusEl.className = "fetch-status error";
      });
  },

  _startTranslateRun: function (targetsOnly) {
    var btn = document.getElementById("btn-translate-all");
    var statusEl = document.getElementById("translate-all-status");
    var self = this;

    this._translateRunning = true;
    this._translateStopFlag = false;
    btn.textContent = "停止";
    statusEl.textContent = "翻訳を開始します...";
    statusEl.className = "fetch-status loading";

    function finish(text, cls) {
      self._translateRunning = false;
      self._translateStopFlag = false;
      btn.textContent = "未訳をまとめて翻訳";
      statusEl.textContent = text;
      statusEl.className = "fetch-status " + (cls || "success");
      self._updateTranslateUsage();
      self.render();
    }

    LyricsApp.LyricsFetcher.translateAll(
      function (p) {
        if (!p.done) {
          statusEl.textContent = p.completed + "/" + p.total +
            "（訳: " + p.succeeded + " / 失敗: " + p.failed + "）";
          return;
        }
        self._updateTranslateUsage();
        if (p.reason === "deepl_key_missing") {
          finish("DEEPL_KEY が渡されていません。vault exec 経由で起動してください", "error");
        } else if (p.reason === "usage_limit") {
          finish("無料枠(50万字)に達したため停止しました", "error");
        } else if (p.reason === "deepl_http_error") {
          finish(LyricsApp.LyricsFetcher.translateErrorMessage({ code: "deepl_http_error", status: p.status }), "error");
        } else if (p.stopped) {
          finish("停止しました（訳: " + p.succeeded + " / 失敗: " + p.failed + "）", "success");
        } else {
          finish("完了：訳 " + p.succeeded + " 曲 / 失敗 " + p.failed + " 曲", "success");
        }
      },
      function () { return self._translateStopFlag; },
      targetsOnly
    );
  },

  // Backup first (always), then merge duplicates and re-point playlists.
  _handleDedup: function () {
    var self = this;

    // Always download a backup before touching anything.
    LyricsApp.Store.exportAll();

    var plan = LyricsApp.Store.planDedup();
    if (plan.removeCount === 0) {
      alert("重複は見つかりませんでした。全 " + plan.before + " 曲。");
      return;
    }

    var msg =
      plan.groupCount + " 組の重複、" + plan.removeCount + " 曲を削除します。\n" +
      plan.before + " 曲 → " + plan.after + " 曲になります。\n\n" +
      "（削除前のバックアップ country-lyrics-backup-…json を保存しました）\n\n実行しますか？";
    if (!confirm(msg)) return;

    var before = plan.before;
    LyricsApp.Store.executeDedup(plan);
    self.render(document.getElementById("search-input").value);
    var after = LyricsApp.Store.counts().total;
    alert("重複を整理しました。" + before + " 曲 → " + after + " 曲。");
  }
};
