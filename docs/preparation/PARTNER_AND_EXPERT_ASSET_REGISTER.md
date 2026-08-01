# Partner And Expert Asset Register

Product: Nobel ITBS Website and Credential Registry  
Stage: Release 1 content and materials preparation  
Status: current copy and all received assets approved for Release 1  
Updated: 2026-08-01

## 1. Purpose

This register records received partner logos and expert photos, their technical
condition, approved public naming, and remaining material dependencies.
Source files are retained unchanged under `assets/source/` and are not direct
web-production assets.

## 2. Alfred Nobel University

`partner_type`: Exclusive academic partner  
`name_ua`: Університет імені Альфреда Нобеля  
`name_en`: Alfred Nobel University  
`name_cz`: Alfred Nobel University  
`country_ua`: Україна  
`country_en`: Ukraine  
`country_cz`: Ukrajina  
`location`: Dnipro, Ukraine  
`official_url`: https://duan.edu.ua  
`naming_status`: approved by product owner  

Received source assets:

| Source asset | Format | Dimensions | Alpha | Technical status |
| --- | --- | ---: | --- | --- |
| `assets/source/partners/alfred-nobel-university/logo-purple.svg` | SVG | 4758 × 2082 viewBox | Native | Valid SVG; no script or external URL references found |
| `assets/source/partners/alfred-nobel-university/logo-purple.png` | PNG | 19032 × 8328 | Yes | High-resolution source; too large for direct web delivery |

Recommended production treatment:

- use a sanitised and optimised SVG as the primary web asset;
- retain the supplied colour and proportions;
- create a smaller raster fallback only if required by the implementation;
- use the localized partner name as accessible alternative text;
- the supplied purple variant is approved for Release 1; preserve its colour
  and proportions in the production derivative.

## 3. Riga Nordic University

`name_ua`: Рижський нордичний університет  
`name_en`: Riga Nordic University  
`name_cz`: Riga Nordic University  
`partner_type`: Partner organisation  
`location`: Riga, Latvia  
`official_url`: https://rnu.lv/en/  
`naming_source`: official English website title, H1 and body copy  

Received source assets:

| Source asset | Format | Dimensions | Alpha | Technical status |
| --- | --- | ---: | --- | --- |
| `assets/source/partners/riga-nordic-university/logo-horizontal-white.svg` | SVG | 245 × 62 viewBox | Native | Official white horizontal header logo; no script or external URL references found |
| `assets/source/partners/riga-nordic-university/logo-seal-blue.png` | PNG | 100 × 100 | Yes | Official compact blue circular mark; low raster resolution |

Source URLs recorded on 2026-08-01:

- inline header SVG at `https://rnu.lv/en/`;
- `https://rnu.lv/wp-content/themes/isma/public/build/img/rnu.png`.

Recommended production treatment:

- preserve both official source variants unchanged;
- use the horizontal white SVG only on a sufficiently dark surface;
- use the blue circular mark only at compact display sizes because its source is
  `100 × 100` pixels;
- do not recolour the official assets without an approved brand variant;
- both received variants are approved for Release 1; choose the appropriate
  variant according to background contrast and display size.

## 4. Mental Health Clinic

`name_ua`: Клініка психічного здоров'я  
`name_en`: Nobel Mental Health  
`name_cz`: Nobel Mental Health  
`official_url`: https://duan.edu.ua/pro-nas/departamenty-ta-strukturni-pidrozdily/klinika-psyhichnogo-zdorov-ja/  
`partner_type`: Partner organisation  
`naming_status`: UA and EN public names approved; the EN brand name is used in CZ  

Received source assets:

| Source asset | Format | Canvas | Alpha | Technical status |
| --- | --- | ---: | --- | --- |
| `assets/source/partners/nobel-mental-health/logo-horizontal-blue.png` | PNG | 1739 × 1739 | Yes | Horizontal lockup on a square canvas with substantial empty space |
| `assets/source/partners/nobel-mental-health/logo-square-blue.png` | PNG | 1739 × 1739 | Yes | Square/vertical lockup with substantial empty space |

Recommended production treatment:

- preserve both supplied originals unchanged;
- trim transparent/empty margins for production variants;
- use the horizontal lockup in partner rows and the square lockup only where a
  compact aspect ratio is required;
- generate appropriately sized WebP or PNG outputs after the visual system sets
  the final logo container dimensions;
- do not translate the `Nobel Mental Health` brand text embedded in the image;
- the received logo variants and current partner card are approved for Release
  1.

## 5. e-launch Online School

`name_ua`: Онлайн-школа e-launch  
`name_en`: e-launch Online School  
`name_cz`: e-launch Online School  
`partner_type`: Partner organisation  
`naming_status`: public name supplied by product owner  
`official_url`: https://e-launch.net/  
`website_branding`: E-LAUNCH; the site also names `e-launch academy`  

Received source asset:

