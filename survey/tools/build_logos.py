"""Build the logo set used by the survey figures.

Brand marks come from two icon packages (installed with npm into any folder):
  simple-icons (CC0-1.0)            https://github.com/simple-icons/simple-icons
  @lobehub/icons-static-svg (MIT)   https://github.com/lobehub/lobe-icons
Brands with no mark in either package get a plain wordmark tile, and a few
generic objects (person, server, laptop, ...) are drawn here as line icons.

Usage (from the repository root):
  python3 survey/tools/build_logos.py <path/to/node_modules>
Writes survey/assets/logos/*.svg and survey/logos.js.
"""
import base64
import json
import os
import re
import sys

NM = sys.argv[1]
LOBE = os.path.join(NM, "@lobehub/icons-static-svg/icons")
SI = os.path.join(NM, "simple-icons/icons")
OUT = "survey/assets/logos"

# key: (package, file, fill for single-colour marks or None to keep colours)
MARKS = {
    "openai": ("lobe", "openai", "#0d0d0d"),
    "anthropic": ("lobe", "anthropic", "#191919"),
    "claude": ("lobe", "claude-color", None),
    "claudecode": ("lobe", "claudecode-color", None),
    "codex": ("lobe", "codex-color", None),
    "gemini": ("lobe", "gemini-color", None),
    "antigravity": ("lobe", "antigravity-color", None),
    "google": ("lobe", "google-color", None),
    "googlecloud": ("lobe", "googlecloud-color", None),
    "vertexai": ("lobe", "vertexai-color", None),
    "aws": ("lobe", "aws-color", None),
    "bedrock": ("lobe", "bedrock-color", None),
    "microsoft": ("lobe", "microsoft-color", None),
    "azureai": ("lobe", "azureai-color", None),
    "github": ("lobe", "github", "#1f2328"),
    "githubcopilot": ("lobe", "githubcopilot", "#1f2328"),
    "langgraph": ("lobe", "langgraph-color", None),
    "langchain": ("lobe", "langchain-color", None),
    "crewai": ("lobe", "crewai-color", None),
    "llamaindex": ("lobe", "llamaindex-color", None),
    "cloudflare": ("lobe", "cloudflare-color", None),
    "vercel": ("lobe", "vercel", "#000000"),
    "modal": ("si", "modal", "#1f2328"),
    "exa": ("lobe", "exa-color", None),
    "tavily": ("lobe", "tavily-color", None),
    "bing": ("lobe", "bing-color", None),
    "mcp": ("lobe", "mcp", "#1f2328"),
    "vllm": ("lobe", "vllm-color", None),
    "chrome": ("si", "googlechrome", "#4285F4"),
    "python": ("si", "python", "#3776AB"),
    "jupyter": ("si", "jupyter", "#F37626"),
    "docker": ("si", "docker", "#2496ED"),
    "notion": ("lobe", "notion", "#000000"),
    "kiro": ("lobe", "kiro-color", None),
}

# Brands without a published mark in either package: monogram tile
# (the figures print the full name under every tile).
WORDMARKS = {
    "e2b": "E2B",
    "daytona": "D",
    "sglang": "SG",
    "strands": "S",
    "firecracker": "FC",
}

INK = "#1f2328"
# Generic objects, 24x24 line icons.
LINE_ICONS = {
    "icon-user": '<circle cx="12" cy="8" r="3.6"/><path d="M4.8 20c.8-3.8 3.6-5.8 7.2-5.8s6.4 2 7.2 5.8"/>',
    "icon-server": '<rect x="4" y="3.5" width="16" height="7" rx="1.6"/><rect x="4" y="13.5" width="16" height="7" rx="1.6"/><path d="M7.5 7h.01M7.5 17h.01M11 7h5.5M11 17h5.5"/>',
    "icon-clock": '<circle cx="12" cy="12" r="8.2"/><path d="M12 7.2V12l3.2 2"/>',
    "icon-laptop": '<rect x="5" y="5" width="14" height="10" rx="1.4"/><path d="M2.8 18.5h18.4"/>',
    "icon-terminal": '<rect x="3" y="4.5" width="18" height="15" rx="2"/><path d="M7 9.5l3 2.5-3 2.5M12.5 15h4.5"/>',
    "icon-browser": '<rect x="3" y="4.5" width="18" height="15" rx="2"/><path d="M3 9h18M6 6.8h.01M8.4 6.8h.01"/>',
}


def read(pkg, name):
    base = LOBE if pkg == "lobe" else SI
    return open(os.path.join(base, name + ".svg")).read()


def normalise(svg, fill):
    svg = re.sub(r"<title>.*?</title>", "", svg)
    svg = re.sub(r'\s(width|height|style|role)="[^"]*"', "", svg)
    if fill:
        svg = svg.replace('fill="currentColor"', "")
        svg = svg.replace("<svg", f'<svg fill="{fill}"', 1)
    if "xmlns=" not in svg:
        svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"', 1)
    return svg.strip()


def wordmark(text):
    size = {1: 30, 2: 23, 3: 17}.get(len(text), 13)
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">'
        f'<text x="24" y="25" dominant-baseline="central" text-anchor="middle" '
        f'font-family="ui-sans-serif,system-ui,-apple-system,Segoe UI,Helvetica,Arial,sans-serif" '
        f'font-weight="800" font-size="{size}" letter-spacing="-0.5" fill="{INK}">{text}</text></svg>'
    )


def line_icon(body):
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" '
        f'stroke="{INK}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">{body}</svg>'
    )


os.makedirs(OUT, exist_ok=True)
built = {}
for key, (pkg, name, fill) in MARKS.items():
    built[key] = normalise(read(pkg, name), fill)
for key, text in WORDMARKS.items():
    built[key] = wordmark(text)
for key, body in LINE_ICONS.items():
    built[key] = line_icon(body)

uris = {}
for key, svg in built.items():
    with open(os.path.join(OUT, key + ".svg"), "w") as fh:
        fh.write(svg + "\n")
    uris[key] = "data:image/svg+xml;base64," + base64.b64encode(svg.encode()).decode()

with open("survey/logos.js", "w") as fh:
    fh.write("// Generated by survey/tools/build_logos.py; see survey/assets/logos/README.md for sources.\n")
    fh.write("window.LOGOS = " + json.dumps(uris, indent=0) + ";\n")
print(len(built), "logos")
