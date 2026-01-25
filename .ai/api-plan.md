# REST API Plan

## 1. Zasoby
- `profiles` -> `public.profiles` (read-only for self; update limited)
- `pets` -> `public.pets` (create, read, update, list, soft delete)
- `pet_owners` -> `public.pet_owners` (read-only for ownership)
- `care_entries` -> `public.care_entries` (create, read, update, list, soft delete)
- `pets_summary` -> `public.v_pets_summary` (read-only list for dashboard)
- `care_history` -> `public.v_care_history` (read-only list for pet profile)
- `auth` -> Supabase Auth (register, login, logout, session)

## 2. Endpoints

### Profiles
**PATCH** `/api/profiles/me`  
Update self profile (future fields only).
- Body (future-ready, optional):
```json
{ "first_name": "Anna", "last_name": "Nowak", "avatar_url": "https://..." }
```
- Response 200:
```json
{ "id": "uuid", "email": "user@example.com", "updated_at": "iso" }
```
- Errors: 400 invalid input, 401 not authenticated, 403 forbidden.

### Pets (core)
**GET** `/api/pets`  
List pets for current user (dashboard).
- Query:
  - `page` (default 1)
  - `limit` (default 20, max 100)
  - `include` = `summary` (default true, uses view)
- Response 200:
```json
{
  "items": [
    {
      "id": "uuid",
      "animal_code": "AB12CD34",
      "name": "Luna",
      "species": "cat",
      "species_display": "Kot",
      "species_emoji": "🐱",
      "entries_count": 5,
      "created_at": "iso",
      "updated_at": "iso"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42
  }
}
```
- Errors: 401 not authenticated.

**POST** `/api/pets`  
Create a pet (auto-assign owner).
- Body:
```json
{ "name": "Luna", "species": "cat" }
```
- Response 201:
```json
{ "id": "uuid", "animal_code": "AB12CD34", "name": "Luna", "species": "cat", "created_at": "iso" }
```
- Errors: 400 validation failed, 401 not authenticated, 409 name already used (active), 500 unknown.

**GET** `/api/pets/:petId`  
Get pet basic data (non-deleted).
- Response 200:
```json
{ "id": "uuid", "animal_code": "AB12CD34", "name": "Luna", "species": "cat", "species_display": "Kot", "species_emoji": "🐱", "created_at": "iso", "updated_at": "iso" }
```
- Errors: 401 not authenticated, 404 not found.

**PATCH** `/api/pets/:petId`  
Update pet data (name only; species is immutable after creation).
- Body (all fields optional):
```json
{ "name": "Luna Updated" }
```
- Response 200:
```json
{ "id": "uuid", "animal_code": "AB12CD34", "name": "Luna Updated", "species": "cat", "species_display": "Kot", "species_emoji": "🐱", "created_at": "iso", "updated_at": "iso" }
```
- Errors: 400 validation failed, 401 not authenticated, 403 forbidden, 404 not found, 409 name already used (active).

**DELETE** `/api/pets/:petId`  
Soft delete pet (cascade soft delete care entries).
- Response 204 (no body)
- Errors: 401 not authenticated, 403 forbidden, 404 not found.

### Care Entries
**GET** `/api/pets/:petId/care-entries`  
List care entries for pet (history).
- Query:
  - `page` (default 1)
  - `limit` (default 20, max 100)
  - `category` (optional)
  - `order` (default `desc`, by `entry_date,created_at`)
- Response 200:
```json
{
  "items": [
    {
      "id": "uuid",
      "pet_id": "uuid",
      "category": "vet_visit",
      "category_display": "Wizyta u weterynarza",
      "category_emoji": "🏥",
      "entry_date": "2026-01-24",
      "entry_date_formatted": "24.01.2026",
      "note": "Full note",
      "note_preview": "Full note",
      "has_more": false,
      "created_at": "iso",
      "updated_at": "iso"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 120
  }
}
```
- Errors: 401 not authenticated, 403 forbidden, 404 pet not found.

