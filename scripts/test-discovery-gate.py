#!/usr/bin/env python3
"""Small offline mutation tests for the release gate, using temporary fixtures."""
import importlib.util
import json
import sys
import tempfile
from pathlib import Path

sys.dont_write_bytecode = True
SPEC = importlib.util.spec_from_file_location("discovery_gate", Path(__file__).with_name("check-discovery.py"))
GATE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(GATE)


def write(root, relative, text):
    path = root / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def fixture(root):
    person = {"@type": "Person", "@id": GATE.PERSON, "name": "Theerawee Rangram"}
    profile = {"@context": "https://schema.org", "@type": "ProfilePage", "mainEntity": person}
    alternates = "".join('<link rel="alternate" hreflang="' + lang + '" href="' + GATE.ORIGIN + route + '">'
                         for lang, route in (("en", "/profile/"), ("th", "/th/profile/"), ("x-default", "/profile/")))
    for relative, route in GATE.PAGES.items():
        schema = {"@context": "https://schema.org", "@type": "WebPage", "mainEntity": {"@type": "CreativeWork", "creator": {"@id": GATE.PERSON}}} if relative.startswith("work/") else profile
        html = ('<!doctype html><html lang="en"><head><title>Profile ' + route + '</title>'
                '<meta name="description" content="Theerawee Rangram and the HolyMind portfolio">'
                '<meta name="robots" content="index,follow,max-image-preview:large">'
                '<link rel="canonical" href="' + GATE.ORIGIN + route + '">' + alternates +
                '<link rel="stylesheet" href="/assets/site.css">'
                '<script type="application/ld+json">' + json.dumps(schema) + '</script></head><body>'
                '<main id="content"><h1>Theerawee Rangram</h1><p>Boom develops HolyMind AI workflows in Bangkok.</p>'
                '<a href="/profile/#content">Profile</a><a href="https://github.com/holyboom">GitHub</a>'
                '<img src="/assets/brain.svg#brain" srcset="/assets/brain.svg 1x, /assets/brain.svg 2x" alt="HolyMind">'
                '</main><script src="/assets/site.js"></script></body></html>')
        write(root, relative, html)
    write(root, "assets/site.css", "body{background-image:url('/assets/brain.svg#brain')}")
    write(root, "assets/site.js", "document.documentElement.dataset.ready='yes';\n")
    write(root, "assets/brain.svg", '<svg xmlns="http://www.w3.org/2000/svg"><g id="brain"/></svg>')
    write(root, "profile/person.json", json.dumps(person))
    write(root, "profile-schema.json", json.dumps(profile))
    write(root, "profile/summary.txt", "Theerawee Rangram | HolyMind | AI Solutions Architect | Bangkok")
    write(root, "llms.txt", "# Theerawee Rangram\nHolyMind public profile: " + GATE.ORIGIN + "/profile/\n")
    write(root, GATE.INDEXNOW_FILE, Path(GATE.INDEXNOW_FILE).stem)
    write(root, "robots.txt", "User-agent: *\nAllow: /\nSitemap: " + GATE.ORIGIN + "/sitemap.xml\n")
    write(root, "sitemap.xml", '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
          "".join("<url><loc>" + GATE.ORIGIN + route + "</loc></url>" for route in GATE.PAGES.values()) + "</urlset>")


def replace(root, relative, old, new):
    path = root / relative
    text = path.read_text(encoding="utf-8")
    if old not in text:
        raise AssertionError("Mutation target not found: " + relative)
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


def block_query_resource(root):
    replace(root, "index.html", '/assets/site.css"', '/assets/site.css?v=release"')
    write(root, "robots.txt", "User-agent: *\nAllow: /\nDisallow: /*?v=\nSitemap: " + GATE.ORIGIN + "/sitemap.xml\n")


