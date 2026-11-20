#!/usr/bin/env python3
"""Build dist/preview.html for local testing of the Apps Script UI.

Reads src/Index.html, inlines every <?!= include('X') ?> from src/X.html and injects
src/DevMock.html (a fake google.script.run) before the first <script>. Python stdlib only.

    python3 tools/preview.py
    python3 -m http.server 4321 --directory dist     # then open http://localhost:4321/preview.html
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
OUT = ROOT / "dist" / "preview.html"

INCLUDE = re.compile(r"<\?!=\s*include\(\s*['\"]([\w.-]+)['\"]\s*\)\s*\?>")


def read(path: pathlib.Path) -> str:
    return path.read_text(encoding="utf-8-sig")


def main() -> int:
    html = read(SRC / "Index.html")

    def inline(match: re.Match) -> str:
        part = SRC / (match.group(1) + ".html")
        if not part.exists():
            sys.exit("include('%s') -> %s not found" % (match.group(1), part))
        return read(part)

    html = INCLUDE.sub(inline, html)

    mock = read(SRC / "DevMock.html")
    # Mock must exist before App's script runs: put it right before the first <script>
    idx = html.find("<script>")
    if idx < 0:
        sys.exit("no <script> found in the assembled page")
    html = html[:idx] + mock + "\n" + html[idx:]

    left = INCLUDE.findall(html)
    if left or "<?" in html.replace("<?xml", ""):
        sys.exit("unresolved scriptlet left in output")

    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(html, encoding="utf-8", newline="\n")
    print("wrote %s (%d bytes)" % (OUT.relative_to(ROOT), len(html.encode("utf-8"))))
    return 0


if __name__ == "__main__":
    sys.exit(main())
