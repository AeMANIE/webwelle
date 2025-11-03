'use client';

import { Package, Users, FileText, Edit3 } from 'lucide-react';
import React from 'react';

type TabId = 'bookings' | 'customers' | 'invoices' | 'blog';

interface AdminTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function AdminTabs({ activeTab, onTabChange }: AdminTabsProps) {
  const tabs: Array<{ id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'bookings', label: 'Bestellungen', icon: Package },
    { id: 'customers', label: 'Kunden', icon: Users },
    { id: 'invoices', label: 'Rechnungen', icon: FileText },
    { id: 'blog', label: 'Blog-Editor', icon: Edit3 },
  ];

  return (
    <div className="border-b border-border mb-6">
      <nav className="flex space-x-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={
                `flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ` +
                (isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border')
              }
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}


