# Dokument wymagań produktu (PRD) - Paw Notes MVP

Wersja: 1.0 MVP Lean
Data: 21 stycznia 2026
Status: Zatwierdzony do implementacji
Autor: Product Manager

---

## 1. Przegląd produktu

Paw Notes to scentralizowany dziennik opieki nad zwierzętami, który zastępuje rozproszone notatki i pamięć właściciela. Aplikacja umożliwia szybkie zapisywanie wszystkich istotnych zdarzeń związanych z opieką nad pupilem (wizyty weterynaryjne, leki, groomer, zdarzenia zdrowotne) i łatwy dostęp do pełnej historii w jednym miejscu.
Właściciele zwierząt domowych (psów, kotów i innych), szczególnie tych wymagających regularnej opieki medycznej, przyjmowania leków i częstych wizyt u specjalistów (weterynarze, groomerzy).

## 2. Problem użytkownika

Właściciele zwierząt domowych, szczególnie tych wymagających regularnej opieki medycznej, napotykają na następujące trudności:

1. Rozproszenie informacji: Dane o opiece są zapisywane w różnych miejscach (notatki w telefonie, kartki papieru, pamięć, zdjęcia rachunków) lub wcale nie są dokumentowane.

2. Brak dostępu podczas potrzeby: Podczas wizyty u weterynarza trudno jest przypomnieć sobie dokładne daty ostatnich szczepień, nazwy stosowanych leków czy reakcje na konkretne karmy.

3. Zapominanie o ważnych zdarzeniach: Z czasem informacje o skaleczeniach, kleszczach, zmianach karmy czy wizytach u groomera są zapominane, co utrudnia diagnozowanie wzorców zdrowotnych.

4. Czasochłonność: Skomplikowane systemy zarządzania wymagają zbyt dużo czasu na wprowadzenie pojedynczej informacji.


## 3. Wymagania funkcjonalne

### FR-001: Rejestracja użytkownika
System umożliwia rejestrację nowego użytkownika przez formularz email + hasło. Email musi być unikalny w systemie. Hasło musi mieć minimum 8 znaków. Konto jest aktywne natychmiast po rejestracji (bez weryfikacji email). Po rejestracji system automatycznie loguje użytkownika i przekierowuje do dashboardu.

### FR-002: Logowanie użytkownika
System umożliwia logowanie przez email i hasło. Sesja użytkownika jest zarządzana przez Supabase Auth. Nieprawidłowe dane logowania wyświetlają komunikat błędu. Po prawidłowym logowaniu system przekierowuje do dashboardu.

### FR-003: Wylogowanie
System umożliwia wylogowanie użytkownika. Przycisk "Wyloguj" jest dostępny w nawigacji. Po wylogowaniu system przekierowuje do landing page. Sesja użytkownika jest unieważniana.

### FR-004: Dodawanie zwierzęcia
System umożliwia dodanie nowego zwierzęcia przez formularz. Pola wymagane: imię (1-50 znaków), gatunek (dropdown: Pies, Kot, Inne). System waliduje dane przed zapisem. Po zapisie system wyświetla toast "Zwierzę zostało dodane" i przekierowuje do profilu zwierzęcia. System przypisuje zwierzę do zalogowanego użytkownika.

### FR-005: Lista zwierząt na dashboardzie
System wyświetla wszystkie zwierzęta użytkownika na dashboardzie. Każde zwierzę wyświetlane jako karta zawierająca: emoji gatunku, imię, liczba wpisów. System sortuje zwierzęta alfabetycznie po imieniu. Dashboard zawiera przycisk "Dodaj zwierzę". Kliknięcie w kartę zwierzęcia prowadzi do jego profilu.

### FR-006: Profil zwierzęcia
System wyświetla dane zwierzęcia (emoji + imię + gatunek). System wyświetla przycisk "Usuń zwierzę". System wyświetla przycisk "Dodaj wpis" (prominent). System wyświetla historię wszystkich wpisów opieki. System wyświetla licznik wpisów.

