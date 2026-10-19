import React, { useState } from 'react';
import { Search, Network, ArrowRight, Compass, BookOpen, Users, GitBranch } from 'lucide-react';

interface LandingPageProps {
  onSearchTopic: (query: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSearchTopic }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearchTopic(query.trim());
    }
  };

  const sampleQueries = [
    'Graph Neural Networks',
    'Attention Is All You Need',
    'Federated Learning',
    'Large Language Models',
    'Computer Vision'
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-900 flex flex-col font-sans">
      {/* Top Bar */}
      <nav className="h-20 px-8 flex items-center justify-between border-b border-neutral-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-academic-900 flex items-center justify-center text-white shadow-sm">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-neutral-900">RESEARCHGRAPH</span>
            <span className="block text-[10px] uppercase tracking-widest text-neutral-400 font-semibold -mt-1">
              RESEARCH DISCOVERY
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs font-medium">
          <button
            onClick={() => onSearchTopic('Graph Neural Networks')}
            className="px-4 py-2 bg-academic-900 hover:bg-academic-800 text-white rounded-xl transition shadow-sm font-semibold"
          >
            Explore Research
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-20 flex flex-col items-center text-center space-y-8">
        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-neutral-900 leading-tight">
            Understand research, <br className="hidden sm:inline" /> not just papers.
          </h1>
          <p className="text-base text-neutral-600 font-normal leading-relaxed max-w-xl mx-auto">
            Explore research fields as a connected network. Trace citations, discover influential researchers, and uncover emerging connections.
          </p>
        </div>

        {/* Clean, Inviting Search Box */}
        <form onSubmit={handleSubmit} className="w-full max-w-2xl pt-2">
          <div className="relative flex items-center bg-white p-2 rounded-2xl border border-neutral-300 shadow-xl hover:border-academic-900 transition">
            <Search className="w-5 h-5 absolute left-4 text-neutral-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What are you researching?"
              className="w-full pl-12 pr-36 py-4 text-base text-neutral-900 bg-transparent focus:outline-none placeholder:text-neutral-400 font-medium"
            />
            <button
              type="submit"
              className="absolute right-2.5 px-6 py-3 bg-academic-900 hover:bg-academic-800 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center space-x-2"
            >
              <span>Explore Research</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Try Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs pt-1">
          <span className="text-neutral-400 font-medium">Try:</span>
          {sampleQueries.map((sq, idx) => (
            <button
              key={idx}
              onClick={() => onSearchTopic(sq)}
              className="px-3 py-1.5 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-lg font-medium transition shadow-xs"
            >
              {sq}
            </button>
          ))}
        </div>

        {/* Task Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full text-left pt-12">
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-2 hover:border-academic-900 transition cursor-pointer" onClick={() => onSearchTopic('Graph Neural Networks')}>
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-800">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-neutral-900 text-sm">Find Papers</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Discover foundational literature and high-impact papers in any field.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-2 hover:border-academic-900 transition cursor-pointer" onClick={() => onSearchTopic('Graph Neural Networks')}>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-800">
              <GitBranch className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-neutral-900 text-sm">Trace Ideas</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Follow citation chains to see what a paper built on and what came after it.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-2 hover:border-academic-900 transition cursor-pointer" onClick={() => onSearchTopic('Graph Neural Networks')}>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-800">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-neutral-900 text-sm">Explore Researchers</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Discover active authors, institutions, and collaboration networks.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-8 border-t border-neutral-200 text-center text-xs text-neutral-400">
        RESEARCHGRAPH — Explore the connections behind research.
      </footer>
    </div>
  );
};