**POST** `/api/pets/:petId/care-entries`  
Create care entry for pet.
- Body:
```json
{ "category": "food", "entry_date": "2026-01-24", "note": "Optional note" }
```
- Response 201:
```json
{ "id": "uuid", "pet_id": "uuid", "category": "food", "entry_date": "2026-01-24", "note": "Optional note", "created_at": "iso" }
```
- Errors: 400 validation failed, 401 not authenticated, 403 forbidden, 404 pet not found.

**PATCH** `/api/pets/:petId/care-entries/:entryId`  
Update care entry (all fields editable).
- Body (all fields optional):
```json
{ "category": "vet_visit", "entry_date": "2026-01-25", "note": "Updated note" }
```
- Response 200:
```json
{ "id": "uuid", "pet_id": "uuid", "category": "vet_visit", "entry_date": "2026-01-25", "note": "Updated note", "created_at": "iso", "updated_at": "iso" }
```
- Errors: 400 validation failed, 401 not authenticated, 403 forbidden, 404 not found (pet or entry).

**DELETE** `/api/pets/:petId/care-entries/:entryId`  
Soft delete care entry.
- Response 204 (no body)
- Errors: 401 not authenticated, 403 forbidden, 404 not found.

### Ownership (read-only)
**GET** `/api/pet-owners`  
List pet ownerships for user (debug/admin only).
- Query:
  - `page` (default 1)
  - `limit` (default 50, max 200)
- Response 200:
```json
{
  "items": [
    { "id": "uuid", "pet_id": "uuid", "user_id": "uuid", "role": "owner", "created_at": "iso" }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 10
  }
}
```
- Errors: 401 not authenticated.

## 3. Uwierzytelnianie i autoryzacja
- Supabase Auth with email + password; session tokens stored in cookies or returned in JSON for client storage.
- All `/api/*` routes require authenticated user except `/api/auth/*` endpoints.
- Use Supabase RLS for authorization; API uses `context.locals.supabase` with user session.
- Ownership enforced by RLS (`pet_owners` relationship) for pets and care entries.
- Rate limiting: per-IP and per-user (e.g., 60 req/min), stricter for auth endpoints (e.g., 10 req/min).

## 4. Walidacja i logika biznesowa

### Validation rules
- `pets.name`: trimmed length 1–50 (DB CHECK).
- `pets.species`: enum `dog | cat | other`.
- `care_entries.category`: enum `vet_visit | medication | grooming | food | health_event | note`.
- `care_entries.entry_date`: required date (past/future allowed).
- `care_entries.note`: optional, max 1000 chars.
- `profiles.email`: required, unique (managed by Supabase Auth).

### Business logic mapping
- **Dashboard list** uses `v_pets_summary` to return emoji, display names, and entry counts.
- **Pet profile history** uses `v_care_history` for formatted dates, previews, and emojis.
- **Create pet** triggers:
  - auto-generate `animal_code`
  - auto-assign owner in `pet_owners`
  - trim name and set timestamps
- **Update pet**:
  - allows editing `name` only (trimmed, validated)
  - `species` is immutable after creation (business decision)
  - `animal_code` is immutable (unique identifier)
  - auto-updates `updated_at` timestamp
  - validates name uniqueness among user's active pets
- **Delete pet** performs soft delete and cascades soft delete to related care entries.
- **Create care entry** auto-sets timestamps; order of history is by `entry_date` then `created_at`.
- **Update care entry**:
  - allows editing `category`, `entry_date`, and `note`
  - `pet_id` is immutable (cannot move entry to different pet)
  - auto-updates `updated_at` timestamp
  - validates all fields according to validation rules.

### Assumptions
- Deletions are **soft deletes** to align with the schema and triggers, even though PRD mentions hard delete.
- Future profile fields (e.g., `first_name`) are optional and not part of MVP, but endpoint is reserved.
- **Pet species** is immutable after creation to maintain data integrity and avoid confusion with historical care entries.
- **Pet animal_code** is immutable as it serves as a unique, stable identifier.
- **Care entry pet_id** is immutable to prevent accidental data corruption (moving entries between pets).

