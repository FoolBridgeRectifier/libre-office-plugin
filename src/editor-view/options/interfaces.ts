export interface SearchPluginInstance {
  openGlobalSearch(query: string): void;
}

export interface SearchView {
  setQuery(query: string): void;
}

export interface SearchPluginContainer {
  readonly instance?: Partial<SearchPluginInstance>;
}

export interface SearchPluginApp {
  readonly internalPlugins?: {
    getPluginById(pluginId: string): SearchPluginContainer | null;
  };
}

export interface ElectronShell {
  openExternal(url: string): Promise<unknown>;
}

export interface ElectronRuntime {
  readonly shell?: Partial<ElectronShell>;
}
