# Translation guide: Korean portfolio docs → English

Source: /Users/peterlee/work/personal_prj/neverland/content/{projects,pages,worklog}/<file>.md
Output: /Users/peterlee/work/personal_prj/neverland/content/en/{projects,pages,worklog}/<same file name>.md

The owner (Peter) is a Java/Spring backend developer. These are his public portfolio case studies. Write natural, plain,
professional English that a hiring manager at an international company would read. Keep Peter's voice: factual, understated,
no marketing language, no hype, no filler. Short sentences where the Korean is short. Do not add claims, numbers, or
details that are not in the source. Do not drop content either. Translate everything, section by section.

## Frontmatter (required, exact keys)
Copy these unchanged from the source: collection, type, slug, category, featured, publishedAt, updatedAt, period, tags.
Translate: title, summary, role. Add: lang: "en".
The first body line must be `# <English title>` (same as the frontmatter title). Keep the same heading structure.

## What to translate / what to keep
- Translate prose, headings, table cells, list items, AND the human-readable labels inside ```mermaid blocks.
- Mermaid blocks must stay syntactically valid: keep node ids, arrows, brackets, quotes, `\n` line breaks, subgraph syntax,
  and `participant X as Label`. Only change the label text. Keep a label wrapped in quotes if it was quoted. Avoid putting
  new parentheses, colons, or semicolons into labels that were not quoted in the source (use a dash or comma instead).
  Keep labels short; English is longer than Korean, so shorten rather than overflow.
- Keep code, identifiers, class/method names, file names, URLs, config keys, numbers, units, and tech names as written.
- Internal links: `/projects/<slug>` → `/en/projects/<slug>`, `/writing/<slug>` → `/en/writing/<slug>`.
- Keep Markdown structure (tables, lists, bold, code fences).

## Titles
Use "Name — English descriptor" the same way the Korean title does. Examples:
- "Umpire — 심판 배정·정산 플랫폼" → "Umpire — Referee Assignment & Settlement Platform" (use "umpire" in body text, see glossary;
  in the title use whichever reads best and is consistent with the summary).
- Keep the title unique and not identical to the Korean title.

## Glossary (use consistently)
- 심판 → umpire(s). 국장 → Director (head of the umpire association's operations). 차장 → Deputy Director. 총무 → Treasurer
  (the person who handles settlement). 일반 심판 → regular umpire. 신입 심판 → trainee umpire. 휴직 → on leave.
- 가능 일정 → availability. 배정 → assignment. 경기 슬롯 → game slot. 결과 보고 → game report. 정산 → settlement.
  월 정산 → monthly settlement. 상조회비 → mutual-aid fee. 야간수당 → night-game allowance. 대관 경기 → rental game.
  1심 → single-umpire game. 주심/루심 → plate umpire / base umpire. 판정 가이드 → rules guide. 읽음 확인 → read receipt.
- 손상차손 → impairment loss. 감가상각 → depreciation. 장부가 → carrying amount. 결산 → period-end closing (monthly close).
  회계 마감 → accounting close. 적용 플래그 → apply flag.
- CoA → Certificate of Analysis (CoA). OCAP → Out of Control Action Plan (OCAP). MES → MES (manufacturing execution system).
  "S전자" → "S Electronics" (a client; never write Samsung). 품질팀 → quality team. 협력사/공급업체 → supplier.
- GS건설 → GS E&C. 한국공항공사 → Korea Airports Corporation. 항공사 → airline. DCS = Departure Control System.
- 사업 수행 → project delivery. 사업 관리 → project management. 통역 → interpretation.
- 운영툴 → admin tool / operations tool. 게임 서버 → game server. 인터페이스 서버 → interface server.
- 운영 → operations / in production (pick what fits). 운영 DB → production DB. 인수인계 → handover. 감리 → audit review
  (an external quality/security audit of a delivered system). 시큐어코딩 → secure coding. 웹접근성 → web accessibility.
- Company and product names that are Korean: romanize in a natural way, e.g. 열혈강호 W → "Yeolhyeol Gangho W",
  바즐시스템 → "Bajeul System", 채움솔루션 → "Chaeum Solution", 시그네틱스 → "Signetics", 로그웨이브 → "Logwave",
  부천 → "Bucheon". Keep Korean place names romanized. Collect every romanized proper noun you invent or choose and
  list them in your final reply so the owner can confirm the spelling.
- Roles in frontmatter `role:` should read like a résumé line, e.g. "Planning · Backend · Mobile · Infra & Deployment · Operations".

## Style
- Prefer active, concrete phrasing. Past tense for what was done; present tense for how the system works.
- The Korean uses noun-ending fragments in lists ("~ 구현"). Turn them into short English phrases ("Implemented ...").
- Do not translate the person's name. Do not add a first-person "I" where the source does not imply one; the source is mostly
  impersonal or uses "we/I did" implicitly—match its register but keep it readable.
- Do not invent explanations to make a sentence smoother. If the source is vague, stay vague.
- Do not mention AI, translation, or that this is a translation.

## Final reply
Reply briefly with: files written, and the list of romanized proper nouns / any term you were unsure about.
Do NOT upload anything and do NOT run git. Only write the files.
