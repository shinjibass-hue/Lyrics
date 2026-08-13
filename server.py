#!/usr/bin/env python3
import http.server
import json
import os
import re
import urllib.parse
import urllib.request
import urllib.error

DEEPL_URL = "https://api-free.deepl.com/v2/translate"
BATCH_SIZE = 50  # DeepL free API accepts up to 50 text params per request

# A line is passed through untranslated (kept in place) when it is blank
# or a bracketed section header like [Verse] / [Chorus 2].
_SECTION_RE = re.compile(r"^\[.*\]$")


def load_deepl_key():
    """Return the DeepL key from the DEEPL_KEY environment variable, or ""
    if missing/empty. The key is never read from a file and never logged.
    Start the server via KeyVault so the key is injected into the env:
        vault exec Deepl DEEPL_KEY -- python3 ~/OUTLAW/Lyrics/server.py
    """
    key = os.environ.get("DEEPL_KEY", "")
    return key.strip() if isinstance(key, str) else ""


def _deepl_batch(texts, key):
    """Translate one batch (<= BATCH_SIZE lines) EN -> JA. Returns a list of
    translated strings, same length and order as `texts`."""
    params = [("text", t) for t in texts]
    params.append(("source_lang", "EN"))
    params.append(("target_lang", "JA"))
    data = urllib.parse.urlencode(params).encode("utf-8")
    req = urllib.request.Request(
        DEEPL_URL,
        data=data,
        headers={
            "Authorization": "DeepL-Auth-Key " + key,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        body = json.loads(resp.read().decode("utf-8"))
    translations = body.get("translations", [])
    if len(translations) != len(texts):
        raise ValueError("DeepL returned %d results for %d inputs"
                         % (len(translations), len(texts)))
    return [t.get("text", "") for t in translations]


def translate_lines(lines, key):
    """Translate a list of lines EN -> JA, preserving blank lines and
    [Section] headers exactly in place. Returns (result_lines, chars_sent).
    result_lines has the SAME length as `lines`."""
    result = list(lines)
    idxs = []
    texts = []
    for i, line in enumerate(lines):
        s = (line or "").strip()
        if s == "" or _SECTION_RE.match(s):
            continue  # keep untouched, in place
        idxs.append(i)
        texts.append(line)

    chars_sent = sum(len(t) for t in texts)

    out = []
    for start in range(0, len(texts), BATCH_SIZE):
        batch = texts[start:start + BATCH_SIZE]
        out.extend(_deepl_batch(batch, key))

    if len(out) != len(idxs):
        raise ValueError("translation count mismatch")

    for j, i in enumerate(idxs):
        result[i] = out[j]

    return result, chars_sent


class LyricsHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def _send_json(self, status, obj):
        payload = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_POST(self):
        path = self.path.split("?", 1)[0]
        if path != "/api/translate":
            self.send_error(404, "Not Found")
            return

        try:
            length = int(self.headers.get("Content-Length", 0))
        except (TypeError, ValueError):
            length = 0
        raw = self.rfile.read(length) if length > 0 else b""

        try:
            payload = json.loads(raw.decode("utf-8"))
        except Exception:
            self._send_json(400, {"error": "bad_json"})
            return

        lines = payload.get("lines")
        if not isinstance(lines, list):
            self._send_json(400, {"error": "bad_input"})
            return

        key = load_deepl_key()
        if not key:
            # No key configured — do not crash, tell the client politely.
            self._send_json(200, {"error": "deepl_key_missing"})
            return

        try:
            result, chars = translate_lines(lines, key)
        except urllib.error.HTTPError as e:
            self._send_json(200, {"error": "deepl_http_error", "status": e.code})
            return
        except Exception as e:
            self._send_json(200, {"error": "translate_failed", "detail": str(e)})
            return

        if len(result) != len(lines):
            # Must never break line correspondence.
            self._send_json(200, {"error": "length_mismatch"})
            return

        self._send_json(200, {"lines": result, "chars": chars})


if __name__ == '__main__':
    print("Server running at http://localhost:8080")
    http.server.HTTPServer(('', 8080), LyricsHandler).serve_forever()
