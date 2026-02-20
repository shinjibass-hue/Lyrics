window.LyricsApp = window.LyricsApp || {};

LyricsApp.BpmEngine = {
  _bpm: 120,
  _beatsPerLine: 8,
  _isPlaying: false,
  _timerId: null,
  _rafId: null,
  _currentIndex: 0,
  _slides: [],
  _slideStartTime: 0,
  _onAdvance: null,
  _onProgress: null,
  _onEnd: null,
  _mode: "line", // "line", "section", "two-sections", "full"

  configure: function (opts) {
    this.stop();
    this._bpm = opts.bpm || 120;
    this._beatsPerLine = opts.beatsPerLine || 8;
    this._slides = opts.slides || [];
    this._currentIndex = 0;
    this._onAdvance = opts.onAdvance || null;
    this._onProgress = opts.onProgress || null;
    this._onEnd = opts.onEnd || null;
    this._mode = opts.mode || "line";
  },

  getMsPerSlide: function () {
    return (60000 / this._bpm) * this._beatsPerLine;
  },

  // Get the duration for the current slide based on mode
  _getCurrentSlideDuration: function () {
    var baseMsPerLine = (60000 / this._bpm) * this._beatsPerLine;

    if (this._mode === "line") {
      var lineSlide = this._slides[this._currentIndex];
      // Section breaks get half duration
      if (lineSlide && lineSlide.sectionBreak) {
        return baseMsPerLine * 0.5;
      }
      // Multi-line slides: scale duration by line count
      if (lineSlide && lineSlide.lineCount && lineSlide.lineCount > 1) {
        return baseMsPerLine * lineSlide.lineCount;
      }
      return baseMsPerLine;
    }

    if (this._mode === "section" || this._mode === "two-sections") {
      var slide = this._slides[this._currentIndex];
      if (slide && slide.lineCount) {
        return baseMsPerLine * slide.lineCount;
      }
      return baseMsPerLine;
    }

    // "full" mode - no auto advance
    return 0;
  },

  play: function () {
    if (this._mode === "full") return; // No auto-play in full mode
    if (this._isPlaying) return;
    if (this._currentIndex >= this._slides.length) return;
    this._isPlaying = true;
    this._slideStartTime = Date.now();
    this._scheduleNext();
    this._startProgress();
  },

  pause: function () {
    this._isPlaying = false;
    clearTimeout(this._timerId);
    this._timerId = null;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  },

  stop: function () {
    this.pause();
    this._currentIndex = 0;
  },

  toggle: function () {
    if (this._mode === "full") return false; // No toggle in full mode
    if (this._isPlaying) {
      this.pause();
    } else {
      this.play();
    }
    return this._isPlaying;
  },

  goTo: function (index) {
    if (index < 0 || index >= this._slides.length) return;
    var wasPlaying = this._isPlaying;
    if (wasPlaying) this.pause();
    this._currentIndex = index;
    if (this._onAdvance) this._onAdvance(this._currentIndex);
    if (wasPlaying) this.play();
  },

  next: function () {
    if (this._currentIndex < this._slides.length - 1) {
      this.goTo(this._currentIndex + 1);
    }
  },

  prev: function () {
    if (this._currentIndex > 0) {
      this.goTo(this._currentIndex - 1);
    }
  },

  currentIndex: function () {
    return this._currentIndex;
  },

  isPlaying: function () {
    return this._isPlaying;
  },

  getMode: function () {
    return this._mode;
  },

  _scheduleNext: function () {
    if (!this._isPlaying) return;

    var self = this;
    var ms = this._getCurrentSlideDuration();
    if (ms <= 0) return; // full mode, no scheduling

    var elapsed = Date.now() - this._slideStartTime;
    var remaining = Math.max(0, ms - elapsed);

    this._timerId = setTimeout(function () {
      self._currentIndex++;
      if (self._currentIndex >= self._slides.length) {
        self._isPlaying = false;
        if (self._onEnd) self._onEnd();
        return;
      }
      self._slideStartTime = Date.now();
      if (self._onAdvance) self._onAdvance(self._currentIndex);
      self._scheduleNext();
    }, remaining);
  },

  _startProgress: function () {
    var self = this;
    function tick() {
      if (!self._isPlaying) return;
      var ms = self._getCurrentSlideDuration();
      if (ms <= 0) return;
      var elapsed = Date.now() - self._slideStartTime;
      var fraction = Math.min(1, elapsed / ms);
      if (self._onProgress) self._onProgress(fraction);
      self._rafId = requestAnimationFrame(tick);
    }
    tick();
  }
};
