import type { RibbonTabDefinition } from './interfaces';

export const DEFAULT_RIBBON_TAB_ID = 'home';

export const RIBBON_TABS: RibbonTabDefinition[] = [
  {
    id: 'home',
    label: 'Home',
    commandGroups: [
      {
        id: 'clipboard',
        label: 'Clipboard',
        commands: [
          {
            id: 'format-painter',
            label: 'Painter',
            description: 'Copy formatting between rich note selections.',
            iconName: 'format-painter',
          },
          {
            id: 'paste',
            label: 'Paste',
            description: 'Paste clipboard content into the rich editor.',
            iconName: 'paste',
          },
        ],
      },
      {
        id: 'basic-text',
        label: 'Basic Text',
        commands: [
          {
            id: 'bold',
            label: 'Bold',
            description: 'Apply bold formatting to the current selection.',
            iconName: 'bold',
          },
          {
            id: 'italic',
            label: 'Italic',
            description: 'Apply italic formatting to the current selection.',
            iconName: 'italic',
          },
        ],
      },
    ],
  },
  {
    id: 'insert',
    label: 'Insert',
    commandGroups: [
      {
        id: 'objects',
        label: 'Objects',
        commands: [
          {
            id: 'image',
            label: 'Image',
            description: 'Insert an image and keep the markdown reference in sync.',
            iconName: 'image',
          },
          {
            id: 'table',
            label: 'Table',
            description: 'Add a table once structured blocks are available.',
            disabled: true,
            future: true,
            iconName: 'table',
          },
        ],
      },
      {
        id: 'references',
        label: 'References',
        commands: [
          {
            id: 'link',
            label: 'Link',
            description: 'Create an Obsidian-aware link in a later plan.',
            disabled: true,
            future: true,
            iconName: 'link',
          },
        ],
      },
    ],
  },
  {
    id: 'view',
    label: 'View',
    commandGroups: [
      {
        id: 'layout',
        label: 'Layout',
        commands: [
          {
            id: 'markdown-preview',
            label: 'Mirror',
            description: 'Preview markdown mirror status beside the rich editor.',
            iconName: 'preview',
          },
        ],
      },
    ],
  },
];
