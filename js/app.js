window.LyricsApp = window.LyricsApp || {};

LyricsApp.App = {
  _views: {},

  init: function () {
    this._views = {
      "song-list": document.getElementById("view-song-list"),
      "song-editor": document.getElementById("view-song-editor"),
      "performer": document.getElementById("view-performer"),
      "playlists": document.getElementById("view-playlists"),
      "playlist-detail": document.getElementById("view-playlist-detail")
    };

    LyricsApp.Store.seedPresets();

    LyricsApp.SongListView.init();
    LyricsApp.SongEditorView.init();
    LyricsApp.PerformerView.init();
    LyricsApp.PlaylistListView.init();
    LyricsApp.PlaylistDetailView.init();

    // Playlists button on song list
    document.getElementById("btn-playlists").addEventListener("click", function () {
      LyricsApp.App.navigate("playlists");
    });

    this.navigate("song-list");
  },

  navigate: function (viewName, params) {
    params = params || {};

    // Hide all views
    var keys = Object.keys(this._views);
    for (var i = 0; i < keys.length; i++) {
      this._views[keys[i]].classList.remove("active");
    }

    // Show target view
    var target = this._views[viewName];
    if (target) {
      target.classList.add("active");
    }

    // View-specific setup
    switch (viewName) {
      case "song-list":
        document.getElementById("search-input").value = "";
        LyricsApp.SongListView.render();
        break;
      case "song-editor":
        LyricsApp.SongEditorView.show(params.songId);
        break;
      case "performer":
        LyricsApp.PerformerView.show(params.songId, params.playlistId);
        break;
      case "playlists":
        LyricsApp.PlaylistListView.render();
        break;
      case "playlist-detail":
        LyricsApp.PlaylistDetailView.show(params.playlistId);
        break;
    }
  }
};

document.addEventListener("DOMContentLoaded", function () {
  LyricsApp.App.init();
});
