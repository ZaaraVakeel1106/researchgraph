import { SearchItem, ResearchGraphData, PaperStudyData, ResearchGapSignal, CrossDomainData, BookmarkItem, PaperNote } from '../types';

const API_BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new Error('The ResearchGraph API is unreachable. Check that the backend is running, then retry.');
  }
  if (!response.ok) {
    let detail = `Request failed (${response.status}).`;
    try { const payload = await response.json(); detail = payload.detail || detail; } catch { /* keep status message */ }
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

export const api = {
  async search(query: string, entityType = 'works'): Promise<SearchItem[]> {
    const data = await request<{ results: SearchItem[] }>(`/search?q=${encodeURIComponent(query)}&entity_type=${encodeURIComponent(entityType)}`);
    return data.results;
  },
  fetchGraphLandscape(query: string, mode = 'landscape', scope = 'core'): Promise<ResearchGraphData> {
    return request(`/graph/landscape?q=${encodeURIComponent(query)}&mode=${encodeURIComponent(mode)}&scope=${scope}`);
  },
  fetchGraphEntity(entityId: string, scope = 'full'): Promise<ResearchGraphData> {
    return request(`/graph/entity/${encodeURIComponent(entityId)}?hops=2&scope=${scope}`);
  },
  fetchPageRankLeaderboard(query: string): Promise<any> { return request(`/analytics/pagerank?q=${encodeURIComponent(query)}`); },
  fetchCentralityLeaderboard(query: string): Promise<any> { return request(`/analytics/centrality?q=${encodeURIComponent(query)}`); },
  fetchCommunities(query: string): Promise<any> { return request(`/analytics/communities?q=${encodeURIComponent(query)}`); },
  findShortestPath(source: string, target: string): Promise<any> { return request(`/analytics/shortest-path?source=${encodeURIComponent(source)}&target=${encodeURIComponent(target)}`); },
  fetchPaperStudy(paperId: string): Promise<PaperStudyData> { return request(`/papers/${encodeURIComponent(paperId)}/study`); },
  async fetchResearchGaps(query: string): Promise<ResearchGapSignal[]> {
    const data = await request<{ signals: ResearchGapSignal[] }>(`/signals/gaps?q=${encodeURIComponent(query)}`); return data.signals;
  },
  fetchCrossDomain(domainA: string, domainB: string): Promise<CrossDomainData> {
    return request(`/signals/cross-domain?domain_a=${encodeURIComponent(domainA)}&domain_b=${encodeURIComponent(domainB)}`);
  },
  fetchBookmarks(): Promise<BookmarkItem[]> { return request('/workspace/bookmarks'); },
  addBookmark(item: Partial<BookmarkItem> & { metadata_json?: Record<string, unknown> }): Promise<BookmarkItem> {
    return request('/workspace/bookmarks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
  },
  async removeBookmark(entityId: string): Promise<void> {
    await request(`/workspace/bookmarks/${encodeURIComponent(entityId)}`, { method: 'DELETE' });
  },
  fetchPaperNote(paperId: string): Promise<PaperNote> { return request(`/workspace/notes/${encodeURIComponent(paperId)}`); },
  savePaperNote(note: PaperNote): Promise<PaperNote> {
    return request('/workspace/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(note) });
  },
  fetchGraphTheoryDocs() { return request('/graph-theory/doc'); }
};
