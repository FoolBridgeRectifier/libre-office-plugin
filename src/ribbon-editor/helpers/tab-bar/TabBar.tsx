import { RIBBON_TABS } from '../../constants';
import { getTabButtonClassName } from '../../helpers';
import type { RibbonTabBarProps } from './interfaces';

export function RibbonTabBar({ activeRibbonTabId, onActiveRibbonTabChange }: RibbonTabBarProps) {
  return (
    <nav
      aria-label="Ribbon tabs"
      className="flex overflow-x-auto bg-ribbon-purple shadow-ribbon-raised"
    >
      {RIBBON_TABS.map((ribbonTabDefinition) => {
        const isActiveRibbonTab = ribbonTabDefinition.id === activeRibbonTabId;
        const tabButtonClassName = getTabButtonClassName(isActiveRibbonTab);
        const handleTabClick = () => onActiveRibbonTabChange(ribbonTabDefinition.id);

        return (
          <button
            aria-pressed={isActiveRibbonTab}
            className={tabButtonClassName}
            key={ribbonTabDefinition.id}
            onClick={handleTabClick}
            type="button"
          >
            {ribbonTabDefinition.label}
          </button>
        );
      })}
    </nav>
  );
}
