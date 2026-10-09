# ASSA — Source Archive

Primary-source collection only. This repository stores vendor webpages as browser-print PDFs and extracted page text; arXiv articles as original PDFs, extracted text, and available source archives. Each item has its own directory and capture metadata. No original analysis is stored here.

## Layout

- `sources/official/<vendor>/<product>/<page-id>/page.pdf`
- `sources/official/<vendor>/<product>/<page-id>/page.txt`
- `sources/official/<vendor>/<product>/<page-id>/metadata.json`
- `sources/papers/<topic>/<paper-id>/paper.pdf`
- `sources/papers/<topic>/<paper-id>/paper.txt`
- `sources/papers/<topic>/<paper-id>/source.tar` (where arXiv source is available)
- `sources/papers/<topic>/<paper-id>/metadata.json`
- `catalog/seed.json` lists discovered original URLs and identifiers.
- `catalog/capture-results.json` records per-source capture outcomes after workflows run.

Git LFS tracks PDFs and paper source archives. A GitHub Actions workflow downloads and commits sources (including LFS objects) on demand. Failed captures remain visible as errors in metadata, never silently replaced with fabricated material.

To run: Actions → **Capture original sources** → Run workflow. No credentials other than the repository GitHub Actions token are needed for public sources. External sites may block archiving; check the run log and `capture-results.json` for gaps.
