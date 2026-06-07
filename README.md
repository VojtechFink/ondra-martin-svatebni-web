# 🍂 Svatební web – Ondřej & Martina

Kompletní statický svatební web bez potřeby backendu.  
Veškerý obsah se mění **pouze v souborech ve složce `config/`** – bez dotyku HTML/CSS/JS.

---

## 📁 Struktura projektu

```
Ondra_Martin_svatebni_web/
├── index.html                    ← Hlavní stránka (neměnit)
├── css/
│   └── style.css                 ← Styly (neměnit)
├── js/
│   └── main.js                   ← Logika (neměnit)
├── Images/
│   └── Main_panel_picture.png    ← Foto na úvodní banner
└── config/
    ├── informace.json            ← 🔧 EDITOVAT: datum, místo, program
    ├── uzitecne-informace.json   ← 🔧 EDITOVAT: dress code, parking, ubytování…
    └── formular.json             ← 🔧 EDITOVAT: formulář a jídla
```

---

## ✏️ Jak upravit obsah

### `config/informace.json`

| Pole | Popis |
|---|---|
| `par.zenich` / `par.nevesta` | Jména (zobrazí se v nadpisu i logu) |
| `datum.hodnota` | Text data (např. `"13. září 2025"`) |
| `datum.iso` | Datum pro odpočítávání, formát: `"2025-09-13T14:00:00"` |
| `cas_obradu.hodnota` | Čas začátku obřadu |
| `misto_obradu.nazev` + `adresa` | Název a adresa místa obřadu |
| `misto_obradu.google_maps_embed` | Vložit embed URL z Google Maps (viz níže) |
| `misto_party.*` | Totéž pro místo oslavy |
| `program` | Pole s objekty `{"cas": "14:00", "popis": "..."}` |

**Jak získat URL Google Maps:**
1. Otevřete [maps.google.com](https://maps.google.com)
2. Najděte místo → klik na **Sdílet** → záložka **Vložit mapu**
3. Zkopírujte hodnotu atributu `src="..."` z iframe kódu
4. Vložte do pole `google_maps_embed`

---

### `config/uzitecne-informace.json`

Každá karta má:
```json
{
  "ikona":   "👗",
  "titulek": "Dress code",
  "text":    "Popis...",
  "odkaz":   { "text": "Text odkazu", "url": "https://..." }
}
```
Pole `odkaz` je nepovinné. Karty lze přidávat/odebírat.

---

### `config/formular.json`

- **Jídla**: přidej/odeber objekt v `pole.jidlo.moznosti`. Každé jídlo má `id` (unikátní, bez mezer), `nazev` a `popis`.
- **Možnosti účasti**: uprav pole `pole.ucast.moznosti`.
- **Deadline**: změň text v `podnadpis`.

---

## 📊 Ukládání výsledků formuláře

> ⚠️ Statický web sám o sobě výsledky neuloží. Je potřeba jeden z níže popsaných způsobů.

### Možnost A – Google Sheets (ZDARMA, neomezené)

**Nejlepší volba** – výsledky uvidíš v Google Tabulce odkudkoli.

#### Krok 1: Vytvoř Google Tabulku
1. Otevři [sheets.google.com](https://sheets.google.com) a vytvoř novou tabulku
2. Do prvního řádku vlož záhlaví: `Čas`, `Jméno`, `Účast`, `Jídla`

#### Krok 2: Přidej Apps Script
1. V tabulce: **Rozšíření → Apps Script**
2. Smaž veškerý obsah a vlož tento kód:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data  = JSON.parse(e.postData.contents);

    sheet.appendRow([
      data.cas_odeslani || new Date().toLocaleString('cs-CZ'),
      data.jmeno  || '',
      data.ucast  || '',
      JSON.stringify(data.jidla || {}),
    ]);

    return ContentService
      .createTextOutput('ok')
      .setMimeType(ContentService.MimeType.TEXT);
  } catch(err) {
    return ContentService
      .createTextOutput('error: ' + err.message)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}
```

3. Klikni na **Nasadit** (Deploy) → **Nové nasazení**
4. Typ: **Webová aplikace**
5. Spustit jako: **Já (váš Google účet)**
6. Kdo má přístup: **Kdokoli**
7. Klikni **Nasadit** → zkopíruj URL (vypadá jako `https://script.google.com/macros/s/XXXX/exec`)

#### Krok 3: Nastav endpoint v konfiguraci
V `config/formular.json` uprav:
```json
"submit_typ":      "google_sheets",
"submit_endpoint": "https://script.google.com/macros/s/TVOJE_ID/exec"
```

---

### Možnost B – Formspree (ZDARMA do 50 odpovědí/měsíc)

1. Zaregistruj se na [formspree.io](https://formspree.io)
2. Vytvoř nový formulář → zkopíruj endpoint (např. `https://formspree.io/f/abcdefgh`)
3. V `config/formular.json` nastav:
```json
"submit_typ":      "formspree",
"submit_endpoint": "https://formspree.io/f/TVOJE_ID"
```
Výsledky uvidíš v dashboardu Formspree + přijde e-mail s každou odpovědí.

---

### Možnost C – Demo mód (pro testování)
Nechte `submit_typ` jako `"demo"` – formulář zobrazí úspěšnou zprávu, ale data se nikam neposílají (jen se vypíšou do konzole prohlížeče).

---

## 🖥️ Lokální spuštění (vývoj)

> Soubory **nefungují** při otevření jako `file://` v prohlížeči (z důvodu CORS na fetch).

**Možnost 1 – VS Code Live Server** (nejjednodušší):
- Nainstaluj rozšíření [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
- Pravý klik na `index.html` → **Open with Live Server**

**Možnost 2 – Python (pokud máš nainstalovaný)**:
```bash
cd Ondra_Martin_svatebni_web
python -m http.server 8080
# Otevři: http://localhost:8080
```

---

## 🚀 Nasazení na internet

### Netlify (nejjednodušší, ZDARMA)
1. Zaregistruj se na [netlify.com](https://netlify.com)
2. Přetáhni celou složku `Ondra_Martin_svatebni_web` na dashboard
3. Web bude okamžitě dostupný na `https://neco.netlify.app`
4. Vlastní doménu (`.cz`) lze připojit v nastavení

### Alternativy
- **GitHub Pages** – zdarma, vyžaduje Git
- **Wedos / Forpsi** – klasický FTP hosting, nahrát přes FileZilla

---

## 📷 Výměna úvodní fotografie

Nahraď soubor `Images/Main_panel_picture.png` svým obrázkem.
- Zachovej stejný název souboru, nebo uprav `src` v `index.html` (řádek s `hero__bg`)
- Doporučená velikost: **max 500 KB**, formát WebP nebo optimalizovaný JPG
- Online optimalizace: [squoosh.app](https://squoosh.app)

---

## ✅ Checklist před odesláním pozvánek

- [ ] Vyplnit `config/informace.json` – skutečné datum, místo, čas
- [ ] Doplnit Google Maps embed URL pro obě lokace
- [ ] Vyplnit jídla v `config/formular.json`
- [ ] Nastavit `submit_endpoint` pro ukládání odpovědí
- [ ] Vyměnit úvodní fotografii
- [ ] Nasadit na internet (Netlify)
- [ ] Otestovat formulář a ověřit, že data chodí do tabulky
