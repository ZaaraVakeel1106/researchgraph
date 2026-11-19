import React, { useRef, useState } from 'react';
import { Search, Network, ArrowUpRight, BookOpen, Bookmark, GitBranch, Sparkles } from 'lucide-react';

interface LandingPageProps { onSearchTopic: (query: string) => void; }

export const LandingPage: React.FC<LandingPageProps> = ({ onSearchTopic }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const examples = ['Climate change', 'Psychological thinking', 'Computer vision', 'Medical image segmentation'];

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (query.trim()) onSearchTopic(query.trim());
  };

  return (
    <div className="rg-app min-h-screen flex flex-col overflow-hidden">
      <header className="h-[76px] shrink-0 border-b border-neutral-200/80 px-6 md:px-10 flex items-center justify-between bg-sidebar/90">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sage-900/15 border border-sage-900/30 text-sage-900 flex items-center justify-center"><Network className="w-[18px] h-[18px]" /></div>
          <div><div className="text-[13px] font-semibold tracking-[.14em]">RESEARCHGRAPH</div><div className="rg-kicker mt-0.5">Scholarly discovery studio</div></div>
        </div>
        <button onClick={() => inputRef.current?.focus()} className="hidden sm:inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-900 transition">
          Explore the literature <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </header>

      <main className="flex-1 w-full max-w-[1320px] mx-auto px-6 md:px-10 py-12 md:py-[76px]">
        <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-12 lg:gap-20 items-center">
          <section className="max-w-[710px]">
            <div className="inline-flex items-center gap-2 text-[10px] tracking-[.14em] uppercase font-semibold text-sage-900 px-3 py-1.5 rounded-full border border-sage-900/25 bg-sage-900/10">
              <span className="w-1.5 h-1.5 rounded-full bg-sage-900" /> A connected view of research
            </div>
            <h1 className="font-editorial text-[52px] sm:text-[68px] leading-[.99] tracking-[-.035em] mt-7 max-w-[680px]">
              Follow the ideas<br className="hidden sm:block" /> behind the paper.
            </h1>
            <p className="text-[15px] text-neutral-600 leading-7 mt-6 max-w-[570px]">
              Search scholarly work, trace its references, and explore the people and topics connected to it. Every record comes from OpenAlex.
            </p>

            <form onSubmit={submit} className="mt-9 max-w-[650px]">
              <label htmlFor="research-query" className="rg-kicker block mb-2.5">Start with a topic, question, or paper title</label>
              <div className="flex gap-2 p-2 rounded-2xl bg-neutral-50 border border-neutral-200 focus-within:border-sage-900/60 focus-within:ring-2 focus-within:ring-sage-900/15 transition">
                <div className="flex flex-1 min-w-0 items-center gap-3 pl-3">
                  <Search className="w-[18px] h-[18px] text-neutral-500 shrink-0" />
                  <input ref={inputRef} id="research-query" value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="e.g. climate adaptation policy" className="w-full min-w-0 py-3 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-500 outline-none" />
                </div>
                <button type="submit" disabled={!query.trim()} className="shrink-0 inline-flex items-center gap-2 px-4 sm:px-5 py-3 rounded-xl bg-highlight-500 text-neutral-900 font-semibold text-xs hover:bg-highlight-600 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  Explore <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-neutral-500 mr-1">Try a search</span>
              {examples.map(example => <button key={example} onClick={() => onSearchTopic(example)} className="px-3 py-1.5 rounded-full border border-neutral-200 text-[11px] text-neutral-600 hover:text-neutral-900 hover:border-sage-900/40 hover:bg-neutral-50 transition">{example}</button>)}
            </div>
          </section>

          <div className="relative hidden lg:block min-h-[410px]">
            <div className="rg-hero-surface absolute inset-0 rounded-[28px] border border-neutral-200/70 overflow-hidden">
              <div className="absolute left-8 top-8 rg-kicker">A literature map</div>
              <div className="absolute right-8 top-8 text-[10px] tracking-[.12em] uppercase text-neutral-500">Papers · people · ideas</div>
              <svg viewBox="0 0 540 390" className="absolute inset-0 w-full h-full" aria-hidden="true">
                <defs><linearGradient id="rg-edge" x1="0" x2="1"><stop stopColor="var(--rg-sage)" stopOpacity=".18"/><stop offset=".5" stopColor="var(--rg-blue)" stopOpacity=".56"/><stop offset="1" stopColor="var(--rg-sage)" stopOpacity=".2"/></linearGradient></defs>
                <g stroke="url(#rg-edge)" strokeWidth="1.2" fill="none">
                  <path d="M102 202 197 124 284 174 383 104 444 188 347 266 252 236 164 300 102 202Z"/>
                  <path d="m197 124 55 112 31-62 64 92 97-78-160-62-120 176 186-162"/>
                  <path d="m102 202 150 34 131-132 61 84-97 78-183 34"/>
                </g>
                <g stroke="var(--rg-secondary)" strokeWidth="1.4">
                  <circle cx="102" cy="202" r="8" fill="var(--rg-blue)"/><circle cx="197" cy="124" r="6" fill="var(--rg-amber)"/><circle cx="284" cy="174" r="13" fill="var(--rg-sage)"/><circle cx="383" cy="104" r="7" fill="var(--rg-coral)"/><circle cx="444" cy="188" r="9" fill="var(--rg-blue)"/><circle cx="347" cy="266" r="7" fill="var(--rg-amber)"/><circle cx="252" cy="236" r="6" fill="var(--rg-sage)"/><circle cx="164" cy="300" r="8" fill="var(--rg-coral)"/>
                </g>
                <circle cx="284" cy="174" r="23" fill="none" stroke="var(--rg-lime)" strokeOpacity=".65"/>
              </svg>
              <div className="absolute bottom-7 left-7 right-7 flex items-end justify-between border-t border-neutral-200/70 pt-4">
                <div><div className="text-sm font-medium">Connections with provenance</div><div className="text-xs text-neutral-500 mt-1">Follow each relationship back to its source record.</div></div>
                <span className="font-editorial text-4xl text-sage-900/80">R/G</span>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-16 md:mt-24 border-t border-neutral-200/80 pt-7">
          <div className="flex items-baseline justify-between gap-4 mb-5"><h2 className="font-editorial text-2xl">A quieter way to explore a field</h2><span className="rg-kicker hidden sm:inline">Research tools, grounded in records</span></div>
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-200/80 border-y border-neutral-200/80">
            {[
              { icon: Network, title: 'See the landscape', text: 'Explore papers, authors, institutions, and topics in one bounded graph.' },
              { icon: GitBranch, title: 'Follow citations', text: 'Move from a work to the references it lists and works that cite it.' },
              { icon: BookOpen, title: 'Build a reading desk', text: 'Save papers, keep private notes, and export your bibliography.' }
            ].map(({ icon: Icon, title, text }) => <article key={title} className="py-5 md:px-6 first:pl-0 last:pr-0">
              <Icon className="w-4 h-4 text-sage-900"/><h3 className="text-sm font-semibold mt-3">{title}</h3><p className="text-xs text-neutral-500 leading-5 mt-1.5 max-w-[300px]">{text}</p>
            </article>)}
          </div>
          <p className="mt-5 flex items-center gap-2 text-[11px] text-neutral-500"><Bookmark className="w-3.5 h-3.5"/> Your saved papers and notes stay in your local ResearchGraph workspace.</p>
        </section>
      </main>

      <footer className="border-t border-neutral-200/80 px-6 md:px-10 py-4 flex items-center justify-between text-[10px] text-neutral-500">
        <span>RESEARCHGRAPH <span className="mx-2 text-neutral-300">/</span> Scholarly discovery</span><span className="inline-flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-sage-900"/> OpenAlex records</span>
      </footer>
    </div>
  );
};
