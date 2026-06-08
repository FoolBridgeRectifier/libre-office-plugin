export interface OfficeRuntimeCandidate {
  readonly executablePath: string;
  readonly source: 'bundled';
}

export interface OfficeRuntimeDetectionOptions {
  readonly bundledRootPath?: string | null;
  readonly dependencies?: OfficeRuntimeDependencies;
  readonly operatingSystem: OfficeRuntimeOperatingSystem;
  readonly platform: OfficeRuntimePlatform;
  readonly timeoutMs?: number;
}

export interface OfficeRuntimeDependencies {
  readonly fileSystem: OfficeRuntimeFileSystem;
  readonly process: OfficeRuntimeProcess;
}

export interface OfficeRuntimeExecutionResult {
  readonly exitCode: number | null;
  readonly standardError: string;
  readonly standardOutput: string;
  readonly timedOut?: boolean;
}

export interface OfficeRuntimeMockOptions {
  readonly directories?: ReadonlyArray<string>;
  readonly files?: ReadonlyArray<string>;
  readonly systemExecutables?: Readonly<Record<string, string | null>>;
  readonly validationResults?: Readonly<Record<string, OfficeRuntimeExecutionResult>>;
}

export interface OfficeRuntimePlatformFlags {
  readonly isLinux: boolean;
  readonly isMacOS: boolean;
  readonly isWin: boolean;
}

interface OfficeRuntimeFileSystem {
  isDirectory(executablePath: string): Promise<boolean>;
  isFile(executablePath: string): Promise<boolean>;
  pathExists(executablePath: string): Promise<boolean>;
}

export type OfficeRuntimeOperatingSystem = 'linux' | 'macos' | 'unsupported' | 'windows';

type OfficeRuntimePlatform = 'desktop' | 'mobile';

interface OfficeRuntimeProcess {
  executeFile(
    executablePath: string,
    argumentsList: ReadonlyArray<string>,
    timeoutMs: number
  ): Promise<OfficeRuntimeExecutionResult>;
  findExecutable(executableName: string, timeoutMs: number): Promise<string | null>;
  launchFile?(
    executablePath: string,
    argumentsList: ReadonlyArray<string>,
    timeoutMs: number
  ): Promise<void>;
}

export type OfficeRuntimeSetupState =
  | {
      readonly isBlocking: false;
      readonly message: string;
      readonly status: 'ready';
      readonly executablePath: string;
      readonly source: 'bundled';
      readonly version: string;
    }
  | {
      readonly diagnostic?: string;
      readonly isBlocking: true;
      readonly message: string;
      readonly status: 'invalid' | 'missing' | 'unsupported';
    }
  | {
      readonly isBlocking: false;
      readonly message: string;
      readonly status: 'skipped-mobile';
    };

export type OfficeRuntimeValidationResult =
  | {
      readonly executablePath: string;
      readonly status: 'valid';
      readonly version: string;
    }
  | {
      readonly diagnostic: string;
      readonly status: 'invalid';
    };
