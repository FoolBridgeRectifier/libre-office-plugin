import { collectObsidianLinkWarnings } from './warnings';
import type { ObsidianLinkTargetResolver } from '../../interfaces';

function createResolver(): ObsidianLinkTargetResolver {
  return {
    resolveTarget: (targetPath) => {
      if (targetPath === 'Missing Note') {
        return null;
      }

      return {
        blockIds: ['existing-block'],
        headings: ['Existing Heading', 'Duplicate Heading', 'Duplicate Heading'],
      };
    },
  };
}

test('warns when an existing note is missing a linked heading target', () => {
  const htmlSource =
    '<article><span data-libre-obsidian-link-source="[[Note#Old Heading]]">[[Note#Old Heading]]</span></article>';

  expect(collectObsidianLinkWarnings(htmlSource, createResolver())).toEqual([
    {
      linkText: '[[Note#Old Heading]]',
      targetNote: 'Note',
      targetValue: 'Old Heading',
      type: 'missing-heading-target',
    },
  ]);
});

test('warns from protected markdown source facts when rendered attributes are absent', () => {
  const sourceFacts = {
    facts: [{ text: '[[Note#Old Heading]]', type: 'wikilink' }],
  };
  const htmlSource = `<article><template data-libre-protected="markdown-source-facts">${JSON.stringify(sourceFacts)}</template></article>`;

  expect(collectObsidianLinkWarnings(htmlSource, createResolver())).toEqual([
    {
      linkText: '[[Note#Old Heading]]',
      targetNote: 'Note',
      targetValue: 'Old Heading',
      type: 'missing-heading-target',
    },
  ]);
});

test('does not duplicate warnings when attributes and source facts contain the same link', () => {
  const sourceFacts = {
    facts: [{ text: '[[Note#Old Heading]]', type: 'wikilink' }],
  };

  const htmlSource = [
    '<article>',
    `<template data-libre-protected="markdown-source-facts">${JSON.stringify(sourceFacts)}</template>`,
    '<span data-libre-obsidian-link-source="[[Note#Old Heading]]"></span>',
    '</article>',
  ].join('');

  expect(collectObsidianLinkWarnings(htmlSource, createResolver())).toHaveLength(1);
});

test('does not warn for missing notes or duplicate headings that still exist', () => {
  const htmlSource = [
    '<article>',
    '<span data-libre-obsidian-link-source="[[Missing Note#Heading]]"></span>',
    '<span data-libre-obsidian-link-source="[[Note#Duplicate Heading]]"></span>',
    '</article>',
  ].join('');

  expect(collectObsidianLinkWarnings(htmlSource, createResolver())).toEqual([]);
});

test('warns when an existing note is missing a linked block target', () => {
  const htmlSource =
    '<article><span data-libre-obsidian-link-source="[[Note#^missing-block]]"></span></article>';

  expect(collectObsidianLinkWarnings(htmlSource, createResolver())).toEqual([
    {
      linkText: '[[Note#^missing-block]]',
      targetNote: 'Note',
      targetValue: 'missing-block',
      type: 'missing-block-target',
    },
  ]);
});

test('does not warn when block target exists', () => {
  const htmlSource =
    '<article><span data-libre-obsidian-link-source="[[Note#^existing-block]]"></span></article>';

  expect(collectObsidianLinkWarnings(htmlSource, createResolver())).toEqual([]);
});
