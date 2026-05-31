import { useState } from 'react';

import { DEFAULT_RIBBON_TAB_ID, RIBBON_TABS } from './constants';
import {
  findRibbonTab,
  getCommandButtonClassName,
  getCommandIcon,
  getTabButtonClassName,
} from './helpers';
import type { RibbonEditorProps } from './interfaces';

export function RibbonEditor({
  activeFilePath = null,
  importedHtmlSource = null,
}: RibbonEditorProps) {
  const [activeRibbonTabId, setActiveRibbonTabId] = useState(DEFAULT_RIBBON_TAB_ID);

  const activeRibbonTabDefinition = findRibbonTab(RIBBON_TABS, activeRibbonTabId);
  const activeFileStatusText = activeFilePath ?? 'No markdown file loaded yet.';

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

  const importedContentClassName =
    'max-w-3xl font-sans text-sm leading-6 text-text-primary [&_.libre-markdown-alert-title]:font-semibold [&_.libre-markdown-alert]:my-3 [&_.libre-markdown-alert]:border-l-4 [&_.libre-markdown-alert]:border-ribbon-border [&_.libre-markdown-alert]:bg-btn-hover-bg [&_.libre-markdown-alert]:pl-3 [&_a]:text-icon-blue [&_blockquote]:border-l-4 [&_blockquote]:border-ribbon-border [&_blockquote]:pl-3 [&_code]:font-mono [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_pre]:overflow-auto [&_table]:border-collapse [&_td]:border [&_td]:border-ribbon-border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-ribbon-border [&_th]:px-2 [&_th]:py-1';

  const titleClassName = 'm-0 font-sans text-xl font-semibold text-text-primary';
  const placeholderClassName = 'mt-4 max-w-2xl font-sans text-sm leading-6 text-text-secondary';

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
          {importedHtmlSource ? (
            <div
              aria-label="Imported rich document"
              className={importedContentClassName}
              dangerouslySetInnerHTML={{ __html: importedHtmlSource }}
            />
          ) : (
            <>
              <h1 className={titleClassName}>Untitled rich note</h1>
              <p className={placeholderClassName}>
                Start from this visual shell while document loading, conversion, and persistence
                arrive in later implementation plans.
              </p>
            </>
          )}
        </article>
      </main>

      <footer className={statusClassName}>
        <span>Markdown mirror stays synchronized beside the LibreOffice-backed editor.</span>
        <span aria-label="Active markdown file" className={filePathClassName}>
          {activeFileStatusText}
        </span>
      </footer>
    </section>
  );
}
