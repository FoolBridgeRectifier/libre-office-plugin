export interface RibbonTabBarProps {
  readonly activeRibbonTabId: string;
  readonly onActiveRibbonTabChange: (ribbonTabId: string) => void;
}
