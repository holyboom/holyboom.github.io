# Presentation review — faceless performance

Date: 2026-11-14. Scope: restrained copy and CSS polish alongside the performance implementation. This pass changes `scripts/data/profile-story.json` and `assets/profile/living.css`; it does not change the renderer, templates, scene mappings, release identifier, or generated page.

## What the reading experience needed

The existing desktop composition already has a useful division between a readable story column and a persistent stage. The mobile stage also preserves enough room to read. The changes therefore keep the stage dimensions, chapter grid, sticky offsets, and native anchor behavior.

Reviewed the existing [desktop conviction capture](../cinematic-camera/page-13.png), [mobile conviction capture](../cinematic-camera/mobile-conviction.png), source markup, and CSS. The camera review also identified small, low-contrast mobile captions over faint terrain. The underlying character performance and overlapping prop labels during morphs are renderer concerns outside this presentation pass.

## Editorial changes

- **Origins → foundations:** the first bridge turns creative instinct into the responsibility to make an idea dependable. This gives the next chapter an explicit reason to exist.
- **Foundations → connections:** dependable parts lead to the shared system and the people around the work.
- **Applied AI → personal conviction:** the bridge explicitly moves into the maker's own exploration before the uncertainty passage. It does not attribute rejection or a specific incident to an employer.
- **Conviction → craft:** shorter paragraphs preserve the user's account of skepticism, directly encountered problems, and weekly effort. The bridge carries a lesson forward into the creation of a skill.
- **Craft:** reflection precedes worldwide research and synthesis. Each skill develops purpose, method, and character; its moat remains an aspiration being built through experience and refinement, rather than an unsupported achievement claim.
- **Craft → AI experiences:** depth creates the need for a human way in. Clear next steps, control, and the desire to return to the tool for real work remain explicit.
- **AI experiences → invitation:** making a place someone wants to enter returns to the childhood architecture thread.
- **Work → professional summary:** the final bridge names the work and responsibilities behind the story, matching its actual `#experience` destination.

The browser demonstration's illustrative nature and fictional-source disclosure are unchanged. No employers, dates, career facts, outcomes, dialogue, or dramatic incidents were added. Chapter IDs, all beat data, section/link semantics, and schema are preserved.

## Visual changes and purpose

- The scene sequence is slightly quieter when inactive; its active item gains restrained weight as well as its existing color. This helps the current action remain legible without making the list compete with the chapter title.
- Bridge copy is more legible, with a very faint continuous wash, a stable arrow at the end, and an underline on hover or keyboard focus. It reads as an invitation to the next chapter while remaining an ordinary anchor.
- Lead paragraphs use a deliberate reading measure; text wrapping improves awkward short trailing lines without changing the column grid.
- Mobile emotional captions increase from 12px to 13px, with a roomier line height. Meaning labels increase from 7px to 8px. A slightly stronger lower fade and subtle text shadow improve reading over the woven terrain without introducing a panel over the acting area.
- The mobile scene sequence is a little more compact, leaving more space for the story. The stage keeps its existing height.

## Verification performed

Used headless Chromium against the existing local production preview, injecting the edited stylesheet and chapter copy **in the browser only**. This isolates presentation review from the concurrent renderer work and avoids rewriting generated files. Captures were reviewed at 1440×1000, 390×844, and 320×740; the temporary review images were kept outside the repository.

At all three widths, there was no horizontal document overflow and every chapter bridge resolved to an existing target. The meaning label and emotional caption had a positive gap: approximately 9.2px on desktop and 5px on both mobile samples. Mobile stage heights stayed approximately 287px at 390×844 and 252px at 320×740. The craft bridge navigated to `#ai-experiences` through the native anchor. Selecting reduced motion hid the stage and retained the in-flow scene illustration.

JSON parsing confirmed eight story chapters and their 28 existing beats; the three surrounding scenes remain managed by the existing configuration for 31 overall. The release identifier was deliberately left for the implementation owner.

These checks validate this presentation pass against the prior built renderer. They do not constitute a final integrated build review or audience validation of the new acting. The final implementation capture and checks should cover the rebuilt page with the updated motion.
