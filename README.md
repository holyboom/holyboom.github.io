# Holyboom — personal AI engineering profile

Public website: https://holyboom.github.io/

Theerawee Rangram (Boom), AI Engineer and AI Solutions Architect in Bangkok.

## The redesign

The website uses a typographic, content-led visual system and an interactive strategy workbench. Visitors can explore three illustrative business challenges, inspect four workflow stages per challenge, and copy a starting project brief. The examples are not client case studies or a live AI service. No form data is submitted, no model API is called, and there are no analytics or trackers in the application code.

Design references read and applied:
- Hallmark 2.0.0 — https://github.com/Nutlope/hallmark
- Impeccable 4.8.2 — https://github.com/pbakaus/impeccable
- Taste Skill 2.5.1 — https://github.com/Leonxlnx/taste-skill

Their guidance informed the custom redesign. Native upstream engines/gates were not used as a certification; this project has its own browser checks.

## Files and hosting

- `index.html` — semantic profile content, canonical URL, and inline ProfilePage/Person JSON-LD.
- `style.css` — responsive design, focus states, reduced motion, and print support.
- `site.js` — tab/step state, brief composition, and clipboard handling.
- `profile-schema.json`, `llms.txt`, `robots.txt`, and `sitemap.xml` — public discovery metadata.
- `social-preview.png` — a screenshot of the real redesigned page, not an illustrative mockup.

GitHub Pages serves `main` from the repository root. No build step is needed. Test locally with `python3 -m http.server 8000` from this directory. Google Fonts supplies Roboto Condensed and Cabin; system fallback fonts remain available if the network request fails. No font files are stored in this repository.

## Quality checks

Responsive geometry tested at 320, 375, 390, 430, 768, 820, 1024, 1280, 1440, and 1920 CSS pixels. Checks cover viewport overflow, main action visibility, target dimensions, all 12 scenario/step states, keyboard tab navigation, brief copy and fallback, native accordions, JavaScript-disabled core content, and internal anchors. This is functional QA, not a claim of comprehensive accessibility certification.

Public identity and original section anchors are retained. Search engine indexing and ranking are not guaranteed.
