import {
  TABLE_KIND_ATTRIBUTE,
  TABLE_SCROLL_CONTAINER_CLASS,
  TABLE_SOURCE_ATTRIBUTE,
} from '../../constants';
import { PROTECTED_MARKER_ATTRIBUTE } from '../../../markdown-sync/constants';
import { sanitizeElement, sanitizeHtmlSource } from './helpers/sanitizer/sanitizer';
import { getRowCells, getTableRows, isSimpleTable } from './helpers/structure/structure';
import type { InlineMarkdownReader } from '../../interfaces';

function wrapTableForHorizontalScroll(tableElement: HTMLTableElement): void {
  if (tableElement.parentElement?.classList.contains('libre-table-scroll')) {
    return;
  }

  const wrapperElement = tableElement.ownerDocument.createElement('div');

  wrapperElement.setAttribute('class', TABLE_SCROLL_CONTAINER_CLASS);
  tableElement.replaceWith(wrapperElement);
  wrapperElement.append(tableElement);
}

export function annotateTableHtml(htmlSource: string): string {
  const htmlDocument = new DOMParser().parseFromString(htmlSource, 'text/html');

  for (const tableElement of Array.from(htmlDocument.querySelectorAll<HTMLTableElement>('table'))) {
    const tableKind = isSimpleTable(tableElement) ? 'simple' : 'complex';

    if (tableKind === 'complex') {
      sanitizeElement(tableElement);
      tableElement.setAttribute(TABLE_KIND_ATTRIBUTE, tableKind);
      tableElement.setAttribute(PROTECTED_MARKER_ATTRIBUTE, 'complex-table');
      tableElement.setAttribute(TABLE_SOURCE_ATTRIBUTE, sanitizeHtmlSource(tableElement.outerHTML));
    } else {
      tableElement.setAttribute(TABLE_KIND_ATTRIBUTE, tableKind);
    }

    wrapTableForHorizontalScroll(tableElement);
  }

  return htmlDocument.body.innerHTML;
}

function escapeTableCell(text: string): string {
  return text.replace(/\n+/g, ' ').replace(/\|/g, '\\|').trim();
}

function getAlignmentMarker(cellElement: HTMLTableCellElement): string {
  const alignValue = cellElement.getAttribute('align') ?? cellElement.style.textAlign;

  if (alignValue === 'center') {
    return ':---:';
  }

  if (alignValue === 'right') {
    return '---:';
  }

  return '---';
}

function getMarkdownRow(
  cellElements: ReadonlyArray<HTMLTableCellElement>,
  readInlineMarkdown: InlineMarkdownReader
): string {
  const cellTexts = cellElements.map((cellElement) =>
    escapeTableCell(Array.from(cellElement.childNodes).map(readInlineMarkdown).join(''))
  );

  return `| ${cellTexts.join(' | ')} |`;
}

function getSimpleTableMarkdown(
  tableElement: HTMLTableElement,
  readInlineMarkdown: InlineMarkdownReader
): string {
  const rows = getTableRows(tableElement);
  const headerCells = getRowCells(rows[0] as HTMLTableRowElement);
  const alignmentRow = `| ${headerCells.map(getAlignmentMarker).join(' | ')} |`;

  const bodyRows = rows
    .slice(1)
    .map((rowElement) => getMarkdownRow(getRowCells(rowElement), readInlineMarkdown));

  const tableMarkdown = [
    getMarkdownRow(headerCells, readInlineMarkdown),
    alignmentRow,
    ...bodyRows,
  ];

  const captionText = tableElement.querySelector('caption')?.textContent?.trim();

  return captionText ? `${captionText}\n\n${tableMarkdown.join('\n')}` : tableMarkdown.join('\n');
}

function getTableElement(element: HTMLElement): HTMLTableElement | null {
  if (element instanceof HTMLTableElement) {
    return element;
  }

  return element.matches('.libre-table-scroll') ? element.querySelector('table') : null;
}

export function getTableMarkdown(
  element: HTMLElement,
  readInlineMarkdown: InlineMarkdownReader
): string | null {
  const tableElement = getTableElement(element);

  if (!tableElement) {
    return null;
  }

  if (isSimpleTable(tableElement)) {
    return getSimpleTableMarkdown(tableElement, readInlineMarkdown);
  }

  return (
    tableElement.getAttribute(TABLE_SOURCE_ATTRIBUTE) ?? sanitizeHtmlSource(tableElement.outerHTML)
  );
}
