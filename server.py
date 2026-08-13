#!/usr/bin/env python3
import html
import http.server
import json
import os
import re
import socketserver
import urllib.parse
import urllib.request
import urllib.error

DEEPL_URL = "https://api-free.deepl.com/v2/translate"
DEEPL_USAGE_URL = "https://api-free.deepl.com/v2/usage"
BATCH_SIZE = 50  # DeepL free API accepts up to 50 text params per request

# Google Cloud Translation v2. Used when GOOGLE_TRANSLATE_KEY is set.
# DeepL の無料枠（月50万文字）とは別枠です。Google も月50万文字まで無料です。
GOOGLE_URL = "https://translation.googleapis.com/language/translate/v2"
GOOGLE_BATCH_SIZE = 100    # v2 は 1 リクエスト 128 セグメントまで。余裕を見て 100。
GOOGLE_BATCH_CHARS = 20000  # 1 リクエストが大きくなり過ぎないための上限。

# Ollama（この Mac の中で動きます）。鍵も請求先も枠もありません。
# english-talk と同じモデルを使います。Google / DeepL が使えないときの受け皿です。
OLLAMA_BASE = os.environ.get("OLLAMA_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen3:14b")
OLLAMA_BATCH_SIZE = 80  # 曲全体を一度に渡します。長い曲だけここで切ります。

# qwen3 などの思考モデルは <think>...</think> を返します。訳文だけ残します。
_THINK_RE = re.compile(r"<think>.*?</think>", re.S)
# "12: 訳文" / "12. 訳文" / "12） 訳文" のどれでも拾えるようにします。
_NUMBERED_RE = re.compile(r"^\s*(\d+)\s*[:：.。)）]\s*(.*)$")

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


def load_google_key():
    """Return the Google Cloud Translation key from GOOGLE_TRANSLATE_KEY.
    KeyVault 経由で渡してください:
        vault exec GoogleTranslate GOOGLE_TRANSLATE_KEY -- python3 ~/OUTLAW/Lyrics/server.py
    2本とも渡すときは vault exec を入れ子にしてください。
    """
    key = os.environ.get("GOOGLE_TRANSLATE_KEY", "")
    return key.strip() if isinstance(key, str) else ""


def active_engine():
    """どちらの翻訳エンジンを使うかを返します。

    TRANSLATE_ENGINE で明示的に "deepl" / "google" を指定できます。
    指定が無いときは、鍵のあるほうを使います。両方あれば google を優先します
    （DeepL は 2026-08 に無料枠を使い切ったため）。
    """
    want = (os.environ.get("TRANSLATE_ENGINE", "") or "").strip().lower()
    if want in ("deepl", "google", "ollama"):
        return want
    if load_google_key():
        return "google"
    if load_deepl_key():
        return "deepl"
    # 鍵が1本も無いときは、この Mac の Ollama を使います。
    # 鍵も請求先も枠も要りません（2026-08-14、Google の請求上限に達したため）。
    return "ollama"


