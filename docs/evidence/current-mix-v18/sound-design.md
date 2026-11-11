# HolyMind Current Mix v18

## Current Mix v18 — restore electrical scroll presence beside piano

Owner approved v17's musical progression/release and requested only the earlier scroll-current sound louder because the piano masks it.

- Raise only the existing continuous scroll-filament bus by exactly +8 dB (gain 10^(8/20)), after its original activity envelope and ducking, before its existing meter/master route. Static post-envelope gain preserves the sound colour and envelope. No extra oscillator or sound layer.
- Do not alter piano level, source, written Mozart melody/harmony, bounded tempo, overlapping natural release or room. Do not raise the background ambience or brain-tap sounds. Existing scene material ratios, smooth fades, global volume, independent flow toggle and lifecycle behavior stay intact.
- Compare against the exact v17 graph with identical gestures and score using OfflineAudioContext. A first implementation multiplied the gain automation target and introduced a tiny numerical envelope difference; the final implementation uses a constant post-envelope GainNode so the original waveform is preserved up to floating-point precision.
- Publish equal-master fourteen-second before/after previews, without independent normalization. Check a combined full-master stress mix with piano/current/three brain bursts for sample clipping. Such a test does not certify all possible playback situations or real-device listening comfort.

Runtime piano/sound controller and all visual modules are byte-compared against v17. Preview WAVs are rendered from the actual production graphs, not speaker recordings. They are not downloaded by the main page. No new runtime dependency.
