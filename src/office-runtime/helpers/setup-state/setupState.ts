import type {
  OfficeRuntimeCandidate,
  OfficeRuntimeSetupState,
  OfficeRuntimeValidationResult,
} from '../../interfaces';

export function createMissingRuntimeSetupState(diagnostic?: string): OfficeRuntimeSetupState {
  return {
    ...(diagnostic ? { diagnostic } : {}),
    isBlocking: true,
    message: 'Bundled LibreOffice runtime was not found. HTML editing remains available.',
    status: 'missing',
  };
}

export function createReadyRuntimeSetupState(
  candidate: OfficeRuntimeCandidate,
  validationResult: Extract<OfficeRuntimeValidationResult, { readonly status: 'valid' }>
): OfficeRuntimeSetupState {
  return {
    executablePath: validationResult.executablePath,
    isBlocking: false,
    message: 'LibreOffice ready from bundled runtime.',
    source: candidate.source,
    status: 'ready',
    version: validationResult.version,
  };
}

export function createSkippedMobileRuntimeSetupState(): OfficeRuntimeSetupState {
  return {
    isBlocking: false,
    message: 'Mobile HTML editing does not require LibreOffice.',
    status: 'skipped-mobile',
  };
}

export function createUnsupportedRuntimeSetupState(): OfficeRuntimeSetupState {
  return {
    diagnostic: 'This operating system is not supported for local LibreOffice detection.',
    isBlocking: true,
    message: 'LibreOffice desktop detection is not supported here.',
    status: 'unsupported',
  };
}