def _google_batch(texts, key):
    """Translate one batch EN -> JA with Google Cloud Translation v2.
    Returns a list of the same length and order as `texts`."""
    body = json.dumps({
        "q": texts,
        "source": "en",
        "target": "ja",
        "format": "text",
    }).encode("utf-8")
    req = urllib.request.Request(
        GOOGLE_URL + "?key=" + urllib.parse.quote(key, safe=""),
        data=body,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    items = (payload.get("data") or {}).get("translations", [])
    if len(items) != len(texts):
        raise ValueError("Google returned %d results for %d inputs"
                         % (len(items), len(texts)))
    # format=text でも &#39; などの実体参照が返るため必ず戻します。
    # 歌詞はアポストロフィだらけなので、ここを飛ばすと表示が壊れます。
    return [html.unescape(i.get("translatedText", "")) for i in items]


def _ollama_chat(prompt, timeout=600):
    """Ollama に1回問い合わせて、本文だけを返します。

    qwen3 は既定で長い思考を挟み、20行まとめて訳すと数分を超えます。
    think=false で思考を切ります（対応していない版でも無視されるだけです）。
    """
    body = json.dumps({
        "model": OLLAMA_MODEL,
        "stream": False,
        "think": False,
        "options": {"temperature": 0.2, "num_ctx": 8192},
        "messages": [
            {"role": "system",
             "content": "You translate American country song lyrics from English into natural Japanese. "
                        "Keep the meaning of Southern idioms and slang. Do not add explanations."},
            {"role": "user", "content": prompt},
        ],
    }).encode("utf-8")
    req = urllib.request.Request(
        OLLAMA_BASE + "/api/chat",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    text = ((payload.get("message") or {}).get("content") or "")
    return _THINK_RE.sub("", text).strip()


def _ollama_one(text):
    """1行だけ訳します。番号がずれたときの取りこぼし用です。"""
    out = _ollama_chat(
        "次の英語を日本語に訳してください。訳文だけを1行で返してください。\n\n" + text,
        timeout=180,
    )
    return out.splitlines()[0].strip() if out else ""


def _ollama_batch(texts, title="", artist=""):
    """まとめて訳します。番号が合わなければ1行ずつ訳し直して必ず件数を合わせます。

    曲全体を一度に渡します。1行ずつ切って渡すと文脈が消え、
    意味が2行にまたがる歌詞で訳が壊れるためです。
    """
    numbered = "\n".join("%d: %s" % (i + 1, t) for i, t in enumerate(texts))
    who = (title or "").strip()
    if artist:
        who = (who + " / " + artist).strip(" /")
    prompt = (
        ("曲: " + who + "\n\n" if who else "") +
        "これはアメリカのカントリーソングの歌詞です。全体を読んでから、1行ずつ日本語に訳してください。\n\n"
        "守ること\n"
        "・行番号をそのまま付けて、入力と同じ行数だけ返してください\n"
        "・行をまとめたり分けたりしないでください\n"
        "・直訳ではなく、日本語として自然な言い方にしてください\n"
        "・南部の言い回しや慣用句は、意味が伝わる日本語にしてください\n"
        "・歌詞なので、説明や補足は書かないでください\n"
        "・固有名詞（地名・人名）はカタカナにしてください\n"
        "・訳文以外は一切書かないでください\n\n"
        "歌詞\n" + numbered
    )
    got = {}
    try:
        for line in _ollama_chat(prompt).splitlines():
            m = _NUMBERED_RE.match(line)
            if m:
                n = int(m.group(1))
                if 1 <= n <= len(texts):
                    got[n] = m.group(2).strip()
    except Exception as e:
        # 原因が分からないまま「失敗」だけ出るのを防ぐため、必ず端末に出します。
        print("ollama batch failed: %s: %s" % (type(e).__name__, e), flush=True)
        got = {}

    out = []
    for i, t in enumerate(texts):
        v = got.get(i + 1, "")
        if not v:
            v = _ollama_one(t)  # 取りこぼしはここで必ず埋めます
        out.append(v)
    return out


def _google_batches(texts):
    """件数と文字数の両方で区切ったバッチを順に返します。"""
    batch, chars = [], 0
    for t in texts:
        if batch and (len(batch) >= GOOGLE_BATCH_SIZE
                      or chars + len(t) > GOOGLE_BATCH_CHARS):
            yield batch
            batch, chars = [], 0
        batch.append(t)
        chars += len(t)
    if batch:
        yield batch


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


def translate_lines(lines, key, engine="deepl", title="", artist=""):
    """Translate a list of lines EN -> JA, preserving blank lines and
    [Section] headers exactly in place. Returns (result_lines, chars_sent).
    result_lines has the SAME length as `lines`.

    engine は "deepl" か "google" です。行の対応を保つ処理は共通です。
    """
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
    if engine == "ollama":
        # 曲全体を一度に渡します。長い曲だけ分割します（文脈を切らないため）。
        for start in range(0, len(texts), OLLAMA_BATCH_SIZE):
            out.extend(_ollama_batch(texts[start:start + OLLAMA_BATCH_SIZE], title, artist))
    elif engine == "google":
        for batch in _google_batches(texts):
            out.extend(_google_batch(batch, key))
    else:
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

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path == "/api/deepl-usage":
            self._handle_usage()
            return
        # Everything else is a static file.
        super().do_GET()

    def _handle_usage(self):
        """Report real DeepL usage: {character_count, character_limit}.
        Never crashes the server — returns an error object instead.

        Google には使用量を返す API がありません。engine が google のときは
        engine 名だけ返し、画面側は自前のカウントに切り替えます。
        """
        engine = active_engine()
        if engine == "ollama":
            # この Mac の中で動くので、使用量の上限がありません。
            self._send_json(200, {
                "engine": "ollama",
                "character_count": 0,
                "character_limit": 0,
                "unlimited": True,
            })
            return
        if engine == "google":
            self._send_json(200, {
                "engine": "google",
                "character_count": None,
                "character_limit": 500000,
            })
            return
        key = load_deepl_key()
        if not key:
            self._send_json(200, {"error": "deepl_key_missing"})
            return
        try:
            req = urllib.request.Request(
                DEEPL_USAGE_URL,
                headers={"Authorization": "DeepL-Auth-Key " + key},
                method="GET",
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                body = json.loads(resp.read().decode("utf-8"))
            self._send_json(200, {
                "character_count": body.get("character_count", 0),
                "character_limit": body.get("character_limit", 0),
            })
        except urllib.error.HTTPError as e:
            self._send_json(200, {"error": "deepl_http_error", "status": e.code})
        except Exception as e:
            self._send_json(200, {"error": "usage_failed", "detail": str(e)})

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

        engine = active_engine()
        if engine == "ollama":
            key = ""  # 鍵は要りません。
        else:
            key = load_google_key() if engine == "google" else load_deepl_key()
        if engine != "ollama" and not key:
            # No key configured — do not crash, tell the client politely.
            self._send_json(200, {
                "error": "google_key_missing" if engine == "google" else "deepl_key_missing"
            })
            return

        title = payload.get("title") or ""
        artist = payload.get("artist") or ""

        try:
            result, chars = translate_lines(lines, key, engine, title, artist)
        except urllib.error.HTTPError as e:
            self._send_json(200, {
                "error": "google_http_error" if engine == "google" else "deepl_http_error",
                "status": e.code,
            })
            return
        except Exception as e:
            # 端末にも出します。画面の「失敗1」だけでは原因が追えないためです。
            print("translate failed (%s): %s: %s" % (engine, type(e).__name__, e), flush=True)
            self._send_json(200, {"error": "translate_failed", "detail": str(e)})
            return

        if len(result) != len(lines):
            # Must never break line correspondence.
            self._send_json(200, {"error": "length_mismatch"})
            return

        self._send_json(200, {"lines": result, "chars": chars})


class ThreadedServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    """同時に複数の要求を受けられるようにします。

    以前は1つずつしか処理できず、翻訳（1曲1〜2分）の間は画面の読み込みも
    他の操作も全部詰まりました。2026-08-14、翻訳中に別のタブを開いて
    画面が読めなくなったため変更しました。
    """
    daemon_threads = True
    allow_reuse_address = True


if __name__ == '__main__':
    print("Server running at http://localhost:8080")
    ThreadedServer(('', 8080), LyricsHandler).serve_forever()
