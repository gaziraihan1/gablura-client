import { Filter, ArrowUpDown, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { FilterDropdown } from "@/components/shared/FilterDropdown";
import { KanbanSort, KanbanFilters } from "@/hooks/useKanbanPage";

interface ControlBarActionsProps {
  showFilters: boolean;
  activeFilterCount: number;
  filters: KanbanFilters;
  sort: KanbanSort;
  enforceWIP: boolean;
  onToggleFilters: () => void;
  onSortChange: (sort: KanbanSort) => void;
  onToggleBlockedOnly: () => void;
  onToggleStaleOnly: () => void;
  onEnforceWIPChange: (enabled: boolean) => void;
}

export function ControlBarActions({
  showFilters,
  activeFilterCount,
  filters,
  sort,
  enforceWIP,
  onToggleFilters,
  onSortChange,
  onToggleBlockedOnly,
  onToggleStaleOnly,
  onEnforceWIPChange,
}: ControlBarActionsProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
      {/* Filters Button */}
      <Button
        variant="primary"
        onClick={onToggleFilters}
        className={cn(
          "flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors",
          showFilters || activeFilterCount > 0
            ? "bg-primary text-primary-foreground"
            : "bg-primary text-muted dark:text-foreground hover:bg-primary/90"
        )}
      >
        <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="bg-primary-foreground text-primary rounded-full px-1.5 text-xs font-bold">
            {activeFilterCount}
          </span>
        )}
      </Button>

      {/* Sort Dropdown — click-to-open (touch friendly, viewport clamped) */}
      <FilterDropdown
        label="Sort"
        value={sort.charAt(0).toUpperCase() + sort.slice(1)}
        icon={<ArrowUpDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
      >
        {(close) => (
          <>
            {(["priority", "aging", "recent", "comments"] as const).map((s) => (
              <Button
                key={s}
                variant="ghost"
                onClick={() => {
                  onSortChange(s);
                  close();
                }}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors capitalize",
                  sort === s && "bg-accent font-medium"
                )}
              >
                {s}
              </Button>
            ))}
          </>
        )}
      </FilterDropdown>

      {/* Blocked Only Button */}
      <Button
        variant="primary"
        onClick={onToggleBlockedOnly}
        className={cn(
          "flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors",
          filters.blockedOnly
            ? "bg-foreground/90 text-muted"
            : "bg-foreground/50 dark:bg-muted/80 dark:text-muted-foreground hover:bg-foreground/80 dark:hover:bg-accent/50"
        )}
      >
        <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">Blocked only</span>
      </Button>

      {/* Stale Tasks Button */}
      <Button
        variant="primary"
        onClick={onToggleStaleOnly}
        className={cn(
          "flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors",
          filters.staleOnly
            ? "bg-amber-500 text-white"
            : "bg-foreground/50 dark:bg-muted/80 dark:text-muted-foreground hover:bg-foreground/80 dark:hover:bg-accent/50"
        )}
      >
        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">Stale tasks</span>
      </Button>

      {/* WIP Limits Toggle */}
      <div className="ml-auto flex items-center gap-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enforceWIP}
            onChange={(e) => onEnforceWIPChange(e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <span className="text-xs sm:text-sm text-muted-foreground hidden md:inline">
            Enforce WIP limits
          </span>
          <span className="text-xs sm:text-sm text-muted-foreground md:hidden">
            WIP
          </span>
        </label>
      </div>
    </div>
  );
}