def run():
    cases = [
        ("valid artifact", None, None),
        ("missing IndexNow proof", lambda root: (root / GATE.INDEXNOW_FILE).unlink(), "indexnow_proof"),
        ("altered IndexNow proof", lambda root: write(root, GATE.INDEXNOW_FILE, "different-owner"), "indexnow_proof"),
        ("blocked search crawler", lambda root: write(root, "robots.txt", "User-agent: *\nAllow: /\n\nUser-agent: OAI-SearchBot\nDisallow: /\nSitemap: " + GATE.ORIGIN + "/sitemap.xml\n"), "robots_blocked"),
        ("blocked rendering asset", lambda root: write(root, "robots.txt", "User-agent: *\nAllow: /\nDisallow: /assets/\nSitemap: " + GATE.ORIGIN + "/sitemap.xml\n"), "robots_blocked"),
        ("blocked query-versioned stylesheet", block_query_resource, "robots_blocked"),
        ("noindex in generic meta", lambda root: replace(root, "index.html", "index,follow,max-image-preview:large", "noindex,follow"), "restrictive_meta"),
        ("agent-specific noarchive", lambda root: replace(root, "index.html", "</head>", '<meta name="bingbot" content="noarchive"></head>'), "restrictive_meta"),
        ("wrong canonical", lambda root: replace(root, "index.html", 'rel="canonical" href="' + GATE.ORIGIN + '/"', 'rel="canonical" href="https://example.com/"'), "canonical"),
        ("broken rendering resource", lambda root: (root / "assets/brain.svg").unlink(), "broken_reference"),
        ("broken local fragment", lambda root: replace(root, "index.html", "/profile/#content", "/profile/#missing"), "broken_fragment"),
        ("leaked design document", lambda root: write(root, "DESIGN.md", "Internal design recipes"), "internal_file"),
        ("leaked nested script", lambda root: write(root, "scripts/build.py", "print('internal')"), "internal_file"),
        ("directory symlink in artifact", lambda root: (root / "asset-alias").symlink_to("assets", target_is_directory=True), "internal_file"),
        ("source map file", lambda root: write(root, "assets/site.js.map", "{}"), "internal_file"),
        ("inline source map", lambda root: write(root, "assets/site.js", "//# sourceMappingURL=data:application/json;base64,e30=\n"), "source_map"),
        ("private implementation link", lambda root: replace(root, "index.html", 'href="https://github.com/holyboom"', 'href="https://github.com/holyboom/holyboom.github.io/blob/main/site.js"'), "source_link"),
        ("conflicting Person identity", lambda root: replace(root, "profile/person.json", GATE.PERSON, GATE.ORIGIN + "/#another-person"), "schema_identity"),
        ("one-way language alternative", lambda root: replace(root, "th/profile/index.html", 'hreflang="en"', 'hreflang="fr"'), "hreflang"),
    ]
    results = []
    for name, mutate, expected in cases:
        with tempfile.TemporaryDirectory(prefix="holyboom-discovery-") as directory:
            root = Path(directory)
            fixture(root)
            if mutate:
                mutate(root)
            report = GATE.check_discovery(root)
            codes = {failure["code"] for failure in report["failures"]}
            passed = report["ok"] if expected is None else not report["ok"] and expected in codes
            item = {"case": name, "passed": passed}
            if not passed:
                item["expected_failure"] = expected
                item["actual_failures"] = report["failures"]
            results.append(item)
    # Explicit authoring mode must not mistake private documents for publishable output.
    with tempfile.TemporaryDirectory(prefix="holyboom-source-") as directory:
        root = Path(directory)
        fixture(root)
        write(root, "DESIGN.md", "Internal design recipes")
        report = GATE.check_discovery(root, production=False)
        results.append({"case": "source mode leaves internal documents private", "passed": report["ok"] and report["mode"] == "source"})
    ok = all(item["passed"] for item in results)
    print(json.dumps({"ok": ok, "tests": len(results), "passed": sum(item["passed"] for item in results), "results": results}, indent=2))
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(run())
