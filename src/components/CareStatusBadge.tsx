import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CareStatusBadgeProps {
  lastEntryDate: Date | null;
}

function calculateCareStatus(lastEntryDate: Date | null): {
  status: "current" | "attention" | "outdated";
  emoji: string;
  label: string;
  tooltipText: string;
} {
  if (!lastEntryDate) {
    return {
      status: "outdated",
      emoji: "🔴",
      label: "Nieaktualne",
      tooltipText: "Brak wpisów",
    };
  }

  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - lastEntryDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff <= 30) {
    return {
      status: "current",
      emoji: "🟢",
      label: "Aktualne",
      tooltipText: `Ostatni wpis: ${format(lastEntryDate, "dd.MM.yyyy", { locale: pl })}`,
    };
  }

  if (daysDiff <= 90) {
    return {
      status: "attention",
      emoji: "🟡",
      label: "Wymaga uwagi",
      tooltipText: `Ostatni wpis: ${format(lastEntryDate, "dd.MM.yyyy", { locale: pl })}`,
    };
  }

  return {
    status: "outdated",
    emoji: "🔴",
    label: "Nieaktualne",
    tooltipText: `Ostatni wpis: ${format(lastEntryDate, "dd.MM.yyyy", { locale: pl })}`,
  };
}

export function CareStatusBadge({ lastEntryDate }: CareStatusBadgeProps) {
  const careStatus = calculateCareStatus(lastEntryDate);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border cursor-help transition-colors hover:bg-muted"
            aria-label={`Status opieki: ${careStatus.label}`}
          >
            <span className="text-lg leading-none" role="img" aria-hidden="true">
              {careStatus.emoji}
            </span>
            <span className="text-sm font-medium">{careStatus.label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{careStatus.tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
