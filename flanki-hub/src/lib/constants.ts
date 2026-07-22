import type { FacultyChoice, UniversityChoice } from './types'

// University display labels. PRZ / URZ reveal a faculty dropdown; "Other" does not.
export const UNIVERSITIES: {
  value: UniversityChoice
  label: string
  hasFaculties: boolean
}[] = [
  { value: 'PRZ', label: 'Politechnika Rzeszowska', hasFaculties: true },
  { value: 'URZ', label: 'Uniwersytet Rzeszowski', hasFaculties: true },
  { value: 'Other', label: 'Inna uczelnia', hasFaculties: false },
]

export const UNIVERSITY_LABELS: Record<UniversityChoice, string> = {
  PRZ: 'Politechnika Rzeszowska',
  URZ: 'Uniwersytet Rzeszowski',
  Other: 'Inna uczelnia',
}

export const FACULTIES: { value: FacultyChoice; label: string }[] = [
  { value: 'WEII', label: 'Wydział Elektrotechniki i Informatyki' },
  { value: 'WC', label: 'Wydział Chemiczny' },
  { value: 'WZ', label: 'Wydział Zarządzania' },
  { value: 'WMiFS', label: 'Wydział Matematyki i Fizyki Stosowanej' },
  { value: 'WBMiL', label: 'Wydział Budowy Maszyn i Lotnictwa' },
  {
    value: 'WBIŚiA',
    label: 'Wydział Budownictwa, Inżynierii Środowiska i Architektury',
  },
  { value: 'WMT', label: 'Wydział Mechaniczno-Technologiczny' },
]

export const FACULTY_LABELS: Record<FacultyChoice, string> = FACULTIES.reduce(
  (acc, f) => {
    acc[f.value] = f.label
    return acc
  },
  {} as Record<FacultyChoice, string>,
)

// Polish cities for the manual location picker.
export const POLISH_CITIES: string[] = [
  'Rzeszów',
  'Warszawa',
  'Kraków',
  'Wrocław',
  'Poznań',
  'Gdańsk',
  'Łódź',
  'Katowice',
  'Lublin',
  'Szczecin',
  'Bydgoszcz',
  'Białystok',
  'Kielce',
  'Toruń',
  'Olsztyn',
  'Zielona Góra',
  'Opole',
  'Częstochowa',
  'Radom',
  'Sosnowiec',
]
