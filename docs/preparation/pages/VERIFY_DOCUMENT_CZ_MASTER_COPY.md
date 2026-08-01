# Verify Document: CZ Master Copy

Product: Nobel ITBS Website and Credential Registry  
Page: Verify Document  
Locale: Czech  
URL: `/cz/verify`  
Status: localized from product-owner-approved UA master copy; native-language and parity QA pending  
Updated: 2026-07-31

## SEO
`seo_title`: Ověření dokumentu | Nobel ITBS
`seo_description`: Ověřte dokument Nobel ITBS podle čísla nebo otevřete ověřovací stránku pomocí QR kódu na dokumentu.
`og_title`: Ověření dokumentu Nobel ITBS
`og_description`: Ověřte stav dokumentu podle čísla nebo QR kódu.

## Hero And Instructions
`eyebrow`: Document Verification
`h1`: Ověření dokumentu
`lead`: Zadejte číslo dokumentu a ověřte jeho stav v registru Nobel ITBS.
`instruction`: Použijte číslo přesně ve formátu uvedeném na dokumentu. Pokud obsahuje QR kód, naskenujte jej fotoaparátem telefonu a otevřete ověřovací stránku bez ručního zadávání.

## Manual Verification Form
`field_label`: Číslo dokumentu
`field_placeholder`: Například NITBS-C-2026-000123
`field_helper`: Ověření je dostupné pouze podle celého čísla dokumentu.
`submit_button`: Ověřit
`submitting_button`: Ověřujeme…
`required_error`: Zadejte číslo dokumentu.
`format_error`: Zkontrolujte číslo dokumentu a zkuste to znovu.

## Valid Result
`status_label`: Platný
`heading`: Dokument ověřen
`body`: Dokument byl nalezen v registru Nobel ITBS a má platný stav.
Visible fields: `Číslo dokumentu`; `Držitel dokumentu`; `Program`; `Typ dokumentu`; `Datum vydání`.
`verification_note`: Stránka potvrzuje stav dokumentu v okamžiku ověření.
Nezobrazovat PDF, odkaz ke stažení, partnery, e-mail, telefon, interní ID, poznámky, historii ani úložiště.

## Revoked Result
`status_label`: Odvolaný
`heading`: Dokument byl odvolán
`body`: Tento dokument má stav „Odvolaný“. Podrobnosti dokumentu se nezobrazují.

## Not Found Result
`heading`: Dokument nenalezen
`body`: Pro tento kód nebo číslo nebyl nalezen žádný dokument.
`helper`: Zkontrolujte správnost čísla. Pokud je správné, kontaktujte organizaci, která dokument poskytla.
Stavy pending a voided, neplatný token a neexistující záznam používají stejný veřejný stav bez dalších informací.

## Rate Limit State
`heading`: Příliš mnoho pokusů o ověření
`body`: Nové požadavky jsme dočasně omezili. Chvíli počkejte a zkuste to znovu.
`button`: Zkusit později

## Temporary Error State
`heading`: Ověření se nepodařilo dokončit
`body`: Ověřovací služba je dočasně nedostupná. Zkuste to později.
`retry_button`: Zkusit znovu

## Connection Error State
`heading`: Nelze se spojit s ověřovací službou
`body`: Zkontrolujte připojení k internetu a požadavek opakujte.
`retry_button`: Zkusit znovu

## Privacy And Indexing Rules
- ruční ověřovací stránka je indexovatelná;
- QR-token a všechny výsledkové stránky jsou `noindex`;
- detaily výsledku se nesmí objevit v SEO ani Open Graph metadatech;
- nenabízet hledání podle jména, příjmení, e-mailu, telefonu, ID účastníka ani partnera;
- pouze stav valid zobrazuje podrobnosti;
- revoked zobrazuje pouze stav;
- pending a voided se veřejně chovají jako nenalezené.