### FR-007: Usuwanie zwierzęcia
System wyświetla modal potwierdzenia: "Czy na pewno usunąć [Imię]? To usunie również wszystkie wpisy". Po potwierdzeniu system wykonuje usunięcie (wraz z wpisami przez CASCADE). System wyświetla toast "Zwierzę zostało usunięte" i przekierowuje do dashboardu.

### FR-008: Dodawanie wpisu opieki
System umożliwia dodanie wpisu przez formularz (cel: <20 sekund). Pola wymagane: kategoria (6 przycisków z emoji: Wizyta u weterynarza, Leki i suplementy, Groomer/fryzjer, Karma, Zdarzenie zdrowotne, Notatka), data (date picker, domyślnie: dziś, możliwość wyboru przeszłości i przyszłości). Pole opcjonalne: notatka (textarea, max 1000 znaków). System waliduje dane przed zapisem. Po zapisie system wyświetla toast "Wpis został dodany". Wpis pojawia się natychmiast w historii.

### FR-009: Historia wpisów zwierzęcia
System wyświetla wszystkie wpisy opieki dla danego zwierzęcia. Sortowanie: najnowsze na górze (reverse chronological). Każdy wpis wyświetla: emoji kategorii, nazwa kategorii, data, fragment notatki (pierwsze 100 znaków lub pełna jeśli krótsza). Kliknięcie w wpis: rozwinięcie pokazujące pełną notatkę. System wyświetla komunikat "Brak wpisów" dla zwierząt bez historii.

### FR-010: Usuwanie wpisu
System wyświetla przycisk "Usuń" przy każdym wpisie. System wyświetla modal potwierdzenia: "Czy na pewno usunąć ten wpis?". Po potwierdzeniu system wykonuje usunięcie. System wyświetla toast "Wpis został usunięty". Wpis znika z listy natychmiast.

### FR-011: Landing page
System wyświetla landing page dla użytkowników niezalogowanych na głównym URL. Hero section zawiera: nagłówek "Zadbaj o swojego pupila z Paw Notes", krótki opis, CTA "Rozpocznij za darmo". System przekierowuje zalogowanych użytkowników do dashboardu automatycznie.

### FR-012: Toast notifications
System wyświetla toast notifications dla operacji (sukces, błąd). Toast sukcesu (zielony): auto-hide po 3 sekundach. Toast błędu (czerwony): auto-hide po 5 sekundach. Toasty są dismissable. Pozycja: bottom-right (desktop), bottom-center (mobile). System używa Sonner/Toast z Shadcn/ui.

### FR-013: Responsywność
System stosuje mobile-first design. Breakpoint: 768px (mobile/desktop). Wszystkie widoki są w pełni funkcjonalne na wszystkich urządzeniach. Przyciski i interaktywne elementy mają minimum 44x44px touch target na mobile. System automatycznie dostosowuje layout do rozmiaru ekranu.

### FR-014: Error handling
System wyświetla przyjazne komunikaty błędów dla użytkownika poprzez toast notifications. System loguje szczegółowe błędy do konsoli (development). System zapobiega wyświetlaniu technicznych detali błędów użytkownikowi końcowemu.

### FR-015: Edycja zwierzęcia
System umożliwia edycję danych zwierzęcia. Edytowalny jest tylko imię zwierzęcia (1-50 znaków). Gatunek jest niemutowalny po utworzeniu. System waliduje dane przed zapisem. Po zapisie system wyświetla toast "Zmiany zostały zapisane". Przycisk/link "Edytuj" jest dostępny w profilu zwierzęcia.

