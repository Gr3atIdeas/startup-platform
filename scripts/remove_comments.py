#!/usr/bin/env python3
"""
Safe comment remover for code files.

Removes ONLY full-line comments that start with optional whitespace followed by
  - '#' (Python/Shell), while preserving shebang and encoding cookie lines
  - '//' (JS/TS/Vue/SCSS)
And also removes block comments safely:
  - '/* ... */' (JS/TS/Vue/CSS/SCSS) – removed anywhere outside string literals
  - '<!-- ... -->' (HTML/Vue) – removed across lines

Inline comments are not touched. Non-target comment styles (like /* */ or <!-- -->)
are not modified.

By default runs in dry-run mode and prints a summary. Use --apply to write changes.

Directories skipped by default: .git, node_modules, staticfiles, __pycache__, venv, .venv,
accounts/migrations, */migrations

File types processed: .py, .sh, .bash, .js, .jsx, .ts, .tsx, .vue, .scss, .css, .html, .htm

Additionally, to avoid touching vendored/minified assets, this script skips most of
the top-level 'static' directory except known app subtrees: 'static/src',
'static/accounts/js', 'static/accounts/scss'.
"""

from __future__ import annotations

import argparse
import io
import os
import re
import sys
from typing import Iterable, List, Tuple


PY_ENCODING_COOKIE_RE = re.compile(r"coding[:=]\s*([-\w.]+)")


DEFAULT_EXTENSIONS = {
    ".py", ".sh", ".bash", ".js", ".jsx", ".ts", ".tsx", ".vue", ".scss", ".css", ".html", ".htm",
}


SKIP_DIR_NAMES = {
    ".git",
    "node_modules",
    "staticfiles",
    "__pycache__",
    "venv",
    ".venv",
    "dist",
    "build",
}


def is_encoding_cookie(line: str) -> bool:
    return bool(PY_ENCODING_COOKIE_RE.search(line))


def should_skip_dir(dirpath: str, root: str) -> bool:
    # Normalize for consistent comparisons
    rel = os.path.relpath(dirpath, root).replace("\\", "/")
    parts = set(rel.split("/"))
    if any(name in parts for name in SKIP_DIR_NAMES):
        return True
    # Skip any migrations subdirectory
    if "/migrations" in f"/{rel}":
        return True

    # Skip most of static, but allow certain subtrees
    if rel.startswith("static/"):
        allow_prefixes = [
            "static/src/",
            "static/accounts/js/",
            "static/accounts/scss/",
        ]
        if not any(rel.startswith(p) for p in allow_prefixes):
            return True

    return False


def is_target_file(path: str) -> bool:
    _, ext = os.path.splitext(path)
    return ext in DEFAULT_EXTENSIONS


def remove_full_line_comments(
    lines: List[str], file_ext: str
) -> Tuple[List[str], int]:
    removed = 0

    def is_hash_comment(idx: int, line: str) -> bool:
        stripped = line.lstrip()
        # Preserve shebang on the very first line
        if idx == 0 and stripped.startswith("#!"):
            return False
        # Preserve encoding cookie on first two lines (PEP 263)
        if idx in (0, 1) and stripped.startswith("#") and is_encoding_cookie(line):
            return False
        return stripped.startswith("#")

    def is_slashslash_comment(line: str) -> bool:
        return line.lstrip().startswith("//")

    new_lines: List[str] = []
    for i, line in enumerate(lines):
        if file_ext in {".py", ".sh", ".bash"}:
            if is_hash_comment(i, line):
                removed += 1
                continue
        elif file_ext in {".js", ".jsx", ".ts", ".tsx", ".vue", ".scss"}:
            if is_slashslash_comment(line):
                removed += 1
                continue
        else:
            # Unknown ext (should not happen due to filtering)
            pass

        new_lines.append(line)

    return new_lines, removed


def remove_block_comments_js_like(text: str) -> Tuple[str, int]:
    """
    Remove /* ... */ block comments while preserving string literals (' ", `).
    Does NOT attempt to parse regex literals thoroughly; relies on the fact that
    sequences like '/*' inside regex are typically escaped.
    Returns (new_text, removed_newline_count)
    """
    i = 0
    n = len(text)
    out_chars: List[str] = []
    removed_newlines = 0

    in_single = False
    in_double = False
    in_template = False
    in_block_comment = False
    template_brace_depth = 0

    def peek(k: int) -> str:
        return text[i + k] if i + k < n else ""

    while i < n:
        ch = text[i]
        nxt = peek(1)

        if in_block_comment:
            if ch == "*" and nxt == "/":
                i += 2
                in_block_comment = False
                continue
            if ch == "\n":
                removed_newlines += 1
            i += 1
            continue

        if in_single:
            if ch == "\\":
                out_chars.append(ch)
                if i + 1 < n:
                    out_chars.append(text[i + 1])
                    i += 2
                    continue
            elif ch == "'":
                in_single = False
            out_chars.append(ch)
            i += 1
            continue

        if in_double:
            if ch == "\\":
                out_chars.append(ch)
                if i + 1 < n:
                    out_chars.append(text[i + 1])
                    i += 2
                    continue
            elif ch == '"':
                in_double = False
            out_chars.append(ch)
            i += 1
            continue

        if in_template:
            if ch == "\\":
                out_chars.append(ch)
                if i + 1 < n:
                    out_chars.append(text[i + 1])
                    i += 2
                    continue
            elif ch == "`":
                in_template = False
            elif ch == "{" and peek(1) == "}":
                # handle empty interpolation edge harmlessly
                pass
            elif ch == "$" and peek(1) == "{" :
                template_brace_depth += 1
            elif ch == "}" and template_brace_depth > 0:
                template_brace_depth -= 1
            out_chars.append(ch)
            i += 1
            continue

        # Not in any string/template/comment
        if ch == "/" and nxt == "*":
            in_block_comment = True
            i += 2
            continue
        if ch == "'":
            in_single = True
            out_chars.append(ch)
            i += 1
            continue
        if ch == '"':
            in_double = True
            out_chars.append(ch)
            i += 1
            continue
        if ch == "`":
            in_template = True
            template_brace_depth = 0
            out_chars.append(ch)
            i += 1
            continue

        out_chars.append(ch)
        i += 1

    return ("".join(out_chars), removed_newlines)


