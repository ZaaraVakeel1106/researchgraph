import React, { useEffect, useState } from 'react';
import { Search, Bookmark, HelpCircle, ArrowUpRight } from 'lucide-react';

interface HeaderProps {
  query: string;
  onSearch: (query: string) => void;
  onOpenWorkspace: () => void;
  onOpenDoc: () => void;
}

export const Header: React.FC<HeaderProps> = ({ query, onSearch, onOpenWorkspace, onOpenDoc }) => {
  const [searchInput, setSearchInput] = useState(query);
  useEffect(() => setSearchInput(query), [query]);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchInput.trim()) onSearch(searchInput.trim());
  };

  return <header className="h-[72px] shrink-0 flex items-center justify-between gap-4 px-5 md:px-8 border-b border-neutral-200 bg-app/95 relative z-20">
    <div className="min-w-0 hidden sm:block">
      <div className="rg-kicker">Current workspace</div>
      <div className="text-sm font-medium truncate max-w-[220px] mt-1" title={query}>{query || 'Choose a research topic'}</div>
    </div>
    <form onSubmit={submit} className="flex-1 max-w-[520px] relative">
      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"/>
      <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search papers, topics, or authors…"
        aria-label="Search scholarly works" className="w-full h-10 rounded-xl border border-neutral-200 bg-neutral-50 pl-10 pr-12 text-xs text-neutral-900 placeholder:text-neutral-500 focus:bg-neutral-100 focus:border-sage-900/60 focus:outline-none transition"/>
      <button type="submit" aria-label="Run research search" disabled={!searchInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-neutral-500 hover:text-sage-900 disabled:opacity-30 transition"><ArrowUpRight className="w-4 h-4"/></button>
    </form>
    <div className="flex items-center gap-2">
      <button onClick={onOpenWorkspace} className="inline-flex items-center gap-2 h-9 px-3 rounded-xl border border-neutral-200 text-xs text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition" title="Open saved papers and notes">
        <Bookmark className="w-3.5 h-3.5 text-sage-900"/><span className="hidden sm:inline">My library</span>
      </button>
      <button onClick={onOpenDoc} className="w-9 h-9 inline-flex items-center justify-center rounded-xl border border-transparent text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition" title="About ResearchGraph"><HelpCircle className="w-4 h-4"/></button>
    </div>
  </header>;
};
