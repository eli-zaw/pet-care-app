-- migration: create database views
-- purpose: provide frontend-friendly data with translations, emojis, and aggregations
-- affects: new views v_pets_summary and v_care_history
-- dependencies: pets table, care_entries table
-- note: views inherit rls policies from underlying tables

-- create v_pets_summary view
-- purpose: dashboard view of pets with entry counts and display formatting
-- includes: species emoji, polish translations, and active entry counts
-- sorting: alphabetical by name (case-insensitive)
create view v_pets_summary as
select 
  p.id,
  p.animal_code,
  p.name,
  p.species,
  case 
    when p.species = 'dog' then '🐕'
    when p.species = 'cat' then '🐱'
    else '🐾'
  end as species_emoji,
  case 
    when p.species = 'dog' then 'Pies'
    when p.species = 'cat' then 'Kot'
    else 'Inne'
  end as species_display,
  count(ce.id) filter (where ce.is_deleted = false) as entries_count,
  p.created_at,
  p.updated_at
from pets p
left join care_entries ce on ce.pet_id = p.id and ce.is_deleted = false
where p.is_deleted = false
group by p.id, p.animal_code, p.name, p.species, p.created_at, p.updated_at
order by lower(p.name) asc;

-- create v_care_history view
-- purpose: care entry history with formatted dates and category translations
-- includes: category emoji, polish translations, note previews with truncation
-- sorting: reverse chronological (newest first)
create view v_care_history as
select 
  ce.id,
  ce.pet_id,
  ce.category,
  case 
    when ce.category = 'vet_visit' then '🏥'
    when ce.category = 'medication' then '💊'
    when ce.category = 'grooming' then '✂️'
    when ce.category = 'food' then '🍖'
    when ce.category = 'health_event' then '🩹'
    when ce.category = 'note' then '📝'
  end as category_emoji,
  case 
    when ce.category = 'vet_visit' then 'Wizyta u weterynarza'
    when ce.category = 'medication' then 'Leki i suplementy'
    when ce.category = 'grooming' then 'Groomer/fryzjer'
    when ce.category = 'food' then 'Karma'
    when ce.category = 'health_event' then 'Zdarzenie zdrowotne'
    when ce.category = 'note' then 'Notatka'
  end as category_display,
  ce.entry_date,
  to_char(ce.entry_date, 'DD.MM.YYYY') as entry_date_formatted,
  ce.note,
  case 
    when ce.note is null or length(ce.note) <= 100 then ce.note
    else left(ce.note, 100) || '...'
  end as note_preview,
  length(ce.note) > 100 as has_more,
  ce.created_at,
  ce.updated_at
from care_entries ce
where ce.is_deleted = false
order by ce.entry_date desc, ce.created_at desc;
