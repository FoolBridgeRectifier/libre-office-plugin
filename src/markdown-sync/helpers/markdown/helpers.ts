import { PROTECTED_MARKER_ATTRIBUTE } from '../../constants';

export function escapeHtml(text: string): string {
  return text.split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');
}

export function escapeHtmlAttribute(text: string): string {
  return escapeHtml(text).split('"').join('&quot;');
}

export function createFrontmatterTemplate(frontmatter: string | null): string {
  if (frontmatter === null) {
    return '';
  }

  return `<template ${PROTECTED_MARKER_ATTRIBUTE}="frontmatter">${escapeHtml(frontmatter)}</template>`;
}

export function createProtectedJsonTemplate(name: string, value: unknown): string {
  return `<template ${PROTECTED_MARKER_ATTRIBUTE}="${escapeHtmlAttribute(name)}">${escapeHtml(
    JSON.stringify(value)
  )}</template>`;
}
