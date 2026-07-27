import { Link } from '@inertiajs/react';

/**
 * Route-based tab navigation matching the request-quotations tab styling.
 *
 * @param {{
 *   tabs: Array<{ key: string, label: string, href: () => string }>,
 *   activeKey: string,
 *   ariaLabel?: string,
 * }} props
 */
export default function RouteNavTabs({
    tabs,
    activeKey,
    ariaLabel = 'Section views',
}) {
    return (
        <div className="border-b border-line px-4">
            <div
                role="tablist"
                aria-label={ariaLabel}
                className="flex gap-2 overflow-x-auto"
            >
                {tabs.map((tab) => {
                    const isActive = tab.key === activeKey;

                    return (
                        <Link
                            key={tab.key}
                            href={tab.href()}
                            role="tab"
                            aria-selected={isActive}
                            className={`min-h-11 shrink-0 border-b-2 px-4 text-sm font-medium transition ${
                                isActive
                                    ? 'border-teal-700 text-teal-800'
                                    : 'border-transparent text-muted hover:text-ink'
                            }`}
                        >
                            {tab.label}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
