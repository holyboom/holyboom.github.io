#!/usr/bin/env python3
"""Offline release checks for public discovery and private build boundaries.

The default target is dist. --source --root . is an explicit authoring check,
not evidence that the production artifact is safe or a site is indexed.
No requests, credentials, search submissions or provider APIs are used.
"""
import argparse
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
from xml.etree import ElementTree

ORIGIN = "https://holyboom.github.io"
PERSON = ORIGIN + "/#theerawee-rangram"
PAGES = {
    "index.html": "/",
    "profile/index.html": "/profile/",
    "th/profile/index.html": "/th/profile/",
    "work/holymind-portfolio/index.html": "/work/holymind-portfolio/",
}
INDEXNOW_FILE = "e0ad7af3e67c2e99f62f08ac4b786ec5.txt"
DISCOVERY_FILES = (
    "robots.txt", "sitemap.xml", "profile/person.json", "profile/summary.txt",
    "profile-schema.json", "llms.txt", INDEXNOW_FILE,
)
AGENTS = ("*", "Googlebot", "Bingbot", "OAI-SearchBot", "Google-Extended")
VOID_TAGS = set("area base br col embed hr img input link meta param source track wbr".split())
INTERNAL_ROOTS = {"docs", "qa", "scripts", "node_modules", ".git", ".github"}
INTERNAL_NAMES = {
    "design.md", "product.md", "design-qa.md", "agents.md", "package.json",
    "package-lock.json", "publish-manifest.json", "readme.md", "pnpm-lock.yaml",
    "yarn.lock", "tsconfig.json",
}
TEXT_SUFFIXES = {".html", ".css", ".js", ".json", ".txt", ".md", ".xml", ".svg"}
CSS_URL = re.compile(r"url\(\s*(?:\"([^\"]*)\"|'([^']*)'|([^)]*))\s*\)", re.I)
SOURCE_LINK = re.compile(
    r"https?://(?:github\.com/holyboom/holyboom\.github\.io(?:[/#?]|\b)"
    r"|raw\.githubusercontent\.com/holyboom/holyboom\.github\.io/"
    r"|api\.github\.com/repos/holyboom/holyboom\.github\.io(?:[/#?]|\b)"
    r"|codeload\.github\.com/holyboom/holyboom\.github\.io/)", re.I,
)
LIMITATIONS = [
    "Offline file checks do not verify HTTP headers, DNS, CDN rules or real crawler IP access.",
    "Search Console/Bing account settings, indexing, rankings and AI recommendations are unverified.",
    "JavaScript-generated resource URLs and runtime behavior require the separate browser checks.",
]


def srcset_urls(value):
    """Read URL tokens without splitting the comma inside a data URL."""
    remaining = value.strip()
    while remaining:
        remaining = remaining.lstrip(" ,\t\n\r")
        if not remaining:
            break
        match = re.match(r"\S+", remaining)
        token = match.group(0)
        remaining = remaining[len(token):]
        if token.endswith(","):
            yield token.rstrip(",")
        else:
            yield token
            delimiter = remaining.find(",")
            remaining = remaining[delimiter + 1:] if delimiter >= 0 else ""


def css_urls(text):
    for match in CSS_URL.finditer(text):
        yield next(part for part in match.groups() if part is not None).strip()
    for match in re.finditer(r"@import\s+[\"']([^\"']+)[\"']", text, re.I):
        yield match.group(1)


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.ids, self.refs, self.meta, self.links = set(), [], [], []
        self.title, self.main, self.jsonld, self.style = [], [], [], []
        self.h1 = self.main_count = 0
        self.feed(text)
        self.close()

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if attrs.get("id"):
            self.ids.add(attrs["id"])
        if tag == "a" and attrs.get("name"):
            self.ids.add(attrs["name"])
        hidden = any(item[1] for item in self.stack) or (
            "hidden" in attrs or attrs.get("aria-hidden", "").lower() == "true"
            or bool(re.search(r"display\s*:\s*none|visibility\s*:\s*hidden", attrs.get("style", ""), re.I))
        )
        if tag == "h1" and not hidden:
            self.h1 += 1
        if tag == "main" and not hidden:
            self.main_count += 1
        if tag == "meta":
            self.meta.append(attrs)
        if tag == "link":
            self.links.append(attrs)
        if tag in {"a", "area", "link", "use", "image"} and attrs.get("href"):
            self.refs.append((attrs["href"], tag))
        if tag in {"img", "script", "source", "audio", "video", "track", "iframe", "input"} and attrs.get("src"):
            self.refs.append((attrs["src"], tag))
        if attrs.get("poster"):
            self.refs.append((attrs["poster"], "poster"))
        if attrs.get("srcset"):
            self.refs.extend((url, "srcset") for url in srcset_urls(attrs["srcset"]))
        self.refs.extend((url, "inline-style") for url in css_urls(attrs.get("style", "")))
        if tag == "script" and attrs.get("type", "").lower() == "application/ld+json":
            self.jsonld.append("")
        if tag not in VOID_TAGS:
            self.stack.append((tag, hidden, attrs))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID_TAGS:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index][0] == tag:
                del self.stack[index:]
                break

    def handle_data(self, data):
        tags = [entry[0] for entry in self.stack]
        if "title" in tags:
            self.title.append(data)
        if self.stack and self.stack[-1][0] == "script":
            if self.stack[-1][2].get("type", "").lower() == "application/ld+json":
                self.jsonld[-1] += data
        if self.stack and self.stack[-1][0] == "style":
            self.style.append(data)
        if "main" in tags and not any(entry[1] for entry in self.stack) and not set(tags) & {"script", "style", "template"}:
            self.main.append(data)


