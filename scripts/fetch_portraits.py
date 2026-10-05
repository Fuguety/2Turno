"""Baixa os retratos que faltam em frontend/public/personalities/portraits/.

Para cada personalidade de personalities.json cujo imagePath não existe em disco,
usa o imageSourceUrl (página da Wikipédia) para pedir a imagem principal via API
(prop=pageimages). Se a página não tiver imagem, tenta a versão em inglês do
artigo. Salva como JPEG, com no máximo 480px de largura, e lista no final o que
não deu para baixar.

Uso: python scripts/fetch_portraits.py [--force] [id ...]
"""
import io
import json
import sys
import time
from pathlib import Path
from urllib.parse import unquote, urlparse

import requests
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "backend/src/main/resources/data/personalities.json"
PUBLIC = ROOT / "frontend/public"
MAX_WIDTH = 480
HEADERS = {"User-Agent": "12axes-portrait-fetcher/1.0 (https://github.com/andreruperto/12axes)"}

session = requests.Session()
session.headers.update(HEADERS)


def parse_wiki_url(url):
    """'https://pt.wikipedia.org/wiki/José_Sarney' -> ('pt', 'José Sarney')."""
    parsed = urlparse(url or "")
    if not parsed.netloc.endswith("wikipedia.org") or not parsed.path.startswith("/wiki/"):
        return None
    lang = parsed.netloc.split(".")[0]
    title = unquote(parsed.path[len("/wiki/"):]).replace("_", " ")
    return lang, title


def api(lang, **params):
    params.update(action="query", format="json", formatversion=2, redirects=1)
    resp = session.get(f"https://{lang}.wikipedia.org/w/api.php", params=params, timeout=30)
    resp.raise_for_status()
    pages = resp.json().get("query", {}).get("pages", [])
    return pages[0] if pages else {}


def find_image_url(lang, title):
    page = api(lang, titles=title, prop="pageimages|langlinks", piprop="thumbnail",
               pithumbsize=800, lllang="en")
    if page.get("missing"):
        return None, "página não existe"
    if "thumbnail" in page:
        return page["thumbnail"]["source"], None
    # Sem imagem na wiki de origem: tenta o artigo equivalente em inglês.
    en_title = next((ll["title"] for ll in page.get("langlinks", [])), None)
    if lang != "en" and en_title:
        en_page = api("en", titles=en_title, prop="pageimages", piprop="thumbnail", pithumbsize=800)
        if "thumbnail" in en_page:
            return en_page["thumbnail"]["source"], None
    return None, "página sem imagem principal"


def save_jpeg(image_url, dest):
    resp = session.get(image_url, timeout=60)
    resp.raise_for_status()
    img = Image.open(io.BytesIO(resp.content))
    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGBA")
        bg = Image.new("RGB", img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[-1])
        img = bg
    else:
        img = img.convert("RGB")
    if img.width > MAX_WIDTH:
        img = img.resize((MAX_WIDTH, round(img.height * MAX_WIDTH / img.width)), Image.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, "JPEG", quality=85, optimize=True)


def main():
    args = sys.argv[1:]
    force = "--force" in args
    only = {a for a in args if not a.startswith("--")}

    personalities = json.loads(DATA.read_text(encoding="utf-8"))
    failures = []
    saved = 0
    for p in personalities:
        if only and p["id"] not in only:
            continue
        dest = PUBLIC / p["imagePath"].lstrip("/")
        if dest.exists() and not force:
            continue
        wiki = parse_wiki_url(p.get("imageSourceUrl"))
        if not wiki:
            failures.append((p["id"], p.get("imageSourceUrl"), "imageSourceUrl não é da Wikipédia"))
            continue
        try:
            image_url, reason = find_image_url(*wiki)
            if not image_url:
                failures.append((p["id"], p["imageSourceUrl"], reason))
                continue
            save_jpeg(image_url, dest)
            saved += 1
            print(f"ok    {p['id']:<28} {image_url}")
        except Exception as exc:  # noqa: BLE001 — queremos seguir para os próximos
            failures.append((p["id"], p.get("imageSourceUrl"), f"erro: {exc}"))
        time.sleep(0.3)

    print(f"\n{saved} retrato(s) salvo(s).")
    if failures:
        print(f"{len(failures)} falha(s):")
        for pid, url, reason in failures:
            print(f"  {pid:<28} {reason}  ({url})")
        sys.exit(1)


if __name__ == "__main__":
    main()
