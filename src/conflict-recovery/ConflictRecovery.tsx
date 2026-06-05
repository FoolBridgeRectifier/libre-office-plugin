import { CONFLICT_RECOVERY_CHOICES } from './constants';
import { getConflictRecoveryButtonClassName } from './helpers';
import type { ConflictRecoveryPanelProps } from './interfaces';

export function ConflictRecoveryPanel({
  isResolvingConflict = false,
  onResolveConflict,
}: ConflictRecoveryPanelProps) {
  const panelClassName =
    'flex flex-wrap items-center justify-between gap-3 border-b border-ribbon-border bg-ribbon-bg pb-4 font-sans';
  const statusClassName = 'text-[12px] font-medium text-text-primary';
  const choicesClassName = 'flex flex-wrap gap-2';

  return (
    <section aria-label="Conflict recovery" className={panelClassName}>
      <span className={statusClassName}>Conflict detected</span>

      <div className={choicesClassName}>
        {CONFLICT_RECOVERY_CHOICES.map((choiceDefinition) => {
          const buttonClassName = getConflictRecoveryButtonClassName(isResolvingConflict);
          const handleChoiceClick = () => onResolveConflict(choiceDefinition.choice);

          return (
            <button
              className={buttonClassName}
              disabled={isResolvingConflict}
              key={choiceDefinition.choice}
              onClick={handleChoiceClick}
              type="button"
            >
              {choiceDefinition.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