def remove_html_comments(text: str) -> Tuple[str, int]:
    """
    Remove <!-- ... --> HTML comments across lines. Returns (new_text, removed_newline_count).
    """
    removed_newlines = 0
    out = []
    i = 0
    n = len(text)

    def peek(k: int) -> str:
        return text[i + k] if i + k < n else ""

    while i < n:
        if text[i] == "<" and peek(1) == "!" and peek(2) == "-" and peek(3) == "-":
            # enter comment
            i += 4
            while i < n and not (
                text[i] == "-" and peek(1) == "-" and peek(2) == ">"
            ):
                if text[i] == "\n":
                    removed_newlines += 1
                i += 1
            # skip closing '-->' if present
            if i < n:
                i += 3
            continue
        out.append(text[i])
        i += 1

    return ("".join(out), removed_newlines)


def iter_target_files(root: str) -> Iterable[str]:
    for dirpath, dirnames, filenames in os.walk(root):
        # In-place filter dirnames to prune walk efficiently
        pruned = []
        for d in list(dirnames):
            full = os.path.join(dirpath, d)
            if should_skip_dir(full, root):
                pruned.append(d)
        for d in pruned:
            dirnames.remove(d)

        for filename in filenames:
            path = os.path.join(dirpath, filename)
            if is_target_file(path):
                yield path


def process_file(path: str, apply: bool, backup: bool) -> Tuple[int, int]:
    # Returns (removed_lines, written_bytes)
    try:
        with io.open(path, "r", encoding="utf-8", errors="replace", newline="") as f:
            original = f.read()
    except Exception as e:
        print(f"[WARN] Failed to read {path}: {e}", file=sys.stderr)
        return 0, 0

    # Keep original line endings by splitting on \n and preserving terminators
    # Use splitlines(keepends=True) to preserve EOLs.
    lines = original.splitlines(keepends=True)
    _, ext = os.path.splitext(path)

    # Step 1: remove full-line comments (#, //)
    new_lines, removed_full_lines = remove_full_line_comments(lines, ext)
    text_after_line_cleanup = "".join(new_lines)

    removed_extra_lines = 0

    # Step 2: remove block comments where applicable
    if ext in {".js", ".jsx", ".ts", ".tsx", ".vue", ".scss", ".css"}:
        text_after_blocks, removed_nl = remove_block_comments_js_like(text_after_line_cleanup)
        removed_extra_lines += removed_nl
        text_after_line_cleanup = text_after_blocks

    # Step 3: remove HTML comments for HTML/Vue templates
    if ext in {".html", ".htm", ".vue"}:
        text_after_html, removed_nl_html = remove_html_comments(text_after_line_cleanup)
        removed_extra_lines += removed_nl_html
        text_after_line_cleanup = text_after_html

    total_removed_lines = removed_full_lines + removed_extra_lines

    if total_removed_lines == 0:
        return 0, 0

    if apply:
        if backup:
            try:
                with io.open(path + ".bak", "w", encoding="utf-8", newline="") as b:
                    b.write(original)
            except Exception as e:
                print(f"[WARN] Failed to write backup for {path}: {e}", file=sys.stderr)

        try:
            with io.open(path, "w", encoding="utf-8", newline="") as f:
                f.write(text_after_line_cleanup)
        except Exception as e:
            print(f"[WARN] Failed to write {path}: {e}", file=sys.stderr)
            return 0, 0

        return total_removed_lines, len(text_after_line_cleanup)

    return total_removed_lines, 0


def main(argv: List[str]) -> int:
    parser = argparse.ArgumentParser(description="Remove full-line # and // comments safely")
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Apply changes to files. By default only reports (dry-run)",
    )
    parser.add_argument(
        "--no-backup",
        action="store_true",
        help="Do not write .bak backups when applying changes",
    )
    parser.add_argument(
        "--root",
        default=os.getcwd(),
        help="Project root to scan (default: current working directory)",
    )
    args = parser.parse_args(argv)

    apply = args.apply
    backup = not args.no_backup

    total_files = 0
    changed_files = 0
    total_removed = 0

    for path in iter_target_files(args.root):
        total_files += 1
        removed, _ = process_file(path, apply=apply, backup=backup)
        if removed:
            changed_files += 1
            total_removed += removed
            mode = "CHANGED" if apply else "WOULD CHANGE"
            print(f"[{mode}] {path} - removed lines: {removed}")

    action = "Applied" if apply else "Dry-run"
    print(
        f"\n{action} summary: scanned files={total_files}, affected files={changed_files}, total removed lines={total_removed}"
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))


