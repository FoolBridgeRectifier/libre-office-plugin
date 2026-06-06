import type {
  OfficeRuntimeCandidate,
  OfficeRuntimeCandidateSource,
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
    message: `LibreOffice ready from ${getCandidateSourceLabel(candidate.source)}.`,
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

export function createInvalidRuntimeSetupState(diagnostic: string): OfficeRuntimeSetupState {
  return {
    diagnostic,
    isBlocking: true,
    message: 'LibreOffice is configured but could not be used.',
    status: 'invalid',
  };
}

function getCandidateSourceLabel(source: OfficeRuntimeCandidateSource): string {
  switch (source) {
    case 'bundled':
      return 'bundled runtime';
    case 'configured':
      return 'configured path';
    case 'system':
      return 'system path';
  }
}
