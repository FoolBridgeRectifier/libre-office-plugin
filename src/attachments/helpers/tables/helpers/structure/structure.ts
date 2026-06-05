import { UNSUPPORTED_CELL_CONTENT_SELECTOR } from '../../../../constants';

export function getTableRows(tableElement: HTMLTableElement): HTMLTableRowElement[] {
  return Array.from(tableElement.querySelectorAll('tr'));
}

export function getRowCells(rowElement: HTMLTableRowElement): HTMLTableCellElement[] {
  return Array.from(rowElement.children).filter(
    (cellElement): cellElement is HTMLTableCellElement =>
      cellElement instanceof HTMLTableCellElement
  );
}

function hasUnsupportedSpans(tableElement: HTMLTableElement): boolean {
  return Boolean(tableElement.querySelector('td[colspan],td[rowspan],th[colspan],th[rowspan]'));
}

function hasUnsupportedCellContent(tableElement: HTMLTableElement): boolean {
  return Boolean(tableElement.querySelector(UNSUPPORTED_CELL_CONTENT_SELECTOR));
}

export function isSimpleTable(tableElement: HTMLTableElement): boolean {
  const rows = getTableRows(tableElement);
  const firstRow = rows[0];
  const firstCellCount = firstRow ? getRowCells(firstRow).length : 0;

  return (
    firstCellCount > 0 &&
    !hasUnsupportedSpans(tableElement) &&
    !hasUnsupportedCellContent(tableElement) &&
    rows.every((rowElement) => getRowCells(rowElement).length === firstCellCount)
  );
}
