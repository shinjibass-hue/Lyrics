// Minimal QR Code generator for Canvas
// Uses the QR Code API service to generate QR codes
window.LyricsApp = window.LyricsApp || {};

LyricsApp.QRCode = {
  // Generate QR code on a canvas element
  // Uses a simple approach: draw QR from a free API image
  generate: function (canvas, text, size) {
    size = size || 200;
    var ctx = canvas.getContext("2d");
    canvas.width = size;
    canvas.height = size;

    // Use Google Charts API for QR generation (no library needed)
    var img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function () {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
    };
    img.onerror = function () {
      // Fallback: show URL text if QR generation fails
      ctx.fillStyle = "#1a1410";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#d4a54a";
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("QR failed - use link below", size / 2, size / 2);
    };
    img.src = "https://api.qrserver.com/v1/create-qr-code/?size=" + size + "x" + size + "&data=" + encodeURIComponent(text);
  }
};
