# Programmes Catalogue: CZ Master Copy

Product: Nobel ITBS Website and Credential Registry  
Page: Programmes Catalogue  
Locale: Czech  
URL: `/cz/programmes`  
Status: product-owner approved for publication; native-language QA may continue after launch  
Updated: 2026-07-31

## 1. Editorial Role

Katalog pomáhá uživatelům porovnat všechny zveřejněné programy Nobel ITBS a
otevřít detail programu, který jim vyhovuje. V Release 1 nejsou viditelné filtry
a v katalogu se nezobrazují ceny.

Primary action: otevřít detail programu.

## 2. SEO

`seo_title`: Profesní vzdělávací programy | Nobel ITBS

`seo_description`: Prohlédněte si profesní programy Nobel ITBS v oblasti
byznysu, technologií a psychologie, včetně distančních kurzů, certifikátových
programů a studia Mini-MBA.

`og_title`: Profesní programy Nobel ITBS

`og_description`: Najděte program pro rozvoj kompetencí, nový profesní směr
nebo systematizaci dosavadních zkušeností.

## 3. Page Introduction

`eyebrow`: Programy

`h1`: Profesní vzdělávací programy

`lead`: Zvolte si vzdělávací cestu podle svého profesního cíle, potřebných
kompetencí a formátu, který vám vyhovuje.

`intro`: Nobel ITBS představuje vlastní i partnerské programy v oblasti byznysu,
technologií, inovací a psychologie. Porovnejte zaměření, délku, jazyk výuky a
dokument vydávaný po dokončení jednotlivých programů.

## 4. Programme Card Content Model

Každá karta používá tato pole:

- stav přijímání přihlášek;
- Programme Area;
- Programme Type;
- název programu;
- krátký popis hodnoty programu;
- délka a rozsah vzdělávání;
- formát;
- jazyk výuky;
- shrnutí vydávaného dokumentu;
- CTA `Zobrazit program`.

Programme Area a Programme Type odkazují na příslušné SEO landing pages. Celá
karta odkazuje na detail programu.

## 5. Enrolment Status Labels

Schválené veřejné štítky:

- `Průběžný zápis` — trvale dostupný program;
- `Přihlášky otevřeny` — otevřený zápis do konkrétního běhu;
- `Již brzy` — program je zveřejněn před otevřením přihlášek;
- `Přihlášky uzavřeny` — program zůstává viditelný, ale aktuálně nepřijímá
  přihlášky.

Pravidla stavů:

- stav se neodvozuje z jazyka stránky;
- `Již brzy` se nepoužívá jen proto, že se program vyučuje v jiném jazyce;
- časově citlivý stav a datum zahájení musí vycházet z aktuálního běhu programu
  nebo z administrátorem schválené změny;
- stav nesmí být sdělován pouze barvou.

## 6. Programme Cards

### AI Production

`status_badge`: Přihlášky otevřeny

`area`: Business & Management

`type`: Mini-MBA

`description`: Vytvářejte, uvádějte na trh a škálujte expertní a vzdělávací
produkty pomocí produktové strategie, marketingu, prodeje, managementu a AI.

`facts`: 6 měsíců · 360 hodin / 12 ECTS · distanční výuka · ukrajinština

`document`: Univerzitní certifikát po 3 měsících a mezinárodní diplom Mini-MBA s
Diploma Supplement po dokončení celého programu.

`cta`: Zobrazit program

### General Psychology

`status_badge`: Průběžný zápis

`area`: Psychology & Human

`type`: Kurz profesního rozvoje

`description`: Vybudujte si strukturovaný základ v oblasti psychiky, osobnosti,
motivace, emocí a kognitivních procesů.

`facts`: 90 hodin / 3 ECTS · distanční výuka v Moodle · přístup na 1 rok ·
ukrajinština

`document`: Certifikát profesního rozvoje od Univerzity Alfreda Nobela.

`cta`: Zobrazit program

### Child Psychology

`status_badge`: Průběžný zápis

`area`: Psychology & Human

`type`: Kurz profesního rozvoje

`description`: Prohlubte své porozumění vývoji dítěte, věkovým specifikům a
odpovědné psychologické podpoře.

`facts`: 90 hodin / 3 ECTS · distanční výuka v Moodle · přístup na 6 měsíců ·
ukrajinština

`document`: Certifikát profesního rozvoje od Univerzity Alfreda Nobela.

`cta`: Zobrazit program

### Neuroplastic Reconstruction

`status_badge`: Přihlášky otevřeny

`status_detail`: Aktuální běh začíná 5. října 2026

`area`: Psychology & Human

`type`: Kurz profesního rozvoje

`description`: Prozkoumejte neuroplasticitu, seberegulaci a behaviorální vzorce
ve strukturovaném programu o 12 modulech.

`facts`: 3 měsíce · 180 hodin / 6 ECTS · kombinovaná distanční výuka ·
ukrajinština

`document`: Dokumenty a profesní status závisí na zvolené cenové variantě.

`cta`: Zobrazit program

### Space Business

`status_badge`: Průběžný zápis

`area`: Technology & Innovation

`type`: Certifikátový program

`description`: Porozumějte vesmírnému trhu, technologiím, start-upům, ekonomice,
právu a modelům mezinárodní spolupráce.

`facts`: 90 hodin · distanční výuka v Moodle · ukrajinština a angličtina

`document`: Certifikát Univerzity Alfreda Nobela; počet hodin se na certifikátu neuvádí.

`cta`: Zobrazit program

## 7. Empty State

`heading`: Programy se připravují ke zveřejnění

`body`: V katalogu momentálně nejsou dostupné žádné programy. Napište nám a
získejte informace o připravovaných možnostech studia.

`cta`: Položit dotaz

## 8. Catalogue Rules

- v Release 1 nejsou viditelné filtry;
- na kartách katalogu se nezobrazují aktuální ani předchozí ceny;
- stav `Již brzy` se neurčuje pouze podle jazyka prezentace nebo výuky;
- fakta o programu pocházejí ze schváleného záznamu programu a lokalizovaného
  master copy, nikoli z nezávislého textu pouze pro katalog;
- skryté nebo nezveřejněné programy se ve veřejném katalogu nezobrazují;
- všechny karty používají fakticky ekvivalentní obsah v EN, UA a CZ;
- karty nesmí naznačovat, že lokalizace stránky do EN nebo CZ znamená výuku v
  tomto jazyce.

## 9. Publication Dependencies

- udržovat aktuální stavy běhů programů a datum zahájení Neuroplastic
  Reconstruction;
- pokračovat v jazykové kontrole po zveřejnění podle potřeby;
- připravit vizuály karet a Open Graph pro jednotlivé programy se schválenými
  alternativními texty.
