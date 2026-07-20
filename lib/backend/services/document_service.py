"""
Multi-format text extraction from a URL.

Supports: PDF, DOCX, Markdown, TXT, GitHub README/repo links, ZIP archives.

Dependencies (install only what you need):
    pip install requests pypdf python-docx mammoth
"""


def extract_text_from_url(url):
    """Download a file from a URL and extract its text.

    Dispatches based on magic bytes first (most reliable), then falls back
    to URL extension / Content-Type header for formats that don't have a
    distinct binary signature (Markdown, TXT).
    """
    try:
        from urllib.request import Request, urlopen

        url = _normalize_github_url(url)

        req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urlopen(req, timeout=30) as response:
            content = response.read()
            content_type = response.headers.get("Content-Type", "").lower()

        return _extract_text_from_bytes(content, url=url, content_type=content_type)

    except Exception as e:
        print(f"WARNING: Could not extract report text: {e}")
        return ""


# Backward-compatible alias — the original name suggested PDF-only, kept so
# existing call sites don't need to change.
extract_text_from_pdf = extract_text_from_url


def _normalize_github_url(url):
    """Convert GitHub blob/repo URLs into raw content URLs where possible."""
    import re
    import requests

    # https://github.com/{owner}/{repo}/blob/{branch}/{path} -> raw file
    m = re.match(r"https?://github\.com/([^/]+)/([^/]+)/blob/(.+)", url)
    if m:
        owner, repo, rest = m.groups()
        return f"https://raw.githubusercontent.com/{owner}/{repo}/{rest}"

    # https://github.com/{owner}/{repo} (repo root) -> try README on main/master
    m = re.match(r"https?://github\.com/([^/]+)/([^/]+?)/?$", url)
    if m:
        owner, repo = m.groups()
        for branch in ("main", "master"):
            for name in ("README.md", "readme.md", "Readme.md"):
                candidate = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{name}"
                try:
                    r = requests.head(candidate, timeout=10)
                    if r.status_code == 200:
                        return candidate
                except Exception:
                    pass

    return url


def _extract_text_from_bytes(content, url="", content_type=""):
    """Dispatch to the right extractor based on magic bytes / extension / content-type."""
    lower_url = url.lower()

    # --- Magic-byte detection (most reliable, checked first) ---
    if content[:4] == b"PK\x03\x04":
        # DOCX is itself a ZIP, so check for its internal structure before
        # falling back to generic ZIP handling.
        if _looks_like_docx(content):
            return _extract_docx(content)
        return _extract_zip(content)

    if content[:5] == b"%PDF-":
        return _extract_pdf(content)

    # --- Extension / Content-Type based detection for plain-text formats ---
    if lower_url.endswith((".md", ".markdown")) or "markdown" in content_type:
        return _extract_plain_text(content, strip_md=True)

    if lower_url.endswith(".txt") or content_type.startswith("text/plain"):
        return _extract_plain_text(content, strip_md=False)

    if lower_url.endswith(".zip") or "zip" in content_type:
        return _extract_zip(content)

    if lower_url.endswith(".docx"):
        return _extract_docx(content)

    if lower_url.endswith(".pdf"):
        return _extract_pdf(content)

    # --- Fallback: try decoding as text; give up if it's binary garbage ---
    return _extract_plain_text(content, strip_md=True, warn_on_binary=True)


def _looks_like_docx(content):
    """DOCX files are ZIPs that contain word/document.xml."""
    try:
        import zipfile
        from io import BytesIO

        with zipfile.ZipFile(BytesIO(content)) as z:
            return "word/document.xml" in z.namelist()
    except Exception:
        return False


def _extract_pdf(content):
    from io import BytesIO

    try:
        from pypdf import PdfReader

        reader = PdfReader(BytesIO(content))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        print(f"   PDF extracted: {len(text)} chars")
        return text[:6000].strip()
    except Exception as e:
        print(f"WARNING: Could not extract PDF text: {e}")
        return ""


def _extract_docx(content):
    from io import BytesIO

    try:
        import docx

        doc = docx.Document(BytesIO(content))
        text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        print(f"   DOCX extracted: {len(text)} chars")
        return text[:6000].strip()
    except ImportError:
        try:
            import mammoth

            result = mammoth.extract_raw_text(BytesIO(content))
            text = result.value
            print(f"   DOCX (mammoth) extracted: {len(text)} chars")
            return text[:6000].strip()
        except ImportError:
            print("WARNING: python-docx and mammoth not installed. Run: pip install python-docx mammoth")
            return ""
    except Exception as e:
        print(f"WARNING: Could not extract DOCX text: {e}")
        return ""


