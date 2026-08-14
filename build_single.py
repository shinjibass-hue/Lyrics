# -*- coding: utf-8 -*-
"""index.html・CSS・JS・曲データを1枚の HTML にまとめる。
   相対パスも fetch も使わないので、ファイルを開くだけで動く。
   Synology Drive に置いて、どの端末からでも開けるようにするため（2026-08-15）。
"""
import json, os, re, sys

SRC = os.path.expanduser('~/OUTLAW/Lyrics')
OUT = os.path.expanduser('~/SynologyDrive/CountryLyrics.html')

html = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()

# --- CSS を埋め込む ---
def inline_css(m):
    href = m.group(1).split('?')[0]
    p = os.path.join(SRC, href)
    if not os.path.exists(p):
        return m.group(0)
    return '<style>\n' + open(p, encoding='utf-8').read() + '\n</style>'

html, n_css = re.subn(r'<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>', inline_css, html)

# --- JS を埋め込む（外部URLの firebase は落とす。オフラインで使うため） ---
dropped = []
def inline_js(m):
    src = m.group(1)
    if src.startswith('http'):
        dropped.append(src)
        return '<!-- 外部スクリプトは同梱版では読みません: %s -->' % src
    path = src.split('?')[0]
    p = os.path.join(SRC, path)
    if not os.path.exists(p):
        return m.group(0)
    body = open(p, encoding='utf-8').read()
    return '<script>\n/* ---- %s ---- */\n%s\n</script>' % (path, body)

html, n_js = re.subn(r'<script[^>]*src="([^"]+)"[^>]*></script>', inline_js, html)

# --- 曲データを埋め込む ---
data = json.load(open(os.path.join(SRC, 'data/country-lyrics.json'), encoding='utf-8'))
songs = data.get('songs') or []
ja = sum(1 for s in songs if s.get('lyricsJa'))
ly = sum(1 for s in songs if s.get('lyrics'))
if not songs:
    sys.exit('曲データが空です。中止しました。')

payload = json.dumps({'songs': songs, 'playlists': data.get('playlists') or []},
                     ensure_ascii=False, separators=(',', ':'))
# </script> がデータ中にあると HTML が壊れるので潰す
payload = payload.replace('</', '<\\/')

embed = (
    '<script>\n'
    '/* 曲データ同梱（%d曲 / 歌詞%d / 訳%d）。'
    'fetch も相対パスも使わないので、単体で開いて動きます。 */\n'
    'window.LyricsApp = window.LyricsApp || {};\n'
    'window.LyricsApp.EMBEDDED_DATA = %s;\n'
    '</script>\n'
) % (len(songs), ly, ja, payload)

# fileStore.js より前に置く必要があるので、最初の <script> の直前へ入れる
i = html.find('<script>')
if i < 0:
    sys.exit('script タグが見つかりません。中止しました。')
html = html[:i] + embed + html[i:]

open(OUT, 'w', encoding='utf-8').write(html)
size = os.path.getsize(OUT)
print('書き出しました: %s' % OUT)
print('  CSS %d件 / JS %d件を埋め込み' % (n_css, n_js))
print('  外さ れた外部スクリプト: %s' % (dropped or 'なし'))
print('  曲 %d / 歌詞 %d / 訳 %d' % (len(songs), ly, ja))
print('  サイズ %.2f MB' % (size / 1024 / 1024))