def schema_objects(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from schema_objects(child)
    elif isinstance(value, list):
        for child in value:
            yield from schema_objects(child)


def is_type(node, name):
    value = node.get("@type", [])
    return name == value or isinstance(value, list) and name in value


class Robots:
    """Group specificity, merged matching groups and longest allow/disallow rule."""
    def __init__(self, text):
        self.groups, self.sitemaps = [], []
        agents, rules = [], []
        for line in text.splitlines():
            field, separator, value = line.split("#", 1)[0].partition(":")
            if not separator:
                continue
            field, value = field.strip().lower(), value.strip()
            if field == "user-agent":
                if rules:
                    self.groups.append((agents, rules))
                    agents, rules = [], []
                agents.append(value.lower())
            elif field in {"allow", "disallow"} and agents:
                rules.append((field == "allow", value))
            elif field == "sitemap":
                self.sitemaps.append(value)
        if agents:
            self.groups.append((agents, rules))

    def allows(self, agent, path):
        candidates = []
        for agents, rules in self.groups:
            matching = [len(token) for token in agents if token != "*" and token in agent.lower()]
            specificity = max(matching) if matching else (0 if "*" in agents else -1)
            if specificity >= 0:
                candidates.append((specificity, rules))
        if not candidates:
            return True
        specificity = max(item[0] for item in candidates)
        matches = []
        for group_specificity, rules in candidates:
            if group_specificity != specificity:
                continue
            for allow, pattern in rules:
                if not pattern:
                    continue
                expression = re.escape(pattern.rstrip("$")).replace(r"\*", ".*")
                if re.match("^" + expression + ("$" if pattern.endswith("$") else ""), path):
                    matches.append((len(pattern.replace("*", "").rstrip("$")), allow))
        return max(matches)[1] if matches else True


class Gate:
    def __init__(self, root, production=True):
        self.root = Path(root).resolve()
        self.production = production
        self.failures, self.pages, self.text = [], {}, {}
        self.counts = {"assertions": 0, "html_pages": 0, "schemas": 0,
                       "local_references": 0, "crawler_checks": 0, "public_files": 0}
        self.crawl_paths = set(PAGES.values())

    def require(self, condition, code, path, message):
        self.counts["assertions"] += 1
        if not condition:
            failure = {"code": code, "path": str(path), "message": message}
            if failure not in self.failures:
                self.failures.append(failure)

    def read(self, relative):
        if relative not in self.text:
            try:
                self.text[relative] = (self.root / relative).read_text(encoding="utf-8")
            except (OSError, UnicodeError) as error:
                self.require(False, "read_file", relative, str(error))
                self.text[relative] = ""
        return self.text[relative]

    def page(self, relative):
        if relative not in self.pages:
            self.pages[relative] = Page(self.read(relative))
        return self.pages[relative]

    @staticmethod
    def internal(relative):
        parts = Path(relative).parts
        return bool(parts) and (parts[0] in INTERNAL_ROOTS or
            len(parts) == 1 and parts[0].lower() in INTERNAL_NAMES or
            any(part.startswith(".env") for part in parts) or
            Path(relative).suffix.lower() in {".map", ".py", ".cjs", ".mjs", ".ts", ".tsx", ".psd", ".blend"})

    def resolve(self, source, reference, kind="link"):
        if not reference or reference.startswith(("data:", "mailto:", "tel:", "javascript:")):
            return
        parsed = urlsplit(urljoin(ORIGIN + "/" + source, reference))
        if parsed.scheme not in {"http", "https"} or parsed.netloc.lower() != "holyboom.github.io":
            return
        decoded = unquote(parsed.path)
        relative = decoded.lstrip("/")
        if not relative or relative.endswith("/"):
            relative += "index.html"
        target = (self.root / relative).resolve()
        self.counts["local_references"] += 1
        self.require(target.is_relative_to(self.root), "unsafe_reference", source, reference)
        if not target.is_relative_to(self.root):
            return
        self.require(not self.internal(relative), "internal_link", source, reference)
        self.require(target.is_file(), "broken_reference", source, reference)
        crawl_target = parsed.path or "/"
        if parsed.query:
            crawl_target += "?" + parsed.query
        self.crawl_paths.add(crawl_target)
        if target.is_file() and parsed.fragment and not parsed.fragment.startswith(":~:text="):
            if target.suffix.lower() in {".html", ".svg"}:
                self.require(unquote(parsed.fragment) in self.page(relative).ids,
                             "broken_fragment", source, reference)

    def check_schema(self, value, path, profile=False):
        nodes = list(schema_objects(value))
        self.counts["schemas"] += 1
        people = [node for node in nodes if is_type(node, "Person")]
        for person in people:
            self.require(person.get("@id") == PERSON, "schema_identity", path,
                         "Every Person definition must use the established public identity.")
            self.require(person.get("name") == "Theerawee Rangram", "schema_identity", path,
                         "Person name must agree with the public profile.")
        if profile:
            self.require(bool(people), "schema_person", path, "Missing explicit Person identity.")
        return nodes

    def run(self):
        if not self.root.is_dir():
            self.require(False, "root", self.root, "Build the production artifact before running this gate.")
            return self.report()
        for relative in (*PAGES, *DISCOVERY_FILES):
            self.require((self.root / relative).is_file(), "required_file", relative, "Required public file is missing.")
        self.require((self.root / INDEXNOW_FILE).is_file() and self.read(INDEXNOW_FILE).strip() == Path(INDEXNOW_FILE).stem,
                     "indexnow_proof", INDEXNOW_FILE, "Keep the existing IndexNow ownership proof unchanged.")

        titles = []
        for relative, route in PAGES.items():
            if not (self.root / relative).is_file():
                continue
            page = self.page(relative)
            title = " ".join("".join(page.title).split())
            titles.append(title)
            self.require(bool(title), "title", relative, "A native title is required.")
            descriptions = [meta.get("content", "").strip() for meta in page.meta if meta.get("name", "").lower() == "description"]
            self.require(len(descriptions) == 1 and bool(descriptions[0]), "description", relative, "One nonempty description is required.")
            canonicals = [link.get("href") for link in page.links if "canonical" in link.get("rel", "").lower().split()]
            self.require(canonicals == [ORIGIN + route], "canonical", relative, "Canonical must be the unchanged absolute public route.")
            self.require(page.h1 == 1, "h1", relative, "Exactly one visible native H1 is required.")
            main = " ".join(page.main)
            self.require(page.main_count == 1 and bool(re.search(r"Theerawee.{0,50}Rangram|ธีรวีร์\s*รางแรม", main, re.I | re.S)) and "HolyMind" in main,
                         "native_content", relative, "Main HTML must retain the person's identity and HolyMind context without running JavaScript.")
            nodes = []
            for value in page.jsonld:
                try:
                    nodes.extend(self.check_schema(json.loads(value), relative, profile=False))
                except json.JSONDecodeError as error:
                    self.require(False, "schema_json", relative, str(error))
            self.require(bool(nodes), "schema_json", relative, "Valid native JSON-LD is required.")
            if relative.startswith("work/"):
                self.require(any(is_type(node, "WebPage") or is_type(node, "CreativeWork") for node in nodes), "schema_work", relative, "Public work needs a WebPage or CreativeWork description.")
            else:
                self.require(any(is_type(node, "ProfilePage") for node in nodes) and any(is_type(node, "Person") and node.get("@id") == PERSON for node in nodes), "schema_person", relative, "ProfilePage and the established Person are required.")
        self.require(len(titles) == len(set(titles)), "duplicate_title", "public pages", "Each primary page needs its own title.")

        expected_languages = {"en": ORIGIN + "/profile/", "th": ORIGIN + "/th/profile/", "x-default": ORIGIN + "/profile/"}
        for relative in ("profile/index.html", "th/profile/index.html"):
            if (self.root / relative).is_file():
                alternate = {link.get("hreflang"): link.get("href") for link in self.page(relative).links if "alternate" in link.get("rel", "").split() and link.get("hreflang")}
                self.require(all(alternate.get(language) == url for language, url in expected_languages.items()), "hreflang", relative, "English and Thai profiles must have reciprocal language alternatives.")
        for relative in ("profile/person.json", "profile-schema.json"):
            try:
                self.check_schema(json.loads(self.read(relative)), relative, profile=True)
            except json.JSONDecodeError as error:
                self.require(False, "schema_json", relative, str(error))

        entries = list(self.root.rglob("*"))
        if self.production:
            for path in entries:
                self.require(not path.is_symlink(), "internal_file", path.relative_to(self.root).as_posix(),
                             "Production entries must not be symlinks.")
        public_files = [path for path in entries if path.is_file()]
        if not self.production:
            public_files = [path for path in public_files if not self.internal(path.relative_to(self.root).as_posix())
                            and "dist" not in path.relative_to(self.root).parts]
        for path in public_files:
            relative = path.relative_to(self.root).as_posix()
            self.counts["public_files"] += 1
            if self.production:
                self.require(not self.internal(relative), "internal_file", relative, "Internal development material must not be published.")
            if path.suffix.lower() not in TEXT_SUFFIXES:
                continue
            text = self.read(relative)
            self.require(not SOURCE_LINK.search(text), "source_link", relative, "Public proof should link to the public work page, not the private implementation repository.")
            if self.production:
                self.require(not re.search(r"(?:/\*|//)\s*[@#]\s*sourceMappingURL\s*=", text), "source_map", relative, "Do not publish inline or external source-map references.")
            if path.suffix.lower() == ".html":
                page = self.page(relative)
                self.counts["html_pages"] += 1
                for meta in page.meta:
                    name = meta.get("name", "").lower()
                    if name == "robots" or "bot" in name or name in {"google-extended", "slurp", "baiduspider"}:
                        directive = meta.get("content", "").lower()
                        self.require(not re.search(r"(?:^|[,\s])(?:noindex|none|nosnippet|noarchive|nocache)(?:$|[,\s])|max-snippet\s*:\s*0(?:$|[,\s])|ai-grounding\s*:\s*disallow", directive), "restrictive_meta", relative, "Public page contains a restrictive crawler/snippet directive: " + directive)
                for reference, kind in page.refs:
                    self.resolve(relative, reference, kind)
                for reference in css_urls("".join(page.style)):
                    self.resolve(relative, reference, "style")
            elif path.suffix.lower() == ".css":
                for reference in css_urls(text):
                    self.resolve(relative, reference, "css")

        try:
            tree = ElementTree.fromstring(self.read("sitemap.xml"))
            locations = [node.text or "" for node in tree.findall("{*}url/{*}loc")]
            self.require({ORIGIN + route for route in PAGES.values()} <= set(locations), "sitemap", "sitemap.xml", "Every canonical public page must be in the sitemap.")
            self.require(len(locations) == len(set(locations)), "sitemap", "sitemap.xml", "Duplicate sitemap URL.")
            for location in locations:
                parsed = urlsplit(location)
                self.require(parsed.scheme == "https" and parsed.netloc == "holyboom.github.io" and not parsed.query and not parsed.fragment, "sitemap", "sitemap.xml", "Sitemap URLs must be absolute canonical URLs.")
                self.resolve("sitemap.xml", location)
                relative = unquote(parsed.path).lstrip("/")
                if not relative or relative.endswith("/"):
                    relative += "index.html"
                if (self.root / relative).is_file() and relative.endswith(".html"):
                    canonicals = [link.get("href") for link in self.page(relative).links if "canonical" in link.get("rel", "").lower().split()]
                    self.require(canonicals == [location], "sitemap", "sitemap.xml", "Sitemap URL must agree with the page's self-canonical: " + location)
        except ElementTree.ParseError as error:
            self.require(False, "sitemap", "sitemap.xml", str(error))
        robots = Robots(self.read("robots.txt"))
        self.require(ORIGIN + "/sitemap.xml" in robots.sitemaps, "robots_sitemap", "robots.txt", "Robots must point to the public sitemap.")
        self.crawl_paths.update("/" + relative for relative in DISCOVERY_FILES)
        for agent in AGENTS:
            for path in sorted(self.crawl_paths):
                self.counts["crawler_checks"] += 1
                self.require(robots.allows(agent, path), "robots_blocked", "robots.txt", agent + " must be able to crawl " + path)
        return self.report()

    def report(self):
        return {"ok": not self.failures, "mode": "production" if self.production else "source",
                "root": str(self.root), "counts": self.counts,
                "failures": self.failures, "limitations": LIMITATIONS}


def check_discovery(root, production=True):
    return Gate(root, production).run()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parent.parent / "dist")
    parser.add_argument("--source", action="store_true", help="Explicit authoring check; does not certify a production artifact.")
    args = parser.parse_args()
    if args.source and not any(argument == "--root" or argument.startswith("--root=") for argument in sys.argv[1:]):
        parser.error("--source requires an explicit --root path")
    result = check_discovery(args.root, production=not args.source)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
