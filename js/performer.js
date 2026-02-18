window.LyricsApp = window.LyricsApp || {};

LyricsApp.PerformerView = {
  _song: null,
  _slides: [],
  _displayMode: "line", // "line", "section", "two-sections", "full"
  _modes: ["line", "section", "two-sections", "full"],
  _modeLabels: { "line": "Line", "section": "1 Section", "two-sections": "2 Sections", "full": "Full" },
  _controlsTimeout: null,
  _touchStartX: 0,
  _touchStartY: 0,
  _boundKeyHandler: null,
  _boundMouseHandler: null,
  _boundTouchStart: null,
  _boundTouchEnd: null,
  // Playlist mode
  _playlistSongIds: null,
  _playlistIndex: -1,
  _playlistId: null,
  // Section data for full mode highlighting
  _sectionSlides: [],
  _fullLyricsText: "",

  init: function () {
    var self = this;

    document.getElementById("btn-exit-performer").addEventListener("click", function () {
      self.exit();
    });

    document.getElementById("btn-play-pause").addEventListener("click", function () {
      self._togglePlay();
    });

    document.getElementById("btn-prev-line").addEventListener("click", function () {
      LyricsApp.BpmEngine.prev();
    });

    document.getElementById("btn-next-line").addEventListener("click", function () {
      LyricsApp.BpmEngine.next();
    });

    document.getElementById("btn-display-mode").addEventListener("click", function () {
      self._cycleDisplayMode();
    });
  },

  show: function (songId, playlistId) {
    var self = this;
    this._song = LyricsApp.Store.getById(songId);
    if (!this._song) return;

    // Playlist mode setup
    if (playlistId) {
      this._playlistId = playlistId;
      var playlist = LyricsApp.PlaylistStore.getById(playlistId);
      if (playlist) {
        this._playlistSongIds = playlist.songIds;
        this._playlistIndex = this._playlistSongIds.indexOf(songId);
        if (this._playlistIndex === -1) this._playlistIndex = 0;
      }
    } else if (this._playlistId) {
      // Keep playlist context if already in playlist mode
    } else {
      this._playlistSongIds = null;
      this._playlistIndex = -1;
      this._playlistId = null;
    }

    this._loadSongSlides();

    document.getElementById("performer-song-title").textContent = this._song.title;
    document.getElementById("performer-bpm-display").textContent = "BPM: " + this._song.bpm;
    this._updateModeButton();

    LyricsApp.BpmEngine.configure({
      bpm: this._song.bpm,
      beatsPerLine: this._song.beatsPerLine,
      slides: this._slides,
      mode: this._displayMode,
      onAdvance: function (index) { self._renderSlide(index); },
      onProgress: function (fraction) { self._updateProgress(fraction); },
      onEnd: function () { self._onPlaybackEnd(); }
    });

    this._renderSlide(0);
    this._updatePlayButton();
    this._showControls();
    this._bindEvents();
    this._requestFullscreen();
  },

  _loadSongSlides: function () {
    var mode = this._displayMode;
    var rawLyrics = this._song.lyrics;

    if (mode === "line") {
      this._slides = LyricsApp.Store.parseLyrics(rawLyrics);
    } else if (mode === "section") {
      this._slides = LyricsApp.Store.parseLyricsSections(rawLyrics);
    } else if (mode === "two-sections") {
      this._slides = LyricsApp.Store.parseLyricsTwoSections(rawLyrics);
    } else if (mode === "full") {
      // Full mode: single slide, displayed as left/right split
      this._sectionSlides = LyricsApp.Store.parseLyricsSections(rawLyrics);
      this._slides = [{ full: true }];
    }

    if (this._slides.length === 0) {
      this._slides = [{ text: "(No lyrics)", sectionBreak: false }];
    }
  },

  exit: function () {
    LyricsApp.BpmEngine.stop();
    this._unbindEvents();
    this._exitFullscreen();
    var plId = this._playlistId;
    this._playlistSongIds = null;
    this._playlistIndex = -1;
    this._playlistId = null;
    // Return to playlist detail if came from a playlist
    if (plId) {
      LyricsApp.App.navigate("playlist-detail", { playlistId: plId });
    } else {
      LyricsApp.App.navigate("song-list");
    }
  },

  _cycleDisplayMode: function () {
    var idx = this._modes.indexOf(this._displayMode);
    idx = (idx + 1) % this._modes.length;
    this._displayMode = this._modes[idx];
    this._updateModeButton();

    // Reload slides for new mode
    var wasPlaying = LyricsApp.BpmEngine.isPlaying();
    LyricsApp.BpmEngine.stop();

    this._loadSongSlides();

    var self = this;
    LyricsApp.BpmEngine.configure({
      bpm: this._song.bpm,
      beatsPerLine: this._song.beatsPerLine,
      slides: this._slides,
      mode: this._displayMode,
      onAdvance: function (index) { self._renderSlide(index); },
      onProgress: function (fraction) { self._updateProgress(fraction); },
      onEnd: function () { self._onPlaybackEnd(); }
    });

    this._renderSlide(0);
    this._updatePlayButton();

    // Hide/show progress bar based on mode
    var progressBar = document.getElementById("progress-bar");
    progressBar.style.display = this._displayMode === "full" ? "none" : "";
  },

  _updateModeButton: function () {
    var btn = document.getElementById("btn-display-mode");
    btn.textContent = this._modeLabels[this._displayMode];
  },

  _renderSlide: function (index) {
    var currentEl = document.getElementById("lyrics-current");
    var nextEl = document.getElementById("lyrics-next");
    var counterEl = document.getElementById("slide-counter");
    var lyricsDisplay = document.getElementById("lyrics-display");

    // Remove all mode classes
    lyricsDisplay.classList.remove("mode-line", "mode-section", "mode-two-sections", "mode-full");
    lyricsDisplay.classList.add("mode-" + this._displayMode);

    // Reset any inline styles from previous render
    lyricsDisplay.style.transform = "";
    lyricsDisplay.style.maxWidth = "";
    lyricsDisplay.style.width = "";
    currentEl.style.maxWidth = "";
    currentEl.style.fontSize = "";
    nextEl.style.maxWidth = "";
    nextEl.style.fontSize = "";
    nextEl.style.display = "";

    // Adjust overlay alignment
    var overlay = document.getElementById("performer-overlay");
    var isFullMode = (this._displayMode === "full");
    var isFitMode = (this._displayMode === "two-sections" || isFullMode);

    if (isFullMode) {
      // Full mode: side-by-side layout
      overlay.style.justifyContent = "flex-start";
      overlay.style.alignItems = "stretch";
      overlay.style.paddingTop = "0.5rem";
      lyricsDisplay.style.maxWidth = "100%";
      lyricsDisplay.style.width = "100%";
    } else if (this._displayMode === "two-sections") {
      overlay.style.justifyContent = "flex-start";
      overlay.style.alignItems = "center";
      overlay.style.paddingTop = "0.5rem";
      // PC half-width for two-sections
      if (window.innerWidth >= 769) {
        var halfW = Math.floor(window.innerWidth / 2) + "px";
        lyricsDisplay.style.maxWidth = halfW;
        lyricsDisplay.style.width = halfW;
      }
    } else {
      overlay.style.justifyContent = "center";
      overlay.style.alignItems = "center";
      overlay.style.paddingTop = "";
    }

    if (this._displayMode === "line") {
      this._renderLineMode(index, currentEl, nextEl, counterEl);
    } else if (this._displayMode === "section" || this._displayMode === "two-sections") {
      this._renderSectionMode(index, currentEl, nextEl, counterEl);
    } else if (this._displayMode === "full") {
      this._renderFullMode(index, currentEl, nextEl, counterEl);
    }

    this._updatePlayButton();
  },

  _renderLineMode: function (index, currentEl, nextEl, counterEl) {
    var slide = this._slides[index];
    var text = slide ? slide.text : "";

    if (slide && slide.sectionBreak) {
      text = "~ ~ ~";
    }

    currentEl.style.fontSize = "";
    currentEl.style.transform = "";
    currentEl.classList.toggle("long-text", text.length > 40);
    currentEl.classList.remove("fade-in");
    void currentEl.offsetWidth;
    currentEl.classList.add("fade-in");
    currentEl.textContent = text;

    var nextSlide = this._slides[index + 1];
    if (nextSlide) {
      nextEl.textContent = nextSlide.sectionBreak ? "" : nextSlide.text;
    } else {
      nextEl.textContent = "";
    }

    var total = this._slides.filter(function (s) { return !s.sectionBreak; }).length;
    var current = 0;
    for (var i = 0; i <= index; i++) {
      if (!this._slides[i].sectionBreak) current++;
    }
    counterEl.textContent = current + " / " + total;
  },

  _renderSectionMode: function (index, currentEl, nextEl, counterEl) {
    var slide = this._slides[index];
    if (!slide) return;

    var lines = slide.lines || [];
    currentEl.innerHTML = "";
    currentEl.classList.remove("long-text", "fade-in");
    void currentEl.offsetWidth;
    currentEl.classList.add("fade-in");

    for (var i = 0; i < lines.length; i++) {
      if (i > 0) currentEl.appendChild(document.createElement("br"));
      if (lines[i] === "") {
        var sep = document.createElement("span");
        sep.className = "section-separator";
        currentEl.appendChild(sep);
      } else {
        currentEl.appendChild(document.createTextNode(lines[i]));
      }
    }

    // Next slide preview
    var nextSlide = this._slides[index + 1];
    if (nextSlide && nextSlide.lines) {
      nextEl.textContent = nextSlide.lines[0] || "";
    } else {
      nextEl.textContent = "";
    }

    counterEl.textContent = (index + 1) + " / " + this._slides.length;

    if (this._displayMode === "two-sections") {
      // Count actual text lines (excluding empty separator lines)
      var textLineCount = 0;
      for (var j = 0; j < lines.length; j++) {
        if (lines[j] !== "") textLineCount++;
      }
      // Add gap lines for section separators
      var separatorCount = 0;
      for (var k = 0; k < lines.length; k++) {
        if (lines[k] === "") separatorCount++;
      }
      var totalLines = textLineCount + separatorCount;
      // Hide next preview in fit mode to save space
      nextEl.style.display = "none";
      this._fitFontSizeByLineCount(currentEl, totalLines, 80);
    } else {
      // Single section: use CSS clamp sizing
      var totalChars = lines.join("").length;
      currentEl.classList.toggle("long-text", lines.length > 6 || totalChars > 120);
    }
  },

  _renderFullMode: function (index, currentEl, nextEl, counterEl) {
    currentEl.innerHTML = "";
    currentEl.classList.remove("long-text", "fade-in");
    nextEl.innerHTML = "";
    nextEl.style.display = "";
    counterEl.textContent = "";

    var sections = this._sectionSlides;
    if (!sections || sections.length === 0) {
      currentEl.textContent = "(No lyrics)";
      return;
    }

    // Split sections into left half and right half
    var mid = Math.ceil(sections.length / 2);
    var leftSections = sections.slice(0, mid);
    var rightSections = sections.slice(mid);

    // Build left side into currentEl
    var leftContainer = document.createElement("div");
    leftContainer.className = "full-lyrics-container";
    for (var s = 0; s < leftSections.length; s++) {
      var div = document.createElement("div");
      div.className = "full-lyrics-section";
      var lines = leftSections[s].lines;
      for (var l = 0; l < lines.length; l++) {
        if (l > 0) div.appendChild(document.createElement("br"));
        div.appendChild(document.createTextNode(lines[l]));
      }
      leftContainer.appendChild(div);
    }
    currentEl.appendChild(leftContainer);

    // Build right side into nextEl
    var rightContainer = document.createElement("div");
    rightContainer.className = "full-lyrics-container";
    for (var s2 = 0; s2 < rightSections.length; s2++) {
      var div2 = document.createElement("div");
      div2.className = "full-lyrics-section";
      var lines2 = rightSections[s2].lines;
      for (var l2 = 0; l2 < lines2.length; l2++) {
        if (l2 > 0) div2.appendChild(document.createElement("br"));
        div2.appendChild(document.createTextNode(lines2[l2]));
      }
      rightContainer.appendChild(div2);
    }
    nextEl.appendChild(rightContainer);

    // Fit each half to screen
    this._fitToScreenByMeasure(currentEl, 80);
    this._fitToScreenByMeasure(nextEl, 80);
  },

  // Fit font-size by line count (for two-sections mode)
  _fitFontSizeByLineCount: function (el, lineCount, bottomMargin) {
    if (lineCount <= 0) return;
    setTimeout(function () {
      var availableHeight = window.innerHeight - (bottomMargin || 80);
      var fontSize = Math.floor(availableHeight / (lineCount * 1.6));
      fontSize = Math.max(10, Math.min(48, fontSize));
      el.style.fontSize = fontSize + "px";
    }, 150);
  },

  // Fit font-size by measuring actual scrollHeight (for full mode)
  // Start with a trial font, measure, then adjust proportionally
  _fitToScreenByMeasure: function (el, bottomMargin) {
    // Set initial font size for measurement
    var trialSize = 20;
    el.style.fontSize = trialSize + "px";

    setTimeout(function () {
      var availableHeight = window.innerHeight - (bottomMargin || 80);
      var contentHeight = el.scrollHeight;

      if (contentHeight <= 0) return;

      // Scale font proportionally: if content at 20px is X tall,
      // we need fontSize = 20 * (available / X)
      var newSize = Math.floor(trialSize * (availableHeight / contentHeight));
      newSize = Math.max(8, Math.min(48, newSize));
      el.style.fontSize = newSize + "px";
    }, 200);
  },

  _updateProgress: function (fraction) {
    document.getElementById("progress-fill").style.width = (fraction * 100) + "%";
  },

  _togglePlay: function () {
    if (this._displayMode === "full") return; // No play in full mode
    LyricsApp.BpmEngine.toggle();
    this._updatePlayButton();
    this._showControls();
  },

  _updatePlayButton: function () {
    var btn = document.getElementById("btn-play-pause");
    if (this._displayMode === "full") {
      btn.innerHTML = "&#9654;";
      btn.classList.remove("playing");
      btn.style.opacity = "0.3";
      return;
    }
    btn.style.opacity = "";
    var playing = LyricsApp.BpmEngine.isPlaying();
    btn.innerHTML = playing ? "&#9646;&#9646;" : "&#9654;";
    btn.classList.toggle("playing", playing);
  },

  _onPlaybackEnd: function () {
    // If in playlist mode, advance to next song
    if (this._playlistSongIds && this._playlistIndex >= 0) {
      var nextIdx = this._playlistIndex + 1;
      if (nextIdx < this._playlistSongIds.length) {
        var self = this;
        // Show next song title briefly
        var currentEl = document.getElementById("lyrics-current");
        var nextSong = LyricsApp.Store.getById(this._playlistSongIds[nextIdx]);
        if (nextSong) {
          currentEl.textContent = "Next: " + nextSong.title;
          currentEl.classList.remove("fade-in");
          void currentEl.offsetWidth;
          currentEl.classList.add("fade-in");
          setTimeout(function () {
            self._playlistIndex = nextIdx;
            self.show(self._playlistSongIds[nextIdx], self._playlistId);
            LyricsApp.BpmEngine.play();
            self._updatePlayButton();
          }, 3000);
          return;
        }
      }
    }
    this._updatePlayButton();
    document.getElementById("progress-fill").style.width = "100%";
  },

  _showControls: function () {
    var controls = document.getElementById("performer-controls");
    var progressBar = document.getElementById("progress-bar");
    var counterEl = document.getElementById("slide-counter");
    controls.classList.remove("hidden");
    progressBar.style.opacity = "1";
    counterEl.style.opacity = "1";

    clearTimeout(this._controlsTimeout);
    var self = this;
    this._controlsTimeout = setTimeout(function () {
      if (LyricsApp.BpmEngine.isPlaying()) {
        controls.classList.add("hidden");
        counterEl.style.opacity = "0.3";
      }
    }, 3000);
  },

  _bindEvents: function () {
    var self = this;

    this._boundKeyHandler = function (e) {
      if (e.isComposing) return;
      switch (e.code) {
        case "Space":
          e.preventDefault();
          self._togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          LyricsApp.BpmEngine.next();
          self._showControls();
          break;
        case "ArrowLeft":
          e.preventDefault();
          LyricsApp.BpmEngine.prev();
          self._showControls();
          break;
        case "Escape":
          e.preventDefault();
          self.exit();
          break;
        case "KeyM":
          e.preventDefault();
          self._cycleDisplayMode();
          self._showControls();
          break;
      }
    };
    document.addEventListener("keydown", this._boundKeyHandler);

    this._boundMouseHandler = function () { self._showControls(); };
    document.addEventListener("mousemove", this._boundMouseHandler);

    // Touch: swipe and tap
    var overlay = document.getElementById("performer-overlay");

    this._boundTouchStart = function (e) {
      self._touchStartX = e.touches[0].clientX;
      self._touchStartY = e.touches[0].clientY;
    };
    overlay.addEventListener("touchstart", this._boundTouchStart, { passive: true });

    this._boundTouchEnd = function (e) {
      var dx = e.changedTouches[0].clientX - self._touchStartX;
      var dy = e.changedTouches[0].clientY - self._touchStartY;
      var absDx = Math.abs(dx);
      var absDy = Math.abs(dy);

      if (absDx < 30 && absDy < 30) {
        self._showControls();
        return;
      }

      if (absDx > absDy && absDx > 50) {
        if (dx < 0) {
          LyricsApp.BpmEngine.next();
        } else {
          LyricsApp.BpmEngine.prev();
        }
        self._showControls();
      }
    };
    overlay.addEventListener("touchend", this._boundTouchEnd, { passive: true });
  },

  _unbindEvents: function () {
    if (this._boundKeyHandler) {
      document.removeEventListener("keydown", this._boundKeyHandler);
    }
    if (this._boundMouseHandler) {
      document.removeEventListener("mousemove", this._boundMouseHandler);
    }
    var overlay = document.getElementById("performer-overlay");
    if (this._boundTouchStart) {
      overlay.removeEventListener("touchstart", this._boundTouchStart);
    }
    if (this._boundTouchEnd) {
      overlay.removeEventListener("touchend", this._boundTouchEnd);
    }
    clearTimeout(this._controlsTimeout);
  },

  _requestFullscreen: function () {
    var el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(function () {});
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    }
  },

  _exitFullscreen: function () {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(function () {});
    } else if (document.webkitFullscreenElement) {
      document.webkitExitFullscreen();
    }
  }
};
