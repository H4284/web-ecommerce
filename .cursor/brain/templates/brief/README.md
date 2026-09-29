# brief/ — client inputs

Everything the client gives us, in one place, committed. `/kickoff` creates one ClickUp task per row
of the Content checklist in `plan.md`.

```
brief/
├── brand/        logo.svg, logo.png, brand guide PDF, color values (brand.md)
├── copy/         one file per page: home.md, about.md, contact.md … (approved text only)
├── photos/       originals from the client, named by subject (team-01.jpg, shop-front.jpg)
├── refs/         reference screenshot packs from /refs — committed, QA needs them
│   └── <ref-slug>/home-full-1440.png, home-band-1-375.png, …
├── assets.md     licence log for every non-client asset (file, source URL, licence, date)
└── README.md     this file
```

## Ask the client for (Round 4 and 5 of `/kickoff`)

1. Logo as **SVG** (or the original AI / EPS file). PNG only is not enough.
2. Brand colors and fonts they already use, or "none".
3. Copy per page, approved, in the site language(s). Or agree that Thrio writes it.
4. Photos: originals, not WhatsApp compressions. Team, place, products, work.
5. NAP: name, address, **phone and WhatsApp numbers**, opening hours, social links, map pin.
6. Legal: company registration name and number for the privacy page and footer.
7. Access: domain registrar login or a DNS change window; existing hosting if we migrate.

Nothing in `brief/` is placeholder. If it is not approved, it is not here.
