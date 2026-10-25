# Quanh Lab — English-learning layer v56 (25 Oct 2026)

## Source and editorial policy

This change **does not distribute, overwrite or translate the 388 Vietnamese textbook-page images** or the 85 original textbook contents entries. The original 300 authored Vietnamese lesson records, scientific models, keys, equations, measurement headers, local sessions, and 301 Vietnamese narration recordings remain intact.

Terminology and methodological framing were checked against publicly accessible references:
- OpenStax, *Physics / High School Physics*: https://openstax.org/books/physics/pages/1-introduction
- OpenStax, *College Physics 2e*, physics glossary: https://openstax.org/books/college-physics-2e/pages/2-glossary
- MIT OpenCourseWare, *Classical Mechanics* readings and course textbook: https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/pages/online-textbook/
- NIST, *The International System of Units*, SP 330: https://www.nist.gov/publications/international-system-units-si-2019-edition
- BIPM, SI unit symbols: https://www.bipm.org/en/measurement-units/si-base-units
- MDN, Web Speech API / SpeechSynthesisVoice: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice

The site's new English guides are **original prose** based on the actual experiment title, relevant topic, variable identifiers, displayed formula, and existing bibliography. They are **not** claimed to be literal translations or independent scientific verification of the original six editorial fields (goal, explanation, investigation, misconception, question, answer). Source links do not imply an institution endorses each computational model. Textbook and external materials are linked rather than reproduced.

## Delivered

- One shared VI/EN locale state; user choice persisted independently of laboratory sessions.
- UI label translations, 300 existing edited English titles, English search terms and sorting.
- An original English-guided inquiry for every existing experiment ID, keeping the original subject, formula and model data as source of truth.
- English coach and task prompts, AI tutoring prompt chips, and on-device English browser narration; optional system voices are never represented as bundled recordings.
- Reader controls in English, while the Vietnamese textbook content remains exactly as supplied.
- Dedicated checks for 300 English guides, roundtrips, title and voice locale, alongside the existing full regression suite.

## Known limitations / scientific review backlog

- Not a certified translation of the 1,800 original Vietnamese lesson fields or every runtime sentence. Some scientific status messages, chart captions and annotations inside WebGL/Canvas/Three.js scenes can still originate from Vietnamese-only computational or display modules. Do not market it as 100% English or fully teacher-reviewed.
- Some technical parameters with ambiguous Vietnamese labels use stable English variable names or original mathematical symbols, avoiding unsafe silent substitutions. Expert review remains necessary for term-by-term precision.
- On-device English voice quality and availability differ among Windows, iOS, Android, browsers and installed voice packages. Web Speech availability does not guarantee a particular commercial synthetic speaker or identical audio among devices.
- Automated Node/DOM and physics test coverage is not the same as actual Safari/iPhone visual and pronunciation acceptance testing.
- Changing the language must never call `route()`, `renderLab()` or `reset()`, or rewrite saved states, chart measurements, notes, camera or model configuration.

## Review priorities

1. Have a Physics educator review specialized terms and limits for all models, particularly quantum, nuclear, field and advanced electromagnetism topics.
2. Review all runtime messages and scene-embedded sprites/Canvas for Vietnamese-only strings.
3. On desktop and phones, check text overflow, active task/voice buttons, AI conversation stability, searching by English titles and returning to VI.
4. For a fully bilingual curriculum, separately translate and review the full 1,800 Vietnamese-authored lesson fields without changing the scientific core.