def _extract_plain_text(content, strip_md=False, warn_on_binary=False):
    """Decode TXT / Markdown / README bytes. Optionally strips markdown syntax."""
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        try:
            text = content.decode("latin-1")
        except Exception:
            if warn_on_binary:
                print("WARNING: Content is not text and no matching extractor was found.")
            return ""

    if strip_md:
        text = _strip_markdown(text)

    print(f"   Text extracted: {len(text)} chars")
    return text[:6000].strip()


def _strip_markdown(text):
    """Lightly strip markdown syntax so extracted text reads as plain prose."""
    import re

    text = re.sub(r"```[\s\S]*?```", "", text)                    # code blocks
    text = re.sub(r"`([^`]+)`", r"\1", text)                       # inline code
    text = re.sub(r"!\[.*?\]\(.*?\)", "", text)                    # images
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)           # links -> text
    text = re.sub(r"^#{1,6}\s*", "", text, flags=re.MULTILINE)     # headers
    text = re.sub(r"[*_]{1,3}([^*_]+)[*_]{1,3}", r"\1", text)      # bold/italic
    text = re.sub(r"^\s*[-*+]\s+", "", text, flags=re.MULTILINE)   # bullet markers
    return text


def _extract_zip(content):
    """Extract text from the most relevant file(s) inside a ZIP archive.

    Priority: README-like files first (closest to root wins), then any
    remaining PDF/DOCX/MD/TXT files, until the 6000-char budget is filled.
    """
    import re
    import zipfile
    from io import BytesIO

    try:
        with zipfile.ZipFile(BytesIO(content)) as z:
            names = [n for n in z.namelist() if not n.endswith("/")]

            readme_candidates = sorted(
                [n for n in names if re.search(r"(^|/)readme(\.md|\.markdown|\.txt)?$", n, re.IGNORECASE)],
                key=lambda n: n.count("/"),
            )
            other_candidates = [
                n for n in names
                if n not in readme_candidates and n.lower().rsplit(".", 1)[-1] in ("pdf", "docx", "md", "markdown", "txt")
            ]
            candidates = readme_candidates + other_candidates

            collected = []
            total_len = 0
            for name in candidates:
                if total_len >= 6000:
                    break
                try:
                    file_bytes = z.read(name)
                except Exception:
                    continue

                ext = name.lower().rsplit(".", 1)[-1] if "." in name else ""
                if ext == "pdf":
                    piece = _extract_pdf(file_bytes)
                elif ext == "docx":
                    piece = _extract_docx(file_bytes)
                elif ext in ("md", "markdown"):
                    piece = _extract_plain_text(file_bytes, strip_md=True)
                elif ext == "txt":
                    piece = _extract_plain_text(file_bytes, strip_md=False)
                else:
                    continue

                if piece:
                    collected.append(f"--- {name} ---\n{piece}")
                    total_len += len(piece)

            text = "\n\n".join(collected)
            print(f"   ZIP extracted: {len(text)} chars from {len(collected)} file(s)")
            return text[:6000].strip()

    except Exception as e:
        print(f"WARNING: Could not extract ZIP contents: {e}")
        return ""
    
"""
Requires: pip install supabase

Environment variables expected:
    SUPABASE_URL
    SUPABASE_KEY

Assumed schema (adjust table/column names to match yours):
    users        (id, name)
    submissions  (id, course_id)
    courses      (id, name)
    groups       (id, course_id, name, member_ids)   -- member_ids: text[] array
    exams        (id, questions)                     -- id = "{submission_id}_{student_id}", questions: jsonb array
"""

import os


def get_supabase():
    """Lazily create and cache a Supabase client."""
    global _supabase_client
    try:
        return _supabase_client
    except NameError:
        pass

    try:
        from supabase import create_client

        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_KEY")
        if not url or not key:
            print("WARNING: SUPABASE_URL / SUPABASE_KEY not set")
            _supabase_client = None
            return None

        _supabase_client = create_client(url, key)
        return _supabase_client
    except Exception as e:
        print(f"WARNING: Could not initialize Supabase client: {e}")
        _supabase_client = None
        return None