| Source asset | Format | Canvas | Alpha | Technical status |
| --- | --- | ---: | --- | --- |
| `assets/source/partners/e-launch-online-school/logo-black-square.png` | PNG | 1024 × 1024 | Yes | Valid RGBA source; horizontal wordmark on a square canvas with substantial empty space |

Recommended production treatment:

- preserve the supplied original unchanged;
- trim empty margins and prepare a horizontal production variant;
- verify contrast on the final light and dark partner-logo surfaces;
- use the localized organisation name as accessible alternative text;
- the received logo and current partner card are approved for Release 1.

## 6. Nataliia Kholodenko Psychology Centre

`name_ua`: Центр Психології Наталії Холоденко  
`name_en`: Nataliia Kholodenko Psychology Centre  
`name_cz`: Nataliia Kholodenko Psychology Centre  
`partner_type`: Partner organisation  
`official_url`: https://school.kholodenko.net/  
`naming_source`: official header and footer of the programme landing page  

Received source asset:

| Source asset | Format | Dimensions | Alpha | Technical status |
| --- | --- | ---: | --- | --- |
| `assets/source/partners/nataliia-kholodenko-psychology-centre/logo-mark.png` | PNG | 320 × 320 | Yes | Official square mark used in the landing-page header and footer |

Source URL recorded on 2026-08-01:

`https://school.kholodenko.net/assets/logo-kholodenko-DXqajz_s.png`

Recommended production treatment:

- preserve the supplied mark and its proportions;
- display the organisation name as accessible HTML text rather than baking it
  into a new raster image;
- verify contrast on the final partner-card surface;
- use the localized UA name and the approved EN name in EN/CZ alternative text;
- the received mark and current partner card are approved for Release 1.

## 7. Nataliia Kholodenko

`name_ua`: Наталія Холоденко  
`name_en`: Nataliia Kholodenko  
`name_cz`: Nataliia Kholodenko  
`title_ua`: Психологиня, кандидат наук  
`title_en`: Psychologist, Candidate of Sciences  
`title_cz`: Psycholožka, kandidátka věd  
`related_programme`: Neuroplastic Reconstruction  
`profile_status`: name and short title approved by product owner  

Received source asset:

| Source asset | Format | Dimensions | Colour profile | Technical status |
| --- | --- | ---: | --- | --- |
| `assets/source/experts/nataliia-kholodenko/portrait-original.jpg` | JPEG | 1543 × 2057 | Display P3 | Suitable portrait source; embedded EXIF metadata must not be carried into the public derivative |

Recommended production treatment:

- preserve the supplied original unchanged;
- create a metadata-free, colour-managed sRGB web derivative;
- use a consistent portrait crop with the head and shoulders fully visible;
- generate responsive sizes only after the expert-card dimensions are fixed;
- use localized alt text: `Наталія Холоденко`, `Nataliia Kholodenko`, and
  `Nataliia Kholodenko`;
- the received photo and current concise profile are approved for Release 1.

## 8. Dmytro Shevchuk

`name_ua`: Дмитро Шевчук  
`name_en`: Dmytro Shevchuk  
`name_cz`: Dmytro Shevchuk  
`title_ua`: Експерт-практик з маркетингу та продюсування освітніх проєктів  
`title_en`: Practitioner in marketing and educational project production  
`title_cz`: Praktický odborník na marketing a produkci vzdělávacích projektů  
`related_programme`: AI Production  
`photo_status`: source received  
`profile_status`: name, short title and AI Production programme relationship approved by product owner  

Received source asset:

| Source asset | Format | Dimensions | Colour profile | Technical status |
| --- | --- | ---: | --- | --- |
| `assets/source/experts/dmytro-shevchuk/portrait-original.png` | PNG | 970 × 1330 | Color LCD | Suitable portrait source; large file and non-sRGB display profile require a production derivative |

Recommended production treatment:

- preserve the supplied original unchanged;
- create a colour-managed sRGB web derivative;
- crop around the upper body while retaining comfortable headroom;
- compress into responsive WebP or AVIF sizes after card dimensions are fixed;
- use localized alt text `Дмитро Шевчук`, `Dmytro Shevchuk`, and
  `Dmytro Shevchuk`;
- the received photo and current concise profile are approved for Release 1.

## 9. Alina Yudina

`name_ua`: Аліна Юдіна  
`name_en`: Alina Yudina  
`name_cz`: Alina Yudina  
`title_ua`: Психологиня, керівниця Клініки психічного здоров'я, кандидат наук  
`title_en`: Psychologist, Head of Nobel Mental Health, Candidate of Sciences  
`title_cz`: Psycholožka, vedoucí Nobel Mental Health, kandidátka věd  
`related_programme`: General Psychology  
`photo_status`: pending  
`profile_status`: name, short title and General Psychology lecturer role approved  

## 10. Czech Partner Naming Rule

Partner organisation names use their approved English public forms in the Czech
locale. Roles, descriptions, locations and interface copy remain localized into
Czech.

## 11. Remaining Material

- expert photo for Alina Yudina;
- no extended partner descriptions or expert biographies are required for
  Release 1; the approved concise cards are the publication baseline.