### FR-016: Edycja wpisu opieki
System umożliwia edycję wpisu opieki. Edytowalne pola: kategoria, data, notatka (te same zasady walidacji jak przy tworzeniu). System waliduje dane przed zapisem. Po zapisie system wyświetla toast "Wpis został zaktualizowany". Wpis pojawia się w odpowiednim miejscu chronologicznym po zmianie daty. Przycisk/link "Edytuj" jest dostępny przy każdym wpisie.

### FR-017: Status opieki zwierzęcia
System oblicza i wyświetla status opieki zwierzęcia na podstawie daty ostatniego wpisu w profilu zwierzęcia. Status prezentowany jako wskaźnik aktualności opieki z emoji: 🟢 (≤30 dni), 🟡 (31-90 dni), 🔴 (>90 dni lub brak wpisów). Status aktualizuje się automatycznie po dodaniu lub usunięciu wpisu. System wyświetla tooltip z informacją o dacie ostatniego wpisu przy najechaniu na status (desktop) lub przy kliknięciu (mobile).

### FR-018: Resetowanie hasła
System umożliwia użytkownikowi zresetowanie zapomnianego hasła przez email. Użytkownik wprowadza email w formularzu resetowania. System wysyła email z linkiem resetującym (ważny 1 godzinę). Link prowadzi do formularza ustawienia nowego hasła. Nowe hasło musi mieć minimum 8 znaków. Po pomyślnej zmianie hasła system wyświetla toast "Hasło zostało zmienione" i przekierowuje do logowania. System używa Supabase Auth do obsługi procesu resetowania hasła.

---

## 4. Granice produktu
POZA ZAKRESEM (możliwe w przyszłych wersjach):

Autentykacja i konto:
- Email verification (weryfikacja przez link)
- Zmiana hasła w ustawieniach
- Edycja danych użytkownika (imię, nazwisko)
- Usunięcie konta
- Social login (Google, Apple)

Zwierzęta:
- Zdjęcia zwierząt (upload do Supabase Storage)
- Rozszerzone dane: rasa, waga, data urodzenia, numer chipa, notatki dodatkowe
- Avatary generowane (obecnie tylko emoji gatunku)
- Współdzielenie zwierzęcia między użytkownikami
- Limit liczby zwierząt (obecnie nielimitowane)

Wpisy:
- Dodatkowe pola: tytuł, koszt
- Filtrowanie po kategorii
- Wyszukiwanie w tytułach/notatkach
- Grupowanie po miesiącach
- Soft delete z możliwością odzyskania (30 dni)
- Sortowanie niestandardowe
- Export danych

UI/UX:
- PWA manifest i service worker
- Offline mode
- Push notifications
- Empty states z ilustracjami
- Onboarding tooltips
- Loading skeleton loaders (obecnie tylko spinners)
- Advanced error handling
- Analytics tracking

Inne:
- Przypomnienia o wizytach/lekach
- Kalendarz wydarzeń
- Statystyki i wykresy
- Multi-language support
- Dark mode

---

## 5. Historyjki użytkowników

### US-001: Rejestracja nowego konta

Jako nowy użytkownik
Chcę zarejestrować się w aplikacji używając emaila i hasła
Aby móc zacząć dokumentować opiekę nad moimi zwierzętami

Kryteria akceptacji:
- Formularz rejestracji wymaga emaila i hasła (min 8 znaków)
- System waliduje unikalność emaila
- System waliduje format emaila (musi zawierać @)
- Hasło musi mieć minimum 8 znaków
- Konto jest aktywne natychmiast po rejestracji (bez email verification)
- Po sukcesie system automatycznie loguje użytkownika
- System przekierowuje do dashboardu
- System wyświetla toast "Witaj w Paw Notes"
- W przypadku błędu (np. email już istnieje) system wyświetla toast z komunikatem
- Link "Masz już konto? Zaloguj się" prowadzi do strony logowania

---

### US-002: Logowanie do aplikacji

Jako użytkownik z kontem
Chcę zalogować się używając emaila i hasła
Aby uzyskać dostęp do moich danych

