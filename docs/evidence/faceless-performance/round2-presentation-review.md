# Round 2 — restrained presentation review

Date: 2026-11-14. Scope: `assets/profile/living.css` only, plus this record. No story JSON, pose, renderer, template, feature, or generated-page changes.

## Decision

Keep the existing Living Architecture composition, palette, serif voice, chapter bridges, and open final invitation. The Round 1 presentation already supports the story well. Make one small tablet-spacing correction: raise the stage's meaning label by 6px at the existing tablet breakpoint, giving it 8px of clearance above the caption instead of 2px.

The CSS change is the existing `max-width:1099px` rule's `.scene-meaning` bottom value, from `144px` to `150px`. The later mobile override remains unchanged. No stage, canvas, or chapter dimensions change.

## Evidence behind the decision

Reviewed the Round 1 final page captures for the [desktop opening](round1-final/desktop-00.png), [mobile opening](round1-final/mobile-00.png), [desktop conviction](round1-final/desktop-13.png), [mobile conviction](round1-final/mobile-13.png), [desktop bridge into the work](round1-final/desktop-25.png), [mobile bridge](round1-final/mobile-25.png), [desktop professional summary](round1-final/desktop-29.png), [mobile summary](round1-final/mobile-29.png), [desktop final invitation](round1-final/desktop-30.png), and [mobile final invitation](round1-final/mobile-30.png). Also measured all 31 action/caption strings in the live stage at five viewport sizes.

- The action heading provides a clear top anchor. The emotional line remains secondary to the performance, and the main story remains readable beside or below it.
- The existing bridge has a visible vertical thread, readable setup, a larger question, and a clear next-section arrow. Its visual weight is sufficient without making it another card or button.
- “The soul of AI experiences” retains its editorial prominence. The move from this chapter into “Now, step inside” has an explicit textual and visual continuation.
- The final invitation has generous surrounding space and a clear primary action. More framing or decorative elements would reduce that openness.
- The subtle text is not a color-contrast problem on the intended solid page background: body text is approximately 10.85:1, muted text 7.50:1, and the bridge question 16.86:1 against `#0b0912`. Stage accent colors range from approximately 8.72:1 to 14.14:1. These calculated solid-color ratios do not independently certify text over every animated pixel; the reviewed caption regions also benefit from the existing lower fade.

At 1024px and 768px, the tablet caption retains a 54px reserved height while the meaning label previously left only a 2px gap. The 6px adjustment restores a clearer label/caption hierarchy without shifting the action heading or the character.

## Verification

Loaded the current production preview and injected the final source stylesheet into the browser, without rebuilding generated files. Measured all 31 configured action/caption strings in the stage at each viewport. Reviewed the updated 1024×768 AI experiences view visually; its temporary capture is outside the repository.

| Viewport | Minimum label/caption gap after change | Stage height | Horizontal overflow |
| --- | ---: | ---: | --- |
| 1440×1000 | 9.2px | 860px | None |
| 1024×768 | 8px | 628px | None |
| 768×900 | 8px | 760px | None |
| 390×844 | 5px | 287px | None |
| 320×740 | 5px | 252px | None |

All measured label/caption gaps remain positive. Desktop and mobile spacing and all stage heights are unchanged. The implementation owner should include this stylesheet in the next integrated build; these isolated presentation checks do not replace that final capture.
