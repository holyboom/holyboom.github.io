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
- Living Mind v4 adds one scroll-linked orchestration chapter, with restrained supporting motion in the workbench, open skills gallery, approach symbol and contact symbol. Native scrolling is never hijacked.
- Original brain artwork is unchanged. A Canvas overlay follows 46 image-derived bright-pixel paths; a masked light sweep stays on the original luminous lines.
- System reduced motion is the default. An explicit visitor choice in the persistent, visibly labelled Motion control is shared by Canvas, CSS and GSAP. No content is hidden when motion or JavaScript is disabled.
- A separate hero wrapper owns scroll transforms; the inner artwork owns breathing. Rebuilt skill cards are registered after asynchronous rendering.
- GSAP and ScrollTrigger 3.15.1 are served locally. Every changed stylesheet and first-party script carries the same release key. No third-party runtime requests.
- Mobile navigation is an explicit menu. Without JavaScript, its links remain visible.
- Use original artwork and unmodified Phosphor UI icons. No generated substitute logo, decorative pseudo-code, invented business statistics, or gradient text.

## Source and implementation

The owner supplied a diagnostic image of the installed HolyMind artwork. Original local artwork was available, so no artwork was regenerated. Responsive WebP derivatives preserve image content and transparency. See `assets/brand-attribution.md` for asset and font notices.

Product Design, Impeccable 4.8.2, Anthropic frontend-design and UI/UX Pro Max source guidance informed the design. Impeccable's binary workflow was unavailable; no certification is claimed. UI/UX Pro Max returned a partial portfolio typography match and generic guidance; its unrelated AI photo-generator palette was not applied.

See `design-qa.md` for the observed review outcome and its limits.

## Showcase v5 — experiential expansion

- Preserve the approved hero, electric brain and Reason → Build → Verify orbit verbatim. Original brain and skill image bytes remain unchanged.
- Signal crossing: two diagonal bands travel in opposite directions as intent turns into a system.
- Assembly workbench: three transparent architecture planes separate and reconnect with a native range control. Scroll changes the viewing angle, not the slider state. Actual workbench step selection updates the top-plane symbol.
- Skill instrument: six original glyphs fan out as optical plates. Tap a plate or use next/previous controls; arrow keys, Home and End work too. The action opens the existing description dialog, returning focus on close. The gallery still contains all 34 skills.
- Services: oversized illustrated disclosure panels rotate into place, with explanations on demand rather than mandatory paragraphs.
- Identity: the existing Boom name is a layered typographic sculpture. Decorative copies are hidden from assistive technology. The longer description is a native details disclosure.
- Contact: a seven-plane octagonal aperture opens around the original goal symbol. Desktop pointer movement tilts its own parent; touch scroll is never captured. The public contact destination is unchanged.
- Bound motion to scroll and control input; add no constant new render loop, sound, network service, analytics or extra runtime dependency. The shared motion switch reverts all contexts and clears pointer effects. Reduced motion defaults to the static compositions; explicit opt-in remains available.
- Every release asset uses the same showcase-v5 key. Capability prose and simulations remain labelled illustrative; there is no live model execution.

## Continuous Mind v6 — shared spatial narrative

- The original hero brain is visually transferred into the orbital scene: one overlay while source and destination are temporarily muted, restored exactly on pause and completion.
- A single luminous shard and three small fragments carry the intention across eleven artifact stations. Its outline transitions between crystal, plane, plate, signature point and octagonal aperture. Ten bridges are derived from scroll position, not play-once entrance events.
- The ribbon crystallizer is actually borrowed during the ribbon-to-assembly handoff; the source and destination images are muted only for that transfer. Different workbench symbol choices crossfade within the same carrier.
- The thread routes through outer margins while in flight, reconnecting to live positions of the original transformed artwork. Long galleries have an exit station so optional expansion does not break the narrative.
- Source art, existing geometry and interactive state are never repainted or reparented. All new visuals use a pointer-transparent, aria-hidden viewport layer below the navigation and native dialog.
- Resize, fonts, gallery height, disclosure changes and ScrollTrigger refreshes remeasure the route. The layer uses input-driven rendering and stops after the existing scrub has settled. Motion off restores all originals and removes the enhancement.
- Release key: continuity-v6. No new runtime library or external network service.