Kryteria akceptacji:
- Formularz logowania wymaga emaila i hasła
- System waliduje format emaila
- Prawidłowe dane logują użytkownika i przekierowują do dashboardu
- Nieprawidłowe dane wyświetlają toast "Nieprawidłowy email lub hasło"
- Sesja jest zarządzana przez Supabase Auth
- Po zalogowaniu system wyświetla dashboard z listą zwierząt (lub empty state)
- Link "Nie masz konta? Zarejestruj się" prowadzi do strony rejestracji
- System nie blokuje konta po nieudanych próbach (uproszczenie dla MVP)

---

### US-003: Wylogowanie

Jako zalogowany użytkownik
Chcę wylogować się z aplikacji
Aby zakończyć sesję i zabezpieczyć dostęp do mojego konta

Kryteria akceptacji:
- Przycisk "Wyloguj" jest dostępny w nawigacji (top bar)
- Kliknięcie wylogowuje użytkownika natychmiast (bez confirm)
- System przekierowuje do landing page
- Sesja użytkownika jest unieważniona
- Próba dostępu do chronionych widoków (/dashboard, /pets/*) przekierowuje do logowania

---

### US-004: Dodawanie pierwszego zwierzęcia (onboarding)

Jako nowy użytkownik po pierwszym zalogowaniu
Chcę dodać moje pierwsze zwierzę
Aby rozpocząć dokumentowanie opieki

Kryteria akceptacji:
- Dashboard wyświetla empty state "Dodaj swojego pierwszego pupila" z przyciskiem CTA
- Kliknięcie otwiera formularz dodawania zwierzęcia (modal lub osobna strona)
- Formularz wymaga: imię (1-50 znaków) i gatunek (dropdown: Pies, Kot, Inne)
- System waliduje wymagane pola przed zapisem
- Przycisk "Zapisz" jest disabled gdy dane nieprawidłowe
- Po zapisie system wyświetla toast "Zwierzę zostało dodane"
- System automatycznie przekierowuje do profilu nowo dodanego zwierzęcia
- Profil wyświetla empty state "Jeszcze nie ma wpisów. Dodaj pierwszy!"
- Dodanie zwierzęcia zajmuje maksymalnie 15 sekund
- Funkcjonalność dostępna po zalogowaniu do systemu (US-002)

---

### US-005: Przeglądanie listy moich zwierząt

Jako użytkownik z wieloma zwierzętami
Chcę zobaczyć listę wszystkich moich zwierząt na dashboardzie
Aby szybko wybrać zwierzę, które mnie interesuje

Kryteria akceptacji:
- Dashboard wyświetla wszystkie zwierzęta jako karty/listę
- Każda karta zawiera: emoji gatunku (🐕 pies, 🐱 kot, 🐾 inne), imię, liczba wpisów (np. "5 wpisów" lub "Brak wpisów")
- Zwierzęta są sortowane alfabetycznie po imieniu
- Kliknięcie w kartę prowadzi do profilu zwierzęcia
- Przycisk "Dodaj zwierzę" jest zawsze widoczny (prominent, na górze lub sticky)
- Dashboard jest responsywny (karty układają się w kolumny na desktop, lista na mobile)
- System wyświetla licznik zwierząt (np. "Masz 3 zwierzęta")
- Funkcjonalność dostępna po zalogowaniu do systemu (US-002)

---

### US-006: Usuwanie zwierzęcia

Jako użytkownik
Chcę usunąć zwierzę z aplikacji
Aby oczyścić listę (np. po śmierci zwierzęcia lub oddaniu do adopcji)

Kryteria akceptacji:
- Przycisk "Usuń zwierzę" jest dostępny w profilu zwierzęcia
- Kliknięcie wyświetla modal potwierdzenia: "Czy na pewno usunąć [Imię]? To usunie również wszystkie wpisy"
- Modal zawiera przyciski: "Anuluj" i "Usuń" (czerwony)
- Po kliknięciu "Usuń" system wykonuje hard delete zwierzęcia i wszystkich jego wpisów (CASCADE)
- System wyświetla toast "Zwierzę zostało usunięte"
- System przekierowuje do dashboardu
- Zwierzę znika z listy natychmiast
- Dane są usunięte permanentnie (brak możliwości odzyskania w MVP)
- Funkcjonalność dostępna po zalogowaniu do systemu (US-002)


---

### US-007: Szybkie dodanie wpisu

Jako użytkownik
Chcę dodać wpis w mniej niż 20 sekund
Aby szybko zapisać zdarzenie

Kryteria akceptacji:
- Przycisk "Dodaj wpis" jest prominent w profilu zwierzęcia (sticky lub na górze)
- Kliknięcie otwiera formularz dodawania wpisu (modal lub osobna strona)
- Formularz zawiera:
  - 6 przycisków kategorii z emoji: 🏥 Wizyta u weterynarza, 💊 Leki i suplementy, ✂️ Groomer/fryzjer, 🍖 Karma, 🩹 Zdarzenie zdrowotne, 📝 Notatka
  - Date picker z domyślną datą "dziś" (można wybrać przeszłość i przyszłość)
  - Textarea "Notatka (opcjonalnie)" max 1000 znaków z licznikiem
- Kategoria i data są wymagane
- Notatka jest opcjonalna
- Przycisk "Zapisz" jest aktywny gdy kategoria i data są wybrane
- Po zapisie system wyświetla toast "Wpis został dodany"
- Wpis pojawia się natychmiast w historii (na górze listy)
- Dodanie wpisu zajmuje maksymalnie 20 sekund (cel: <15s)
- Funkcjonalność dostępna po zalogowaniu do systemu (US-002)


---

### US-008: Przeglądanie historii wpisów zwierzęcia

Jako użytkownik
Chcę zobaczyć wszystkie wpisy dla mojego zwierzęcia posortowane chronologicznie
Aby prześledzić historię opieki w czasie

Kryteria akceptacji:
- Profil zwierzęcia wyświetla sekcję "Historia" z listą wszystkich wpisów
- Wpisy są sortowane od najnowszych na górze (reverse chronological)
- Każdy wpis wyświetla:
  - Emoji kategorii (🏥, 💊, ✂️, 🍖, 🩹, 📝)
  - Nazwa kategorii (np. "Wizyta u weterynarza")
  - Data (format: DD.MM.YYYY)
  - Fragment notatki (pierwsze 100 znaków) lub pełna notatka jeśli krótsza
  - Przycisk "Usuń" (ikona kosza)
- Jeśli notatka jest dłuższa niż 100 znaków: wpis jest klikalny i rozwijany (pokazuje pełną notatkę)
- Wpisy bez notatki wyświetlają tylko emoji + kategoria + data
- System wyświetla "Brak wpisów. Dodaj pierwszy!" dla zwierząt bez historii
- Lista jest scrollowalna i responsywna
- Na mobile wpisy zajmują pełną szerokość
- Funkcjonalność dostępna po zalogowaniu do systemu (US-002)

---

### US-009: Usuwanie wpisu

Jako użytkownik
Chcę usunąć błędny wpis z historii
Aby utrzymać listę aktualną

Kryteria akceptacji:
- Przycisk "Usuń" (ikona kosza) jest widoczny przy każdym wpisie
- Kliknięcie wyświetla modal potwierdzenia: "Czy na pewno usunąć ten wpis?"
- Modal zawiera przyciski: "Anuluj" i "Usuń" (czerwony)
- Po kliknięciu "Usuń" system wykonuje hard delete wpisu
- System wyświetla toast "Wpis został usunięty"
- Wpis znika z listy natychmiast
- Dane są usunięte permanentnie (brak możliwości odzyskania w MVP)
- Modal zamyka się automatycznie po usunięciu
- Funkcjonalność dostępna po zalogowaniu do systemu (US-002)

---

### US-010: Korzystanie z aplikacji na telefonie

Jako użytkownik mobilny
Chcę używać aplikacji na smartfonie
Aby dodawać wpisy na miejscu (np. u weterynarza, w sklepie z karmą)

Kryteria akceptacji:
- Wszystkie widoki są w pełni funkcjonalne na ekranach <768px
- Formularze są łatwe do wypełnienia na touchscreen
- Przyciski mają minimum 44x44px touch target
- Input fields nie powodują niepotrzebnego zoomowania strony
- Nawigacja jest łatwo dostępna (top bar z logo + wyloguj)
- Scrollowanie jest płynne i naturalne
- Nie ma poziomego scrollowania
- Karty zwierząt układają się w jedną kolumnę na mobile
- Przyciski kategorii we wpisach są wystarczająco duże do kliknięcia palcem
- Date picker działa poprawnie na touch devices
- Funkcjonalność dostępna po zalogowaniu do systemu (US-002)

---

### US-011: Przeglądanie landing page przed rejestracją

Jako potencjalny użytkownik
Chcę zobaczyć co oferuje aplikacja przed rejestracją
Aby zdecydować czy chcę się zarejestrować

Kryteria akceptacji:
- Landing page wyświetla się dla użytkowników niezalogowanych na głównym URL (/)
- Hero section zawiera:
  - Nagłówek: "Zadbaj o swojego pupila z Paw Notes"
  - Krótki opis (1-2 zdania): "Zapisuj wizyty, leki i wydarzenia. Wszystko w jednym miejscu."
  - Wyraźny CTA button: "Rozpocznij za darmo"
- Kliknięcie CTA prowadzi do strony rejestracji
- Link "Masz już konto? Zaloguj się" prowadzi do logowania
- Zalogowani użytkownicy są automatycznie przekierowywani do dashboardu (nie widzą landing page)
- Landing page jest responsywna (wygląda dobrze na mobile i desktop)
- Funkcjonalność dostępna po zalogowaniu do systemu (US-002)

---

### US-012: Dodawanie wpisu z datą w przeszłości

Jako użytkownik przypominający sobie wcześniejsze zdarzenie
Chcę dodać wpis z datą z przeszłości
Aby uzupełnić historię mojego zwierzęcia

Kryteria akceptacji:
- Date picker pozwala wybrać dowolną datę z przeszłości (bez limitu)
- System nie pokazuje ostrzeżenia dla dat przeszłych
- Wpis jest dodawany do historii w odpowiednim miejscu chronologicznym (sortowanie po dacie, nie po created_at)
- Wpis z datą z przeszłości wyświetla się poprawnie w liście (nie na końcu, ale w kolejności chronologicznej)
- Data jest wyświetlana w czytelnym formacie (DD.MM.YYYY)
- Funkcjonalność dostępna po zalogowaniu do systemu (US-002)

---

### US-013: Dodawanie wpisu bez notatki

Jako użytkownik w dużym pośpiechu
Chcę dodać wpis podając tylko kategorię i datę
Aby zapisać minimum informacji gdy nie mam czasu na szczegóły

Kryteria akceptacji:
- Pole "Notatka" jest opcjonalne (można zostawić puste)
- Przycisk "Zapisz" jest aktywny gdy tylko kategoria i data są wybrane
- Wpis bez notatki wyświetla się w historii jako: emoji + kategoria + data (bez fragmentu notatki)
- Wpis bez notatki nie ma clickable expand (nie ma czego rozwijać)
- Wpis wygląda kompletnie i nie sugeruje błędu lub braku danych
- Dodanie wpisu bez notatki zajmuje <10 sekund
- Funkcjonalność dostępna po zalogowaniu do systemu (US-002)

---

### US-014: Edycja danych zwierzęcia

Jako użytkownik
Chcę edytować imię mojego zwierzęcia
Aby poprawić literówkę lub zmienić nazwę pupila

Kryteria akceptacji:
- Przycisk/link "Edytuj" jest dostępny w profilu zwierzęcia
- Kliknięcie otwiera formularz edycji zwierzęcia (modal lub osobna strona)
- Formularz zawiera pole imię (prefillowane obecnym imieniem)
- Pole gatunek jest wyświetlane jako read-only (niemutowalne po utworzeniu)
- System waliduje wymagane pola przed zapisem (imię 1-50 znaków)
- Przycisk "Zapisz" jest disabled gdy dane nieprawidłowe
- Po zapisie system wyświetla toast "Zmiany zostały zapisane"
- System pozostaje w profilu zwierzęcia (lub wraca do niego)
- Zmienione imię jest widoczne natychmiast w profilu i na dashboardzie
- Przycisk "Anuluj" zamyka formularz bez zapisywania zmian
- Funkcjonalność dostępna po zalogowaniu do systemu (US-002)

---

### US-015: Edycja wpisu opieki

Jako użytkownik
Chcę edytować wpis w historii zwierzęcia
Aby poprawić błędy lub uzupełnić brakujące informacje

Kryteria akceptacji:
- Przycisk/link "Edytuj" jest dostępny przy każdym wpisie
- Kliknięcie otwiera formularz edycji wpisu (modal lub osobna strona)
- Formularz zawiera wszystkie pola prefillowane obecnymi danymi: kategoria, data, notatka
- Wszystkie pola są edytowalne (kategoria, data, notatka)
- System waliduje dane przed zapisem (te same zasady jak przy tworzeniu)
- Przycisk "Zapisz" jest disabled gdy dane nieprawidłowe
- Po zapisie system wyświetla toast "Wpis został zaktualizowany"
- System pozostaje w profilu zwierzęcia (lub wraca do niego)
- Jeśli zmieniono datę, wpis pojawia się w odpowiednim miejscu chronologicznym w historii
- Zmieniony wpis jest widoczny natychmiast w historii
- Przycisk "Anuluj" zamyka formularz bez zapisywania zmian
- Edycja wpisu zajmuje maksymalnie 30 sekund
- Funkcjonalność dostępna po zalogowaniu do systemu (US-002)

---

### US-016: Monitorowanie aktualności opieki nad zwierzęciem

Jako użytkownik
Chcę widzieć status aktualności opieki nad moim zwierzęciem
Aby szybko ocenić czy regularnie dokumentuję opiekę

Kryteria akceptacji:
- Status opieki wyświetlany w profilu zwierzęcia przy nagłówku (obok imienia lub licznika wpisów)
- Status prezentowany jako emoji wskaźnika z etykietą tekstową:
  - 🟢 "Aktualne" - ostatni wpis ≤30 dni temu
  - 🟡 "Wymaga uwagi" - ostatni wpis 31-90 dni temu
  - 🔴 "Nieaktualne" - ostatni wpis >90 dni temu lub brak wpisów
- Status aktualizuje się automatycznie po dodaniu nowego wpisu
- Status aktualizuje się automatycznie po usunięciu wpisu
- Zwierzę bez wpisów ma status 🔴 "Nieaktualne"
- Tooltip wyświetla datę ostatniego wpisu przy najechaniu na status (desktop) lub kliknięciu (mobile)
- Format daty w tooltip: "Ostatni wpis: DD.MM.YYYY" lub "Brak wpisów"
- Status responsywny (pełna szerokość na mobile, inline na desktop)
- Funkcjonalność dostępna po zalogowaniu do systemu (US-002)

---

### US-017: Resetowanie zapomnianego hasła

Jako użytkownik, który zapomniał hasła
Chcę móc zresetować hasło przez email
Aby odzyskać dostęp do mojego konta

Kryteria akceptacji:
- Link "Zapomniałeś hasła?" jest dostępny na stronie logowania
- Kliknięcie prowadzi do formularza resetowania hasła
- Formularz wymaga adresu email (walidacja formatu)
- Po wysłaniu system wyświetla komunikat: "Jeśli konto istnieje, wysłaliśmy link resetujący na podany adres email"
- System nie ujawnia czy email istnieje w bazie (bezpieczeństwo)
- Email zawiera link resetujący ważny przez 1 godzinę
- Kliknięcie linku prowadzi do formularza ustawienia nowego hasła
- Formularz nowego hasła wymaga: nowe hasło (min 8 znaków), potwierdzenie hasła
- System waliduje zgodność hasła i potwierdzenia
- Po sukcesie system wyświetla toast "Hasło zostało zmienione"
- System przekierowuje do strony logowania
- Wygasły lub użyty link wyświetla komunikat: "Link resetujący wygasł lub został już użyty. Wygeneruj nowy link."
- Email jest wysyłany przez Supabase Auth
- Link resetujący można użyć tylko raz
- Po zmianie hasła wszystkie aktywne sesje pozostają aktywne (uproszczenie dla MVP)
- Responsywność: formularz działa poprawnie na mobile i desktop

---

## 6. Metryki sukcesu

### 6.1 Metryka podstawowa (Must Have)

ŚREDNI CZAS DODANIA WPISU
- Definicja: Średni czas od otwarcia formularza do zapisania wpisu
- Cel: <20 sekund
- Pomiar: Ręczne testowanie z 5 użytkownikami (timing z sekundomierzem)
- Sposób: Użytkownik dodaje 3 różne wpisy, mierzymy czas każdego, liczymy średnią
- Akceptacja: Minimum 80% wpisów musi być dodanych w <20 sekund

REGISTRATION TO FIRST PET
- Definicja: Czas od zakończenia rejestracji do dodania pierwszego zwierzęcia
- Cel: <2 minuty
- Pomiar: Ręczne testowanie z użytkownikami
- Znaczenie: Mierzy jak intuicyjny jest onboarding

REGISTRATION TO FIRST ENTRY
- Definicja: Czas od zakończenia rejestracji do dodania pierwszego wpisu
- Cel: <5 minut
- Pomiar: Ręczne testowanie z użytkownikami
- Znaczenie: Mierzy jak szybko użytkownik osiąga value

MOBILE USABILITY
- Definicja: Czy wszystkie funkcje działają płynnie na mobile
- Cel: Wszystkie 19 user stories działają bez problemów na mobile
- Pomiar: Manualne testy na prawdziwym telefonie (iOS/Android)
- Znaczenie: Aplikacja musi być mobile-friendly (kluczowy use case)

---

## 7. Wdrożenie i utrzymanie

1. **Cloudflare Pages & Functions** – aplikacja budowana przez pipeline GH Actions jest wdrażana na Cloudflare, co daje globalną dystrybucję, Edge Runtime dla API i łatwe zarządzanie rollforward/rollback.
2. **Środowiska** – produkcja (`https://pet-care-app.pages.dev`) i preview (automatycznie dla PR) korzystają z tych samych repozytoriów, ale różnych zestawów zmiennych `SUPABASE_*`; każde środowisko musi wskazywać na odpowiednią instancję Supabase (RLS, klucze, migracje).
3. **Monitorowanie** – obserwacja Cloudflare Analytics + logów Edge Functions oraz alarmy przy 500/timeout. Wersje preview są używane do testów integracyjnych przed mergem do `main/master`.
4. **Konfiguracja środowiska** – przed wdrożeniem należy zsynchronizować `supabase/config.toml`, wygenerować i załadować `.env`/secrets do Cloudflare (SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_ROLE), a także upewnić się, że migracje są zrealizowane lokalnie (supabase db reset/push).
