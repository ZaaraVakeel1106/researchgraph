import React, { useState } from 'react';
import { Search, Bookmark, BookOpen, Network, Sparkles, Compass, HelpCircle } from 'lucide-react';

interface HeaderProps {
  query: string;
  onSearch: (q: string) => void;
  activeTab: 'overview' | 'canvas' | 'insights' | 'connections';
  onSelectTab: (tab: 'overview' | 'canvas' | 'insights' | 'connections') => void;
  onOpenWorkspace: () => void;
  onOpenDoc: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  query,
  onSearch,
  activeTab,
  onSelectTab,
  onOpenWorkspace,
  onOpenDoc
}) => {
  const [searchInput, setSearchInput] = useState(query);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
    }
  };

  return (
    <header className="h-16 border-b border-neutral-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between z-30 sticky top-0 shadow-sm">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => onSelectTab('overview')}>
          <div className="w-8 h-8 rounded-lg bg-academic-900 flex items-center justify-center text-white shadow-sm">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-neutral-900">RESEARCHGRAPH</span>
            <span className="block text-[9px] uppercase tracking-widest text-neutral-400 font-semibold -mt-0.5">
              RESEARCH DISCOVERY
            </span>
          </div>
        </div>

        {/* Simplified 4 Main Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-neutral-100 p-1 rounded-xl border border-neutral-200 text-xs">
          {[
            { id: 'overview', label: 'Explore', icon: Compass },
            { id: 'canvas', label: 'Research Map', icon: Network },
            { id: 'insights', label: 'Insights', icon: Sparkles }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                  isActive
                    ? 'bg-white text-academic-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Global Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md mx-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="What are you researching? (e.g. Graph Neural Networks)..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-100/90 hover:bg-neutral-100 focus:bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:ring-2 focus:ring-academic-900 focus:outline-none transition shadow-inner"
          />
        </div>
      </form>

      {/* Navigation Actions */}
      <div className="flex items-center space-x-3 text-xs font-medium">
        <button
          onClick={onOpenWorkspace}
          className="flex items-center space-x-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition"
          title="Saved Workspace"
        >
          <Bookmark className="w-4 h-4 text-amber-500" />
          <span className="hidden sm:inline">My Research</span>
        </button>

        <button
          onClick={onOpenDoc}
          className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition"
          title="How it works (Graph Theory Guide)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
