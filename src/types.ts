import type { Enums, Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// Base database entity types
export type ProfileRow = Tables<"profiles">;
export type PetRow = Tables<"pets">;
export type PetOwnerRow = Tables<"pet_owners">;
export type CareEntryRow = Tables<"care_entries">;
export type PetsSummaryRow = Tables<"v_pets_summary">;
export type CareHistoryRow = Tables<"v_care_history">;

// Enum helpers
export type SpeciesType = Enums<"species_type">;
export type CareCategoryType = Enums<"care_category_type">;

// Generic helpers
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginationDto {
  page: number;
  limit: number;
  total: number;
}

export interface PaginatedResponse<TItem> {
  items: TItem[];
  pagination: PaginationDto;
}

// Utility to mark specific view fields as non-null for API DTOs.
export type NonNullableFields<T, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: NonNullable<T[P]>;
};

// DTOs - Profiles
export type ProfileDto = ProfileRow;

// Reserved for future profile fields; keep linked to DB row via Partial<Pick<ProfileRow, ...>>
export type UpdateProfileCommand = Partial<Pick<ProfileRow, "email">> & {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
};

// DTOs - Pets
export type PetDto = Omit<PetRow, "is_deleted" | "deleted_at">;

export type PetSummaryDto = NonNullableFields<
  PetsSummaryRow,
  | "id"
  | "animal_code"
  | "name"
  | "species"
  | "species_display"
  | "species_emoji"
  | "entries_count"
  | "created_at"
  | "updated_at"
>;

export type CreatePetCommand = Pick<TablesInsert<"pets">, "name" | "species">;

export type CreatePetResponseDto = Pick<PetDto, "id" | "animal_code" | "name" | "species" | "created_at">;

export type GetPetResponseDto = PetDto & {
  species_display: string;
  species_emoji: string;
};

export type PetsListQuery = PaginationQuery & {
  include?: "summary";
};

export type PetsListResponseDto = PaginatedResponse<PetSummaryDto>;

// DTOs - Care entries
export type CareEntryDto = Omit<CareEntryRow, "is_deleted" | "deleted_at">;

export type CareHistoryDto = NonNullableFields<
  CareHistoryRow,
  | "id"
  | "pet_id"
  | "category"
  | "category_display"
  | "category_emoji"
  | "entry_date"
  | "entry_date_formatted"
  | "created_at"
  | "updated_at"
>;

export type CreateCareEntryCommand = Pick<TablesInsert<"care_entries">, "category" | "entry_date" | "note">;

export type CreateCareEntryResponseDto = Pick<
  CareEntryDto,
  "id" | "pet_id" | "category" | "entry_date" | "note" | "created_at"
> & {
  category_display: string;
  category_emoji: string;
};

export type CareEntriesListQuery = PaginationQuery & {
  category?: CareCategoryType;
  order?: "asc" | "desc";
};

export type CareEntriesListResponseDto = PaginatedResponse<CareHistoryDto>;

// DTOs - Ownership
export type PetOwnerDto = PetOwnerRow;

export type PetOwnersListQuery = PaginationQuery;

export type PetOwnersListResponseDto = PaginatedResponse<PetOwnerDto>;

// Update types reserved for future use
export type UpdatePetCommand = Partial<Pick<TablesUpdate<"pets">, "name" | "species">>;
export type UpdateCareEntryCommand = Partial<Pick<TablesUpdate<"care_entries">, "category" | "entry_date" | "note">>;

export type UpdateCareEntryResponseDto = Pick<
  CareEntryDto,
  "id" | "pet_id" | "category" | "entry_date" | "note" | "created_at" | "updated_at"
> & {
  category_display: string;
  category_emoji: string;
};

// ViewModels for Dashboard
export interface PetCardViewModel {
  id: string;
  name: string;
  speciesEmoji: string;
  entriesCount: number;
  entriesLabel: string;
  href: string;
}

export interface PaginationViewModel {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export interface PetsHeaderViewModel {
  title: string;
  countLabel: string;
}

export interface EmptyStateViewModel {
  title: string;
  description: string;
  ctaLabel: string;
}

export interface DashboardViewModel {
  pets: PetCardViewModel[];
  pagination: PaginationViewModel;
  header: PetsHeaderViewModel;
  emptyState: EmptyStateViewModel;
}

export interface PetsListState {
  isLoading: boolean;
  isEmpty: boolean;
  items: PetCardViewModel[];
}

// ViewModels for PetForm (Add Pet View)
export interface PetFormViewModel {
  name: string;
  species: SpeciesType | "";
}

export interface PetFormErrors {
  name?: string;
  species?: string;
  general?: string;
}

export interface SpeciesOption {
  value: SpeciesType;
  label: string;
  emoji: string;
}

// ViewModels for Pet Profile (Pet Show View)
export interface PetHeaderViewModel {
  id: string;
  name: string;
  speciesEmoji: string;
  speciesDisplay: string;
  entriesCount: number;
  lastEntryDate: Date | null;
}

export interface CareStatusViewModel {
  status: "current" | "attention" | "outdated";
  emoji: string;
  label: string;
  tooltipText: string;
  lastEntryDate: Date | null;
}

export interface CareEntryCardViewModel {
  id: string;
  categoryEmoji: string;
  categoryDisplay: string;
  dateFormatted: string;
  notePreview: string;
  noteFull: string | null;
  hasMore: boolean;
}

export interface CareHistoryListState {
  isLoading: boolean;
  isEmpty: boolean;
  items: CareEntryCardViewModel[];
}

export interface PetProfileViewModel {
  header: PetHeaderViewModel;
  history: CareHistoryListState;
  pagination: PaginationViewModel;
}

// ViewModels for Care Entry Form (Add Care Entry View)
export interface CareEntryFormViewModel {
  category: CareCategoryType | null;
  entryDate: Date;
  note: string;
}

export interface CareEntryFormErrors {
  category?: string;
  entryDate?: string;
  note?: string;
  general?: string;
}

export interface CareCategoryOption {
  value: CareCategoryType;
  label: string;
  emoji: string;
}
