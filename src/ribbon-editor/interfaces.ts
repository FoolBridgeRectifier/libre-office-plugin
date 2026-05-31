export interface RibbonCommandDefinition {
  readonly description: string;
  readonly disabled?: boolean;
  readonly future?: boolean;
  readonly iconName: string;
  readonly id: string;
  readonly label: string;
}

export interface RibbonCommandGroupDefinition {
  readonly commands: ReadonlyArray<RibbonCommandDefinition>;
  readonly id: string;
  readonly label: string;
}

export interface RibbonTabDefinition {
  readonly commandGroups: ReadonlyArray<RibbonCommandGroupDefinition>;
  readonly id: string;
  readonly label: string;
}

export interface RibbonEditorProperties {
  readonly activeFilePath?: string | null;
}
