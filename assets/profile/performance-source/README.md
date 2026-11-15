# Authored performance controls

These three real Blender Actions provide bounded **secondary** timing/pose offsets for drawing, changed retry and rising. The browser rig owns the primary pose, fixed limb proportions, IK, grounded support and contact. This is not a complete Blender character rig or a skinned-mesh export.

- `performance-controls.blend`: open in Blender, select `PERFORMANCE_draw`, `PERFORMANCE_repair` or `PERFORMANCE_rise`, then inspect its Action in the Graph Editor.
- `pilot-clips.js` / `.json`: baked phase samples, evaluated from the Blender F-curves; phase is normalized scroll progress, not elapsed browser time.
- `bake-report.json`: numerical validation and a checksum of the exported data.
- `control-curves.png`: a diagnostic curve chart rendered from the source file.

Regenerate from the repository root:

```sh
blender --background --python scripts/author-profile-performance.py
```

The supported reproducible authoring source is the Python key specification. If editing the `.blend` by hand, transfer those intentional key changes into the script before regenerating; this script recreates the authoring scene.

Browser integration: load `pilot-clips.js`, then provide `ProfilePerformanceClips` to `ProfileMotion.setClips()`. Do not claim the data drive the live scene unless that call is present. Angles are radians. Coordinates are X right, Y up, Z toward the viewer, with small model-unit offsets around the browser's own stage. Apply authoritative contact constraints after secondary offsets. Endpoints contain zero offsets; declared drawing/contact phases leave the relevant hand offsets at zero. No external motion/model asset is bundled.
