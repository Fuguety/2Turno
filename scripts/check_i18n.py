"""Check that each available catalog locale covers the current source catalog."""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1] / "backend/src/main/resources/data"
CATALOGS = {
    "axes": ("axes", ("label", "leftPole", "rightPole")),
    "questions-pool": ("questions", ("text",)),
    "ideologies": ("ideologies", ("name", "category", "description", "phrase")),
    "countries": ("countries", ("name", "category", "description")),
    "personalities": ("personalities", ("name", "role", "description")),
}


def read_items(path):
    items = json.loads(path.read_text(encoding="utf-8"))
    ids = [item["id"] for item in items]
    if len(ids) != len(set(ids)):
        raise ValueError(f"Duplicate IDs in {path}")
    return {item["id"]: item for item in items}


errors = []
for locale_dir in sorted((ROOT / "i18n").iterdir()):
    if not locale_dir.is_dir():
        continue
    for source_name, (overlay_name, required_fields) in CATALOGS.items():
        source = read_items(ROOT / f"{source_name}.json")
        overlay_path = locale_dir / f"{overlay_name}.json"
        if not overlay_path.exists():
            errors.append(f"{locale_dir.name}/{overlay_name}: overlay missing")
            continue
        overlay = read_items(overlay_path)
        for profile_id in sorted(source.keys() - overlay.keys()):
            errors.append(f"{locale_dir.name}/{overlay_name}: missing {profile_id}")
        for profile_id in sorted(overlay.keys() - source.keys()):
            errors.append(f"{locale_dir.name}/{overlay_name}: unknown {profile_id}")
        for profile_id in sorted(source.keys() & overlay.keys()):
            for field in required_fields:
                if not isinstance(overlay[profile_id].get(field), str) or not overlay[profile_id][field].strip():
                    errors.append(f"{locale_dir.name}/{overlay_name}: {profile_id} missing {field}")

if errors:
    raise SystemExit("\n".join(errors))
print("All catalog locale overlays cover the current source data.")
