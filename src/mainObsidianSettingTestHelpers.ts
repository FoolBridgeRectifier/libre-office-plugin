export const mockObsidianSettingExports = {
  PluginSettingTab: class MockPluginSettingTab {
    containerEl = createSettingContainerElement();

    constructor(app: unknown, plugin: unknown) {
      void app;
      void plugin;
    }
  },
  Setting: class MockSetting {
    private readonly descriptionElement: HTMLElement;
    private readonly settingElement: HTMLElement;

    constructor(containerElement: HTMLElement) {
      this.settingElement = document.createElement('div');
      this.descriptionElement = document.createElement('p');
      containerElement.appendChild(this.settingElement);
    }

    setName(name: string) {
      const nameElement = document.createElement('span');
      nameElement.textContent = name;
      this.settingElement.appendChild(nameElement);

      return this;
    }

    setDesc(description: string) {
      this.descriptionElement.textContent = description;
      this.settingElement.appendChild(this.descriptionElement);

      return this;
    }

    addText(callback: (text: ReturnType<typeof createTextControl>) => void) {
      const textControl = createTextControl(this.settingElement);
      callback(textControl);

      return this;
    }

    addDropdown(callback: (dropdown: ReturnType<typeof createDropdownControl>) => void) {
      const dropdownControl = createDropdownControl(this.settingElement);
      callback(dropdownControl);

      return this;
    }

    addToggle(callback: (toggle: ReturnType<typeof createToggleControl>) => void) {
      const toggleControl = createToggleControl(this.settingElement);
      callback(toggleControl);

      return this;
    }
  },
};

function createSettingContainerElement() {
  const containerElement = document.createElement('div') as HTMLElement & { empty(): void };

  containerElement.empty = () => {
    containerElement.innerHTML = '';
  };

  Object.defineProperty(containerElement, 'createEl', {
    value: (tagName: string, options: { text?: string }) => {
      const element = document.createElement(tagName);
      element.textContent = options.text ?? '';
      containerElement.appendChild(element);

      return element;
    },
  });

  return containerElement;
}

function createTextControl(parentElement: HTMLElement) {
  const inputElement = document.createElement('input');
  parentElement.appendChild(inputElement);

  return {
    inputEl: inputElement,
    onChange(callback: (value: string) => Promise<void> | void) {
      inputElement.addEventListener('change', () => void callback(inputElement.value));

      return this;
    },
    setPlaceholder(placeholder: string) {
      inputElement.placeholder = placeholder;

      return this;
    },
    setValue(value: string) {
      inputElement.value = value;

      return this;
    },
  };
}

function createDropdownControl(parentElement: HTMLElement) {
  const selectElement = document.createElement('select');
  parentElement.appendChild(selectElement);

  return {
    selectEl: selectElement,
    addOption(value: string, label: string) {
      selectElement.add(new Option(label, value));

      return this;
    },
    onChange(callback: (value: string) => Promise<void> | void) {
      selectElement.addEventListener('change', () => void callback(selectElement.value));

      return this;
    },
    setValue(value: string) {
      selectElement.value = value;

      return this;
    },
  };
}

function createToggleControl(parentElement: HTMLElement) {
  const inputElement = document.createElement('input');
  inputElement.type = 'checkbox';
  parentElement.appendChild(inputElement);

  return {
    toggleEl: inputElement,
    onChange(callback: (value: boolean) => Promise<void> | void) {
      inputElement.addEventListener('change', () => void callback(inputElement.checked));

      return this;
    },
    setValue(value: boolean) {
      inputElement.checked = value;

      return this;
    },
  };
}
