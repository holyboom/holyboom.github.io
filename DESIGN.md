# HolyMind visual system

## Direction

Boom's professional website uses the original HolyMind violet neural brain and geometric skill marks supplied by the owner. This is a redesign of the existing public profile, not a reproduction of the diagnostic asset grid. The homepage gives the brain one memorable focal position; the workbench explains a business outcome; the skill collection supports exploration without making the whole site a catalogue.

## Tokens

| Token | Value | Use |
|---|---|---|
| Night | `#100b1b` | Main background |
| Surface | `#181121` | Workbench and collection section |
| Raised | `#21172f` | Selected tasks and skill tiles |
| Ink | `#f4efff` | Main text |
| Muted | `#bcb0ce` | Supporting text |
| Soft | `#d8cbe9` | Secondary headings |
| Violet | `#a274ee` | Progress and small accents |
| Lilac | `#d3b4ff` | Primary actions and selected states |
| Action ink | `#231133` | Text on lilac |
| Line | `#3c2e4e` | Quiet structural separators |

Display: self-hosted Sora variable, weight 500 for large headings, tracking no tighter than -0.04em. Body: self-hosted DM Sans variable. Thai content uses the user's native Thai font fallback. Body measure is bounded, with headings balanced and fluid down to 320 CSS pixels.

## Layout and interaction

- Wide hero with a readable statement and original brain artwork; mobile stacks the primary message and action before the artwork.
- Three purposeful symbol-led links connect the hero to the relevant sections.
- The existing three-scenario workbench remains functional. Each of four steps has an illustrative HolyMind skill pairing.
- The collection initially shows eight featured skills; search and purpose filters expose all 34 without forcing a long first scroll.
- Skill details use a native dialog with a close control, Escape dismissal, and focus return.
- Motion is limited to one slow brain movement, with a persistent pause control. System reduced motion wins.
- Mobile navigation is an explicit menu. Without JavaScript, its links remain visible.
- Use original artwork and unmodified Phosphor UI icons. No generated substitute logo, decorative pseudo-code, invented business statistics, or gradient text.

## Source and implementation

The owner supplied a diagnostic image of the installed HolyMind artwork. Original local artwork was available, so no artwork was regenerated. Responsive WebP derivatives preserve image content and transparency. See `assets/brand-attribution.md` for asset and font notices.

Product Design, Impeccable 4.8.2, Anthropic frontend-design and UI/UX Pro Max source guidance informed the design. Impeccable's binary workflow was unavailable; no certification is claimed. UI/UX Pro Max returned a partial portfolio typography match and generic guidance; its unrelated AI photo-generator palette was not applied.

See `design-qa.md` for the observed review outcome and its limits.
