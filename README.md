# Justin Adler — Portfolio

Working samples of analytics dashboards and storefront templates I designed and built while running
the digital channels for a $5–6M omnichannel CPG brand.

Every page is functional: the filters filter, the models recompute, the tables sort, the charts draw.
Nothing is a screenshot.

## Contents

**Marketing & paid media** — Marketing KPIs · Ad Performance (Meta) · Ad Spend YoY ·
New-Customer Cost & Spend Plan

**Analytics & measurement** — 2-Year LTV cohort analysis · Conversions by Source ·
Search Performance

**Production & cost** — Production Throughput · Production Cost Variance

**Storefront development** — Product detail page · Collection page

## About the data

**The nine dashboards run on synthetic data.** They are functional rebuilds of dashboards I designed
and operate in production, reconstructed against invented datasets. I rebuilt them rather than
copying and redacting the originals — redaction is a process you can get *almost* right, and
regeneration isn't.

**The two production dashboards are additionally anonymized**, under a fictional brand with generic
equipment names. Invented numbers alone aren't sufficient there: the shape of a manufacturing
dashboard discloses line configuration and staffing structure on its own.

**The two storefront pages are the exception.** They replicate live public product and collection
pages, so product names, prices, attribute badges and photography are real public catalog content.
They are static — no cart, no checkout, nothing transacts.

## Stack

Vanilla HTML/CSS/JS, Chart.js 4, no build step. A shared shell (`assets/portfolio.css`,
`assets/portfolio.js`) provides theming, light/dark, formatters, a seeded PRNG so synthetic data is
identical on every reload, and table/segment helpers.

---

Oak Park, CA · JstnAdler@gmail.com
