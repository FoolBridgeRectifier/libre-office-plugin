import { Setting } from 'obsidian';

export function addSettingsDropdown<Value extends string>(options: {
  readonly containerElement: HTMLElement;
  readonly currentValue: Value;
  readonly description?: string;
  readonly label: string;
  readonly onChange: (value: Value) => Promise<void>;
  readonly options: ReadonlyArray<{ readonly label: string; readonly value: Value }>;
}): void {
  const setting = new Setting(options.containerElement).setName(options.label);

  if (options.description) {
    setting.setDesc(options.description);
  }

  setting.addDropdown((dropdown) => {
    options.options.forEach((option) => dropdown.addOption(option.value, option.label));

    dropdown.setValue(options.currentValue).onChange((value) => options.onChange(value as Value));

    dropdown.selectEl.setAttribute('aria-label', options.label);
  });
}
