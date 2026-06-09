import {
  handleCalloutFoldClick,
  handleCalloutFoldKeyDown,
  handleCalloutFoldMouseDown,
} from './callout/callout';
import {
  handleHeadingCollapseClick,
  handleHeadingCollapseKeyDown,
  handleHeadingCollapseMouseDown,
} from './heading-collapse/headingCollapse';
import {
  createNavigationInteractionOptions,
  handleEditorNavigationClick,
  handleEditorNavigationKeyDown,
  handleEditorNavigationMouseDown,
  handlePairedExternalNavigationClick,
} from './navigation/navigation';
import {
  handleTaskCheckboxClick,
  handleTaskCheckboxKeyDown,
  handleTaskCheckboxMouseDown,
} from './task-list/taskList';
import type {
  LexicalSourceInteractionHandlers,
  LexicalSourceInteractionInputs,
} from './interfaces';

export function createLexicalSourceInteractionHandlers(
  inputs: LexicalSourceInteractionInputs
): LexicalSourceInteractionHandlers {
  const navigationInteractionOptions = createNavigationInteractionOptions(inputs);

  return {
    onClickCapture: (event) => {
      handleCalloutFoldClick(event, { emitEditorChange: inputs.emitEditorChange });
      handleHeadingCollapseClick(event);
      handleTaskCheckboxClick(event, { emitEditorChange: inputs.emitEditorChange });

      if (consumePairedExternalNavigationClick(event, inputs)) {
        return;
      }

      handleEditorNavigationClick(event, navigationInteractionOptions);
    },
    onKeyDownCapture: (event) => {
      handleCalloutFoldKeyDown(event, { emitEditorChange: inputs.emitEditorChange });
      handleHeadingCollapseKeyDown(event);
      handleTaskCheckboxKeyDown(event, { emitEditorChange: inputs.emitEditorChange });
      handleEditorNavigationKeyDown(event, navigationInteractionOptions);
    },
    onMouseDownCapture: (event) => {
      handleCalloutFoldMouseDown(event);
      handleHeadingCollapseMouseDown(event);
      handleTaskCheckboxMouseDown(event);

      const externalUrl = handleEditorNavigationMouseDown(event, navigationInteractionOptions);

      if (externalUrl) {
        skipPairedClickNavigation(inputs, externalUrl);
      }
    },
  };
}

function consumePairedExternalNavigationClick(
  event: Parameters<LexicalSourceInteractionHandlers['onClickCapture']>[0],
  inputs: LexicalSourceInteractionInputs
): boolean {
  const skippedExternalUrl = inputs.skipNextClickNavigationUrlRef.current;

  if (!handlePairedExternalNavigationClick(event, skippedExternalUrl)) {
    return false;
  }

  inputs.skipNextClickNavigationUrlRef.current = null;

  return true;
}

function skipPairedClickNavigation(
  inputs: LexicalSourceInteractionInputs,
  externalUrl: string
): void {
  inputs.skipNextClickNavigationUrlRef.current = externalUrl;

  setTimeout(() => {
    if (inputs.skipNextClickNavigationUrlRef.current === externalUrl) {
      inputs.skipNextClickNavigationUrlRef.current = null;
    }
  }, 1000);
}
