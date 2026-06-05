import { useEffect, useState } from 'react';

import { HtmlEditor } from '../html-editor/HtmlEditor';
import { DEFAULT_RIBBON_TAB_ID, RIBBON_TABS } from './constants';
import {
  findRibbonTab,
  getAutosaveStatusText,
  getCommandButtonClassName,
  getCommandIcon,
  getLinkWarningStatusText,
  getTabButtonClassName,
} from './helpers';
import type { RibbonEditorProps } from './interfaces';

export function RibbonEditor({
  activeFilePath = null,
  autosaveStatus = 'saved',
  importedHtmlSource = null,
  linkWarningCount = 0,
  onEditorBlur,
  onHtmlSourceChange,
}: RibbonEditorProps) {
  const [activeRibbonTabId, setActiveRibbonTabId] = useState(DEFAULT_RIBBON_TAB_ID);
  const [editableHtmlSource, setEditableHtmlSource] = useState(importedHtmlSource);

  const activeRibbonTabDefinition = findRibbonTab(RIBBON_TABS, activeRibbonTabId);
  const activeFileStatusText = activeFilePath ?? 'No markdown file loaded yet.';

  const htmlSourceStatusText =
    editableHtmlSource === null ? 'No HTML source loaded' : getAutosaveStatusText(autosaveStatus);
  const linkWarningStatusText = getLinkWarningStatusText(linkWarningCount);

  useEffect(() => {
    setEditableHtmlSource(importedHtmlSource);
  }, [importedHtmlSource]);

  const handleHtmlSourceChange = (htmlSource: string) => {
    setEditableHtmlSource(htmlSource);
    onHtmlSourceChange?.(htmlSource);
  };

  const shellClassName =
    'flex h-full min-h-[480px] flex-col overflow-hidden bg-ribbon-bg font-sans text-text-primary';
  const tabBarClassName = 'flex overflow-x-auto bg-ribbon-purple shadow-ribbon-raised';

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
    'min-h-72 rounded-ribbon-sm border border-ribbon-border bg-ribbon-bg p-6 shadow-ribbon-raised';

  const statusClassName =
    'flex flex-wrap justify-between gap-2 border-t border-ribbon-border px-4 py-2 font-sans text-[11px] text-text-muted';
  const filePathClassName = 'max-w-full truncate text-text-secondary';

  return (
    <section aria-label="Libre Note Editor" className={shellClassName}>
      <nav aria-label="Ribbon tabs" className={tabBarClassName}>
        {RIBBON_TABS.map((ribbonTabDefinition) => {
          const isActiveRibbonTab = ribbonTabDefinition.id === activeRibbonTabId;
          const tabButtonClassName = getTabButtonClassName(isActiveRibbonTab);
          const handleTabClick = () => setActiveRibbonTabId(ribbonTabDefinition.id);

          return (
            <button
              aria-pressed={isActiveRibbonTab}
              className={tabButtonClassName}
              key={ribbonTabDefinition.id}
              onClick={handleTabClick}
              type="button"
            >
              {ribbonTabDefinition.label}
            </button>
          );
        })}
      </nav>

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
        <article aria-label="Editor surface" className={pageClassName}>
          <HtmlEditor
            htmlSource={importedHtmlSource}
            onHtmlSourceChange={handleHtmlSourceChange}
            {...(onEditorBlur ? { onEditorBlur } : {})}
          />
        </article>
      </main>

      <footer className={statusClassName}>
        <span aria-label="HTML source status">{htmlSourceStatusText}</span>
        <span aria-label="Obsidian link warnings">{linkWarningStatusText}</span>
        <span aria-label="Active markdown file" className={filePathClassName}>
          {activeFileStatusText}
        </span>
      </footer>
    </section>
  );
}
