import { type YearGroup } from "../model/progress";
import { Card } from "@/widgets/ui/Card";
import { SubjectsTable } from "./SubjectsTable";
import { CollapsibleContent } from "./CollapsibleContent";
import { BlockStateIcon } from "./BlockStateIcon";

interface Props {
  year: YearGroup;
  isOpen: boolean;
  onToggle: () => void;
}

export function YearAccordion({ year, isOpen, onToggle }: Props) {
  return (
    <Card
      header={
        <button
          onClick={onToggle}
          className="w-[calc(100%+40px)] flex items-center justify-between -m-5 p-5 hover:bg-slate-50 transition-colors rounded-t-xl"
        >
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <span className="flex-shrink-0">
              <BlockStateIcon type="year" subjects={year.subjects} />
            </span>
            <div className="min-w-0 text-left">
              <h4 className="min-w-0 truncate font-body-md font-bold text-on-surface">{year.year}° Año</h4>
            </div>
          </div>
          <span
            className="flex-shrink-0 material-symbols-outlined transition-transform duration-300"
            style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            expand_more
          </span>
        </button>
      }
      bodyClassName="px-0 py-0 overflow-visible"
    >
      <CollapsibleContent isOpen={isOpen}>
        <SubjectsTable subjects={year.subjects} hasThead={year.hasThead} />
      </CollapsibleContent>
    </Card>
  );
}
