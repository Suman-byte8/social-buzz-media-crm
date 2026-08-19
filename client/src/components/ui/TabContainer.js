import React, { useState } from "react";

export default function TabContainer({ tabs, children, defaultTab = 0 }) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-outline-variant mb-4">
        <div className="flex gap-2 text-sm font-medium text-on-surface-variant">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              onClick={() => setActiveTab(index)}
              className={`px-4 py-2 border-b-2 ${
                activeTab === index
                  ? "border-primary text-on-primary font-semibold"
                  : "border-transparent text-on-surface-variant hover:text-primary transition-colors"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">{children[activeTab]}</div>
    </div>
  );
}