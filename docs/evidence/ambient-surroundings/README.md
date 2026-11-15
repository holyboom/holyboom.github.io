# Ambient surroundings — living-surroundings-v7

Added faint, rounded scenery around the performer. Architectural ribs, workspace fragments, network nodes and knowledge seeds change with the chapter. The conviction chapter uses quieter surroundings. All scenery sits behind the character and active work, shares the perspective camera and changes deterministically with scroll. Phones omit secondary details.

## Validation

- Build: 2,222 assertions passed.
- Profile: 59 checks passed.
- Camera: 18 checks passed.
- Performance: 69 checks passed.
- Geometry: 81 sampled positions preserve the previous body and active-work geometry exactly; new surroundings are deterministic and finite, with at most 35 paths.
- Visual review: 18 captures across six scenes, desktop, mobile and standalone artwork; zero browser errors and no visual blocker.

See [visual review](VISUAL-REVIEW.md), [six-scene preview](candidate/sheet-01.png) and [geometry comparison](geometry-check.json).

Built preview updated locally. No public deployment was performed for this change.
