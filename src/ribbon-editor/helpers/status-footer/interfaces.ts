import type { OfficeRuntimeSetupState } from '../../../office-runtime/interfaces';

export interface StatusFooterProps {
  readonly activeFilePath: string | null;
  readonly filePathClassName: string;
  readonly htmlSourceStatusText: string;
  readonly linkWarningStatusText: string;
  readonly officeRuntimeSetupState: OfficeRuntimeSetupState;
  readonly statusClassName: string;
}
