# pokero-traffic-bot

Bot oparty na [Playwright](https://playwright.dev/), symulujący ruch użytkowników na
`https://pokero.pl/pl` do celów testów UI / regresji: nawigacja, kliknięcia w
przyciski i scrollowanie strony wg zdefiniowanych scenariuszy.

To narzędzie do testowania **własnej** strony (synthetic UI testing), nie do
generowania sztucznego ruchu w celu zawyżania statystyk odwiedzin/reklam.

## Instalacja

```bash
cd bots/pokero-traffic-bot
npm install
npm run install-browsers   # pobiera Chromium dla Playwright
```

## Uruchomienie

```bash
npm start -- --sessions=3 --iterations=2 --headless=true
```

Dostępne flagi (`--flaga=wartosc`):

| Flaga | Domyślnie | Opis |
|---|---|---|
| `--baseUrl` | `https://pokero.pl` | Domena bazowa; scenariusze doklejają ścieżkę (np. `/pl`) |
| `--sessions` | `3` | Liczba równoległych "wirtualnych użytkowników" (max 20 — patrz `MAX_SAFE_SESSIONS` w `src/cli.ts`) |
| `--iterations` | `1` | Ile razy każda sesja przechodzi przez losowy scenariusz |
| `--headless` | `true` | `false` żeby zobaczyć przeglądarkę na żywo (przydatne przy debugowaniu selektorów) |
| `--delayBetweenSessionsMs` | `1500` | Odstęp startu kolejnych sesji, żeby nie uderzać w serwer całym ruchem naraz |
| `--scenario` | `all` | Nazwa konkretnego scenariusza (patrz pole `name` w plikach JSON) albo `all`, by losować spośród wszystkich wg wagi (`weight`) |

Szybki podgląd z widoczną przeglądarką:

```bash
npm run dry-run
```

## Scenariusze

Scenariusze to pliki JSON w `scenarios/`. Każdy ma listę kroków wykonywanych
po kolei:

- `goto` — przejście na `path` względem `baseUrl`
- `wait` — losowa pauza `minMs`–`maxMs` (imituje czas reakcji człowieka)
- `scroll` — `mode`: `human` (scroll kółkiem w kilku krokach), `toBottom`,
  `toTop`, `toSelector` (przewija do wskazanego elementu)
- `click` — klika element pasujący do `selector`; `pick: "random"` losuje
  spośród pasujących elementów, `optional: true` sprawia, że brak elementu
  nie przerywa scenariusza, `waitForNavigation: true` czeka na przeładowanie
  strony po kliknięciu

Dołączone scenariusze (`homepage-browse.json`, `button-clicks.json`) używają
**generycznych selektorów** (`button`, `a.btn`, `[role='button']`, itp.),
bo nie mam wglądu w realny DOM pokero.pl. Żeby scenariusz klikał w konkretne,
realne przyciski na stronie:

1. Nagraj prawdziwe kliknięcia narzędziem Playwright:
   ```bash
   npx playwright codegen https://pokero.pl/pl
   ```
2. Skopiuj wygenerowane selektory (np. `text=Zarejestruj się`,
   `#cta-button`, `[data-testid="..."]`) do kroków `click` w plikach JSON.
3. Dodaj kolejne pliki `.json` w `scenarios/` dla nowych scenariuszy — zostaną
   automatycznie wczytane i wylosowane wg wagi (`weight`).

## Wyniki i debugowanie

- Logi z każdej akcji (sesja, iteracja, krok, sukces/porażka) lecą na stdout.
- W razie błędu w trakcie scenariusza robiony jest zrzut ekranu do
  `results/error-sessionX-iterY-*.png` (katalog ignorowany przez git).

## Bezpieczeństwo / dobre praktyki

- Trzymaj `--sessions` na rozsądnym poziomie (kilka–kilkanaście) i używaj
  `--delayBetweenSessionsMs`, żeby nie generować efektu DoS na własnej
  infrastrukturze.
- Jeśli masz środowisko staging/testowe dla pokero.pl, testuj tam w pierwszej
  kolejności.
- Nie używaj tego bota do klikania w reklamy, sztucznego podbijania liczników
  odwiedzin ani innych celów niezgodnych z regulaminami dostawców (Google
  Ads/Analytics itp.) — to narzędzie jest wyłącznie do testów funkcjonalnych
  UI.

## Automatyzacja (opcjonalnie)

Domyślnie bota uruchamia się ręcznie (`npm start`). Jeśli chcesz uruchamiać go
cyklicznie (np. co godzinę jako synthetic monitoring), najprościej dodać krok
`npm start -- --sessions=... --iterations=...` do harmonogramu CI (np. GitHub
Actions `schedule:`) albo do zewnętrznego cron/trigger — daj znać, jeśli chcesz,
żebym to skonfigurował.
