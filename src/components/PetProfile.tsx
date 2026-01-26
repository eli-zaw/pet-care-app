import { PetHeader } from "@/components/PetHeader";
import { CareHistoryList } from "@/components/CareHistoryList";
import { usePetProfile } from "@/lib/hooks/usePetProfile";

interface PetProfileProps {
  petId: string;
}

export function PetProfile({ petId }: PetProfileProps) {
  const {
    pet,
    entries,
    pagination,
    isLoading,
    isEmpty,
    expandedEntryIds,
    loadMoreEntries,
    goToPage,
    deletePet,
    deleteEntry,
    toggleExpandEntry,
  } = usePetProfile(petId);

  return (
    <div className="space-y-8">
      {/* Pet Header */}
      {pet && <PetHeader pet={pet} onDelete={deletePet} />}

      {/* Care History List */}
      <CareHistoryList
        petId={petId}
        items={entries}
        isLoading={isLoading}
        isEmpty={isEmpty}
        pagination={pagination}
        expandedEntryIds={expandedEntryIds}
        onGoToPage={goToPage}
        onLoadMore={loadMoreEntries}
        onDeleteEntry={deleteEntry}
        onToggleExpand={toggleExpandEntry}
      />
    </div>
  );
}
