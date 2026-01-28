Frontend - Astro z React dla komponentów interaktywnych:
- Astro 5 pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript
- React 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI

Backend - Supabase jako kompleksowe rozwiązanie backendowe:
- Zapewnia bazę danych PostgreSQL
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autentykację użytkowników

Testowanie:
- Vitest - framework do testów jednostkowych i integracyjnych z natywnym wsparciem ESM
- @testing-library/react - narzędzia do testowania komponentów React z perspektywy użytkownika
- @testing-library/user-event - symulacja interakcji użytkownika w testach
- happy-dom - szybkie środowisko DOM dla testów jednostkowych (alternatywa dla jsdom)
- Playwright - framework do testów end-to-end z obsługą wielu przeglądarek (Chrome, Firefox, Safari, Edge)
- MSW (Mock Service Worker) - mockowanie API endpoints w testach jednostkowych i integracyjnych
- @axe-core/playwright i vitest-axe - automatyczne testy dostępności (zgodność WCAG)
- Lighthouse CI - testy wydajnościowe i monitorowanie Core Web Vitals (LCP, FID, CLS)
- k6 - testy obciążeniowe API

CI/CD i Hosting:
- Github Actions do tworzenia pipeline'ów CI/CD
- DigitalOcean do hostowania aplikacji za pośrednictwem obrazu docker