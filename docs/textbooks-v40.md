# Quanh Lab textbooks

The new `books.html` page reads the three supplied Kết nối tri thức textbooks. The main navigation and three compact homepage cards open the library. The two obsolete curriculum paragraphs are absent, and the optional "Thử nhanh trên mô hình" section is removed.

| Grade | Supplied pages, including covers | Edition visible in the supplied file |
| --- | ---: | --- |
| 10 | 142 | Supplied textbook |
| 11 | 119 | Bản mẫu |
| 12 | 127 | Bản mẫu |

All 388 pages remain in their original order. Full pages are rendered at 1600 pixels high, without cropping, OCR changes, or watermark removal. The reader loads the current page or spread and nearby pages on demand; it does not download all three books on opening the homepage. Source filenames and SHA-256 hashes are recorded in `sources/textbooks-v40.json`. The smaller supplied grade-12 PDF is used instead of the alternative 75 MB scan.

The page number control follows file order, including the cover. Chapter navigation uses the printed table of contents with its cover offset (one page for grade 10; two pages for grades 11 and 12).

The reader supports single pages on narrow screens, a two-page spread on desktop, 100–250% zoom, keyboard navigation, touch swipes, chapter navigation, full-screen reading with a fallback, direct page URLs, and a separate saved reading position for each grade. Failed image requests keep the last successfully displayed page and offer retry for the requested page. Reduced-motion settings disable the page-turn animation.

Validation before publication: all 388 page assets, 1,552 navigation transitions, and complete first-to-last reachability in both reading modes passed. The main-app DOM regression and seven-width stylesheet checks passed after removing the quick demo and adding textbook links. Live browser verification is recorded separately after deployment.

Live verification: workflow 39209789357 completed successfully for runtime commit 81fb4bc. All three books opened at their final pages; chapter jumps, next/previous page state, keyboard navigation, zoom and position restoration passed. Twelve reader layouts and four bookshelf layouts at 320/390/768/1280 px had no page overflow. Mobile zoom scrolling stayed inside the reader. The testing browser denied native fullscreen; the fallback and its exit passed. No physical phone, Safari or native touch-swipe test was performed. Nineteen public assets matched the committed bytes. See `checks/browser-books-v40.json`, `checks/deployed-books-v40.json` and `docs/quanh-books-v40.jpg`.
