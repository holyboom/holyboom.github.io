# Preserve discovery while protecting original source

The owner's requirement is to keep the site useful and discoverable in web and
AI search while reducing unnecessary publication of original implementation
material. The public showcase, professional identity and credible project
explanations must remain accessible. No ranking or AI recommendation is
guaranteed by this work.

## Observed baseline

Checked on 14 November 2026 against main commit
`6d7e999a426252a5813a7991b4f3b63e98b18f51`:

- The homepage and English/Thai profiles returned HTTP 200. The profiles
  contained useful initial HTML, self-canonical URLs, reciprocal language
  alternatives and a consistent Person identity.
- The robots policy allowed all crawlers, with an explicit OAI-SearchBot allow
  group. No blocking robots metadata or X-Robots-Tag was observed on those pages.
- The sitemap, text summary, structured profile, llms.txt and IndexNow ownership
  file were publicly accessible.
- The source repository was public and Pages published the repository root.
  DESIGN.md and PRODUCT.md were also retrievable directly from the website.
- A bounded domain/name search did not return the site in the results received.
  That observation does not establish that the site is absent from an index.
- The existing IndexNow receipt recorded HTTP 202 on 12 November 2026. It
  explicitly did not confirm indexing or rank.

Search Console, Bing Webmaster Tools, real crawler logs, actual rankings and
AI recommendation frequency were not available for verification. Local tests
and accepted submission requests cannot substitute for these measurements.

## Changes and release gate

The production manifest includes the public pages and their runtime resources,
metadata, licenses and verification files. It excludes development documents,
scripts, QA fixtures and source maps. The source repository's visibility is a
separate control; building an artifact alone changes neither live publication
nor repository access.

A public project explanation replaces profile links that previously depended
on access to raw implementation/QA files. Its statements describe observable
portfolio behavior and label the example scenarios as fictional. The homepage
and English profile now have distinct titles. The new page is linked from the
site and included in the sitemap.

Run:

```sh
npm run build
python3 scripts/test-discovery-gate.py
```

The offline production gate checks:

- Public route coverage, initial HTML text, headings, descriptions, canonical
  URLs, unique titles, language alternatives and consistent structured identity.
- Crawl permission for the public files, including Googlebot, Bingbot,
  OAI-SearchBot and Google-Extended; restrictive robots metadata is rejected.
- Sitemap coverage, local resources/fragments, public evidence links and the
  retained IndexNow key file `e0ad7af3e67c2e99f62f08ac4b786ec5.txt`.
- Absence of development documents, source-map files/directives and links that
  would depend on access to the protected implementation repository.

Negative fixtures confirm that the gate rejects representative regressions.
Its JSON output states its limitations. The explicit `--source` option is an
authoring check and cannot establish production publication safety.

## Bot policy

Keep the current open policy while discovery is the priority. Do not treat all
AI-labelled crawlers as equivalent:

- OpenAI documents separate controls for OAI-SearchBot and GPTBot. A future
  decision about training can preserve ChatGPT Search crawl access.
- Google's current documentation says Google-Extended controls both future
  Gemini training and some Gemini/Vertex AI grounding. Blocking it can therefore
  conflict with the owner's goal of AI discovery, even though it does not
  determine Google Search indexing or ranking.
- robots.txt is a cooperative crawler policy. It does not prevent a visitor
  from copying content or imitating a visible design.

Retaining llms.txt is a convenience for readers and compatible tools, not a
ranking claim. Google's current guidance says it does not help or hurt Google
Search ranking. No hidden instructions, fabricated reviews, artificial
mentions or unsubstantiated outcome claims are added.

## Account and live checks before declaring completion

1. Verify Pages plan eligibility and publishing source before changing source
   visibility. Deploy only the passing `dist/` artifact and preserve a rollback.
2. Recheck public URLs, intended 404s for internal documents, headers and any
   CDN/WAF rules after deployment. A request with a crawler user-agent is not
   proof that real crawler IPs can access the site.
3. In Search Console, inspect the canonical public URLs, submit the sitemap,
   review indexing diagnostics and verify the effective Search generative AI
   setting. Google currently documents Include as the default; the actual
   account setting has not been inspected.
4. In Bing Webmaster Tools, verify ownership, crawl/index status and sitemap
   handling. Treat IndexNow acceptance as submission acknowledgement only.
5. Establish a measured baseline for branded and relevant Thai/English queries,
   impressions, clicks and available AI-search reporting. Record query, date,
   locale and provider because recommendations vary by context.

## Primary references

- [Google guidance for AI search](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [Google common crawlers and Google-Extended](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers)
- [Search Console generative AI setting](https://support.google.com/webmasters/answer/16908024)
- [OpenAI crawler controls](https://developers.openai.com/api/docs/bots)
- [Google robots.txt limitations](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
- [GitHub Pages publication](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [Repository visibility implications](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility)

These references describe provider behavior. They are not evidence that a
specific account setting, index state or search position has been verified.
