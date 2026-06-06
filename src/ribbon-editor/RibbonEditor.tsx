import { useState } from 'react';

import { ConflictRecoveryPanel } from '../conflict-recovery/ConflictRecovery';
import { HtmlEditor } from '../html-editor/HtmlEditor';
import { createSkippedMobileRuntimeSetupState } from '../office-runtime/helpers/setup-state/setupState';
import { DEFAULT_RIBBON_TAB_ID, RIBBON_TABS } from './constants';
import { DesktopSourceLoader } from './helpers/desktop-source-loader/DesktopSourceLoader';
import { StatusFooter } from './helpers/status-footer/StatusFooter';
import { RibbonTabBar } from './helpers/tab-bar/TabBar';
import {
  findRibbonTab,
  getAutosaveStatusText,
  getCommandButtonClassName,
  getCommandIcon,
  getLinkWarningStatusText,
} from './helpers';
import type { RibbonEditorProps } from './interfaces';

export function RibbonEditor({
  activeFilePath = null,
  autosaveStatus = 'saved',
  desktopSourceStatus = 'idle',
  importedHtmlSource = null,
  isResolvingConflict = false,
  linkWarningCount = 0,
  officeRuntimeSetupState = createSkippedMobileRuntimeSetupState(),
  showHtmlEmptyState = activeFilePath === null,
  onEditorBlur,
  onHtmlSourceChange,
  onResolveConflict,
}: RibbonEditorProps) {
  const [activeRibbonTabId, setActiveRibbonTabId] = useState(DEFAULT_RIBBON_TAB_ID);

  const activeRibbonTabDefinition = findRibbonTab(RIBBON_TABS, activeRibbonTabId);

  const shouldShowConflictRecovery =
    autosaveStatus === 'conflicted' && onResolveConflict !== undefined;

  const shellClassName =
    'flex h-full min-h-[480px] flex-col overflow-hidden bg-ribbon-bg font-sans text-text-primary';

  const ribbonBodyClassName =
    'flex flex-wrap gap-0 border-b border-ribbon-border bg-ribbon-bg px-2 py-2 shadow-ribbon-raised';
  const commandGroupClassName =
    'flex min-w-fit flex-col justify-between gap-1 border-r border-ribbon-border px-2 last:border-r-0';

  const commandRowsClassName = 'flex flex-wrap items-start gap-1';
  const groupLabelClassName =
    'text-center font-sans text-[9px] uppercase tracking-normal text-text-muted';

  const editorSurfaceClassName =
    'flex flex-1 flex-col gap-4 overflow-auto bg-ribbon-bg px-6 py-5 text-text-primary';

  const pageClassName =
    'relative min-h-72 rounded-ribbon-sm border border-ribbon-border bg-ribbon-bg p-6 shadow-ribbon-raised';

  const statusClassName =
    'flex flex-wrap justify-between gap-2 border-t border-ribbon-border px-4 py-2 font-sans text-[11px] text-text-muted';
  const filePathClassName = 'max-w-full truncate text-text-secondary';

  return (
    <section aria-label="Libre Note Editor" className={shellClassName}>
      <RibbonTabBar
        activeRibbonTabId={activeRibbonTabId}
        onActiveRibbonTabChange={setActiveRibbonTabId}
      />

      <div
        aria-label={`${activeRibbonTabDefinition.label} commands`}
        className={ribbonBodyClassName}
      >
        {activeRibbonTabDefinition.commandGroups.map((commandGroupDefinition) => (
          <section
            aria-label={commandGroupDefinition.label}
            className={commandGroupClassName}
            key={commandGroupDefinition.id}
          >
            <div className={commandRowsClassName}>
              {commandGroupDefinition.commands.map((commandDefinition) => {
                const CommandIcon = getCommandIcon(commandDefinition.iconName);
                const commandButtonClassName = getCommandButtonClassName(
                  commandDefinition.disabled === true
                );

                return (
                  <button
                    aria-label={commandDefinition.description}
                    className={commandButtonClassName}
                    disabled={commandDefinition.disabled}
                    key={commandDefinition.id}
                    type="button"
                  >
                    <CommandIcon aria-hidden="true" className="size-5 text-icon-default" />
                    <span>{commandDefinition.label}</span>
                    {commandDefinition.future === true ? <span>Soon</span> : null}
                  </button>
                );
              })}
            </div>

            <span className={groupLabelClassName}>{commandGroupDefinition.label}</span>
          </section>
        ))}
      </div>

      <main className={editorSurfaceClassName}>
        {shouldShowConflictRecovery ? (
          <ConflictRecoveryPanel
            isResolvingConflict={isResolvingConflict}
            onResolveConflict={onResolveConflict}
          />
        ) : null}

        <article aria-label="Editor surface" className={pageClassName}>
          <DesktopSourceLoader status={desktopSourceStatus} />

          <HtmlEditor
            htmlSource={importedHtmlSource}
            showEmptyState={showHtmlEmptyState}
            {...(onEditorBlur ? { onEditorBlur } : {})}
            {...(onHtmlSourceChange ? { onHtmlSourceChange } : {})}
          />
        </article>
      </main>

      <StatusFooter
        activeFilePath={activeFilePath}
        filePathClassName={filePathClassName}
        htmlSourceStatusText={getAutosaveStatusText(autosaveStatus)}
        linkWarningStatusText={getLinkWarningStatusText(linkWarningCount)}
        officeRuntimeSetupState={officeRuntimeSetupState}
        statusClassName={statusClassName}
      />
    </section>
  );
}
