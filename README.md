# Sjekkliste App for Furuseth Solpark

En mobilvennlig web-applikasjon for å utføre og dokumentere inspeksjoner av solcelleanlegg.

## Funksjoner

- Opprett nye sjekklister for ulike områder
- Registrer status for hvert sjekkpunkt (OK/Avvik/Anbefalt tiltak)
- Ta bilder av avvik
- Registrer koordinater for hvert sjekkpunkt
- Lagre data lokalt på enheten
- Generer og send rapporter via e-post

## Tekniske Krav

- Node.js 18 eller nyere
- Moderne nettleser med støtte for:
  - Geolokasjon
  - Kamera API
  - LocalStorage
  - Service Workers (for offline funksjonalitet)

## Installasjon

1. Klon repositoriet:
   ```bash
   git clone [repository-url]
   cd sjekklisteapp
   ```

2. Installer avhengigheter:
   ```bash
   npm install
   ```

3. Start utviklingsserveren:
   ```bash
   npm run dev
   ```

4. Åpne applikasjonen i nettleseren:
   ```
   http://localhost:5173
   ```

## Bygging for Produksjon

For å bygge applikasjonen for produksjon:

```bash
npm run build
```

De bygde filene vil bli plassert i `dist`-mappen.

## Bruk

1. Start en ny sjekkliste ved å klikke på "+" knappen på hjemmesiden
2. Fyll inn grunnleggende informasjon om inspeksjonen
3. Gå gjennom sjekklisten punkt for punkt
4. For hvert punkt:
   - Velg status (OK/Avvik/Anbefalt tiltak)
   - Legg til notater ved behov
   - Ta bilder av avvik
   - Registrer koordinater
5. Når sjekklisten er fullført, kan du sende rapporten via e-post

## Offline Funksjonalitet

Applikasjonen fungerer offline og lagrer all data lokalt på enheten. Når internettilkobling er tilgjengelig, kan rapporter sendes via e-post.

## Sikkerhet

- All data lagres lokalt på enheten
- E-post sending krever autentisering via Gmail API
- Geolokasjon og kamera-tilgang krever brukerens tillatelse

## Utvikling

### Prosjektstruktur

```
src/
  ├── components/     # Gjenbrukbare komponenter
  ├── pages/         # Hovedsider
  ├── services/      # Tjenester for API-kall og datahåndtering
  ├── types/         # TypeScript definisjoner
  ├── utils/         # Hjelpefunksjoner
  └── App.tsx        # Hovedkomponent
```

### Teknologier

- React
- TypeScript
- Material-UI
- React Router
- React Query
- Gmail API (for e-post sending)

## Lisens

Dette prosjektet er proprietært og tilhører Solcellespesialisten AS.

## Kontakt

For spørsmål eller support, kontakt:
- E-post: carl@solcellespesialisten.no
