# Holyboom × HolyMind

Public website: https://holyboom.github.io/

Theerawee Rangram (Boom), AI Engineer and AI Solutions Architect in Bangkok, and creator of HolyMind Framework.

## The experience

An original HolyMind neural brain anchors the deep-violet profile. Visitors can explore three illustrative business challenges, inspect their workflow steps, and copy a starting brief. A searchable collection presents 34 original HolyMind skill symbols, grouped into Reason, Build and Verify, with plain-language summaries and illustrative examples.

The workbench and examples are not client case studies, measured business results or a live AI service. The page sends no form submissions and calls no model APIs. Fonts, images and interface icons are self-hosted. No analytics or trackers are included in application code.

## Files and hosting

GitHub Pages serves `main` from the repository root, with no production build step.

- `index.html`: semantic content, metadata and ProfilePage/Person JSON-LD.
- `style.css`: responsive HolyMind design, focus states, motion controls and print styles.
- `site.js`: scenarios, keyboard controls, brief copy, skill search, dialogs and navigation.
- `assets/skills.json`: 34 public concept summaries, with no internal skill instructions.
- `assets/`: optimized original artwork, local fonts, licensed UI icons and attribution.
- `profile-schema.json`, `llms.txt`, `robots.txt`, `sitemap.xml`: public discovery metadata.
- `PRODUCT.md`, `DESIGN.md`: product constraints and durable design decisions.
- `design-qa.md`: review evidence, findings and verification limits when completed.

Run `npm run dev -- --host 0.0.0.0 --port 4173 --strictPort` for the dependency-free development server. `npm run check` checks JavaScript syntax. The development-only `/__review?width=390&height=852` route frames the page at a real mobile CSS viewport for responsive inspection; GitHub Pages does not serve that development route.

## Design references

Product Design, Impeccable 4.8.2, Anthropic frontend-design and UI/UX Pro Max informed the redesign. Their guidance is not a certification. The supplied HolyMind theme and the original artwork are the visual authority. See `DESIGN.md` for deliberate choices and `assets/brand-attribution.md` for ownership and license notices.

Original public identity and section anchors remain. Search inclusion and ranking are not guaranteed.
