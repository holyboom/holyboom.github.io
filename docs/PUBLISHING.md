# Production publication and discovery

`npm run build` creates `dist/` from the reviewed resources in
`publish-manifest.json`, then runs the discovery gate through `postbuild`.
The builder uses Node built-ins and the gate uses Python 3. It does not deploy, change repository visibility,
or change GitHub Pages settings. Publishing the repository root still exposes
the development documents, regardless of whether this build succeeds.

## Public artifact

The manifest keeps the showcase, English and Thai profiles, public portfolio
evidence, search metadata, sitemap, robots policy, text profile, verification
file and the resources those pages need. Files are copied without altering
runtime bytes, paths, script order, audio samples, or third-party headers.

Only the two explicitly listed image directories are expanded, non-recursively
and by approved extensions. Add a new route or runtime dependency to the
manifest deliberately. Missing entries, symlinks, paths outside the project,
development directories, `.map` files and source-map directives fail the build.

Design/product documents, development and QA scripts, review fixtures, previous
audio previews, raw MP3 recordings, and README-only artwork are excluded.
The desktop dark README cover is retained because it is the social preview
used by the profiles. Required font/icon/vendor notices, musical attribution,
licensed score data and source-provenance records are retained explicitly.

This is publication hygiene, not a claim that browser-delivered JavaScript,
CSS, images, audio or visible design cannot be copied. Repository access must
be addressed separately; changing to private does not recall existing copies.

## Verify before deployment

```sh
npm run build
```

The command fails if publication or discovery checks fail. To recheck an
existing artifact without rebuilding it, run `npm run check:discovery`.

Serve `dist/` as the document root when verifying HTTP behavior. The existing
development preview server can be launched from that directory, using an
absolute path to `scripts/preview.mjs`. Its development-only `/__review` route
is not part of a static deployment and is not an access-control mechanism.

Run relevant existing motion/audio regressions against that artifact. Preserve
search-facing text, canonical URLs, language alternates, structured data and
crawl access. A successful build or local crawler-style request does not prove
Google/Bing indexing, an AI recommendation, or any ranking.

## GitHub Actions publication

`.github/workflows/publish-pages.yml` validates pull requests targeting `main`
and builds releases on pushes to `main`. It also supports manual runs; only
`refs/heads/main` can upload or deploy. The `github-pages` environment should
continue to allow deployments from `main` only.

The build runs runtime syntax checks, the focused discovery-gate tests, and
`npm run build`, whose `postbuild` runs the gate against the resulting `dist/`.
No dependency installation is needed: these commands use Node.js built-ins
and Python's standard library. The workflow selects Node.js 24 and uses the
Python 3 installation on the `ubuntu-24.04` runner.

Only the validated `dist/` is uploaded. Hidden-file inclusion preserves the
allowlisted `.nojekyll`; the builder rejects other hidden paths. The artifact
is retained for seven days. Official actions are pinned to reviewed release
commits. The build has only `contents: read`; the separate deployment job has
only `pages: write` and `id-token: write`, and runs after the build succeeds.
It does not check out or execute repository scripts.

Production runs share the `pages` concurrency group and do not cancel an
active publication. Pull requests and manual runs on other branches have
separate groups and cancel superseded checks for that ref. Concurrency does
not disable the old branch/root publishing source.
The workflow deliberately does not enable Pages or change repository settings.

## First activation from legacy main/root publishing

1. Push the reviewed change to a feature branch and open a pull request.
   Require its production validation to pass before the cutover. Record the
   current Pages settings, live URL, successful deployment run and main commit.
   Keep changes to `main` paused during the short source-switch/merge sequence.
2. Verify Pages is currently `legacy` with source `main` and `/`, and inspect
   running and queued publishing workflows. The existing `github-pages`
   environment must allow `main`. Keep the repository public on GitHub Free.
3. Change the existing site's build source to **GitHub Actions**, using
   Settings > Pages or the update API below. Do not delete or unpublish the
   site, set its source to None, or change its domain/HTTPS settings. Confirm
   `build_type` is `workflow` and that the current live site remains available.
4. Cancel or wait for any already queued/running legacy **pages build and
   deployment** runs to reach a terminal state before releasing. Recheck after
   the source switch: changing the source must not leave an older root build
   able to deploy after the new artifact. Keep only this intended publisher.
5. Merge the validated PR to `main`. Its push starts the production workflow.
   Wait for that run instead of also dispatching a duplicate. If the push did
   not start a run, dispatch `publish-pages.yml` explicitly on `main`.
6. After deployment, verify the live homepage, both profiles, public portfolio
   evidence, discovery/verification files, runtime dependencies, audio banks
   and credits. Confirm development documents/scripts return 404. Check that
   Pages still uses `workflow` and record the successful run and commit.

The administrator's source-switch command changes only the build type:

```sh
gh api --method PUT repos/holyboom/holyboom.github.io/pages -f build_type=workflow
gh api repos/holyboom/holyboom.github.io/pages \
  --jq '{build_type, html_url, status, source, https_enforced}'
```

These commands are an activation procedure, not something the build runs.
Uploading the repository root, or putting `dist/` beside the source and still
publishing the root, would expose the excluded material again. Live checks
must also inspect response headers and any CDN/WAF rules; the offline gate
cannot validate those controls or search-service account settings.

## Rollback and repository privacy

If the first Actions build or validation fails, repair the candidate while
retaining the existing successful site deployment. Do not unpublish the site
or restore root publication as an automatic fallback. The first migration
has no earlier protected release: a historic legacy run may contain the very
development files being removed from the website.

After the first verified artifact deployment, record that commit and run as
the protected rollback baseline. For a later regression, create a new commit
restoring the last verified protected tree, validate it in a PR, and merge to
`main`. Keep the manifest, builder, discovery gate and Actions workflow in
that restored tree. This rebuilds and deploys only `dist/` through the same
checks; it does not depend on an unexpired artifact or a force-push. Pause
other releases while applying a rollback and verify the live result again.

The account was verified as **GitHub Free** for this migration. GitHub Pages
on that plan requires a public repository; converting this repository to
private would automatically unpublish the site. This rollout therefore keeps
the repository public and its source remains accessible on GitHub. Making
the source private requires a separately selected supported plan or hosting
arrangement. It is not completed by this workflow, and changing visibility
would not remove existing public forks or other copies.

## Official references

- [Configure a Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Custom Pages workflows and deployment permissions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Pages API: update the existing site's build type](https://docs.github.com/en/rest/pages/pages#update-information-about-a-github-pages-site)
- [Repository visibility and Free-plan unpublishing](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility)
- [Ubuntu 24.04 runner software](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md)
- [Checkout v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1), [setup-node v7.1.0](https://github.com/actions/setup-node/releases/tag/v7.1.0), [upload-pages-artifact v5.0.0](https://github.com/actions/upload-pages-artifact/releases/tag/v5.0.0), [deploy-pages v5.0.1](https://github.com/actions/deploy-pages/releases/tag/v5.0.1)
