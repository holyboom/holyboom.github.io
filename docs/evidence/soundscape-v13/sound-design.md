# HolyMind — Quiet Current

## The design thesis
The spark is an intentional act. The field is the space in which it happens. Scrolling is a hand shaping that space.

This listening prototype covers Hero → orbital chapters → ribbon → pinned Assemble, then fades its new channels away. All fourteen Electric v12 brain-tap recipes and visual mappings stay unchanged. The cognitive language is a metaphor for unfolding, connecting, pausing, gathering and resolving; it makes no claim about a visitor's thoughts, treatment or engagement outcome.

## Three distinct voices

### Quiet Electric Field
A 110 Hz foundation, a restrained 165 Hz fifth and a small 220.12 Hz partial provide a stable center, not a leading melody. Slow independent modulation at 19, 31 and 43 seconds prevents an obvious beat. A seeded, softly filtered electrical texture supplies movement without repeated spark attacks. Its boundary is overlapped against the continuation of the same texture rather than abruptly cutting a noise buffer.

The field becomes slightly darker approaching Evidence. It does not change songs or chords at section boundaries. It is deliberately much quieter than a tap.

### Reversible Filament
Scroll response is a continuous voice, not files retriggered by scroll events. Actual movement is normalized by viewport height and elapsed time, smoothed, passed through a saturating activity curve and bounded. More speed cannot make it indefinitely louder or brighter.

Two softly modulated carriers and a filtered electrical texture are separate from both the ambient sources and the tap synthesizer. Downward motion opens the spectrum; upward motion gathers it. Pitch changes stay small. Stereo displacement is limited to ±0.09 so the composition remains useful in mono. A direction change needs accumulated movement, not a one-pixel sign flip. Stopping gently releases the current into the field.

### Electric v12 Sparks
Existing tap waveforms, IDs and mappings remain byte-identical. They are the foreground. Ambient and scroll duck around an accepted tap: 25 ms attack, hold to 190 ms, then a 130 ms return time constant. A tap never restarts the field or the scene. Three concurrent tap voices remain the maximum.

## Assemble as a listening moment
The picture stays the source of truth. Sound reads raw assembly progress and uses the same smootherstep before its displayed percentage is rounded. It never changes slider value, pinning, callouts or leader geometry.

As the layers separate, the sound opens. The four reused tap milestones at 25/50/75/100 are replaced by continuous structural texture and one new, dry settled-current cue at full expansion. Returning to the connected state can produce a quieter gathering cue. These are new waveforms, not repitched brain taps. Boundary hysteresis and an 1800 ms cue interval prevent repeated completion noises.

## Mix and controls
One gesture-unlocked AudioContext serves all buses. Ambient, current and resolution feed the original master gain and compressor alongside the unchanged tap engine. Measured levels are digital signals, not sound-pressure levels at a listener's ear.

Sound mix contains master volume, Background ambience and Scroll response. Start/Resume sound is explicit before browser unlock; after starting, the same button mutes sound. It never changes Always-on Motion. Preferences persist, including volume zero.

The Listening Studio compares Taps only / Field + taps / Full mix using the actual showcase at the same master level. Five WAV previews are rendered through the production Web Audio graph with one identical 22-second gesture score and 0.48 master gain. No preview is independently normalized. Two files isolate the field and the reversible current at their production mix levels.

## Intent and lifecycle
No AudioContext or sound exists on load. A trusted tap or explicit Start sound invokes resume within its user gesture. Scroll cannot unlock audio, nor wake a suspended or interrupted context.

Hidden/pagehide stops tap voices and disposes continuous sources. Returning requires a fresh tap; missed events never replay. Ordinary idle ambience uses Web Audio oscillators/LFOs, while the scroll-control animation-frame loop stops after movement settles.

Genuine wheel, touch, keyboard scroll and native range input can drive current. Anchor jumps, resize, history, overscroll and unprompted script repositioning cannot. The new channels fade out after the prototype's Assemble endpoint; existing tap interaction elsewhere stays available.

## Authorship and limits
New audio is source-authored Web Audio synthesis with deterministic texture. It is not recorded material, stock audio, a generative-audio model or an external service. AI-assisted code authorship is not presented as a human field recording.

Browser checks verify actual signal, mute, bus isolation, ducking, intent, lifecycle, mapping and preserved interactions. Offline checks verify finite PCM, peak headroom, fades and level-matched comparisons. They do not certify pleasantness, real iPhone speaker output, battery use, physical-device latency or universal accessibility. The previously requested always-on visual policy is unchanged and is not certified here.

## Implementation
- `holymind-soundscape.js`: shared production/offline graph, three buses, smooth parameter scheduling, ducking and resolution.
- `scroll-sonification.js`: trusted input, continuous eased progress, bounded speed/direction, scope and lifecycle.
- `holymind-audio.js`: original tap player integrated into one context with separate mix preferences.
- `qa/soundscape-v13.html`: actual-page comparison and matched preview players.
- `scripts/render-soundscape.cjs`: OfflineAudioContext exports of the production graph.
- `scripts/qa-soundscape.cjs`: cross-browser actual-signal and native-input checks.

Technical references: MDN Web Audio best practices, AudioParam.setTargetAtTime, Page Visibility API. No new runtime dependency is introduced.
