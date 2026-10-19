import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { BookmarkItem } from '../../types';
import { Bookmark, Download, Trash2, X, FileText } from 'lucide-react';

interface WorkspaceModalProps {
  onClose: () => void;
  onOpenPaperStudy: (paperId: string) => void;
}

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({ onClose, onOpenPaperStudy }) => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = () => {
    setLoading(true);
    api.fetchBookmarks()
      .then((res) => setBookmarks(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleRemove = async (entityId: string) => {
    await api.removeBookmark(entityId);
    loadBookmarks();
  };

  const handleExportBibtex = () => {
    window.open('/api/workspace/export/bibtex', '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-2xl border border-neutral-200 shadow-2xl flex flex-col overflow-hidden text-neutral-800">
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/60">
          <div className="flex items-center space-x-2">
            <Bookmark className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-neutral-900">My Saved Research Workspace</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {loading ? (
            <div className="text-center py-8 text-neutral-500">Loading saved bookmarks...</div>
          ) : bookmarks.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              No saved papers or entities yet. Click "Save to Workspace" in any node panel to save items here.
            </div>
          ) : (
            <div className="space-y-2">
              {bookmarks.map((bm) => (
                <div key={bm.id} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
                  <div className="truncate mr-3">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-teal-100 text-teal-800 mr-2">
                      {bm.entity_type}
                    </span>
                    <span className="font-semibold text-neutral-900">{bm.title}</span>
                    {bm.subtitle && <p className="text-[11px] text-neutral-500 truncate mt-0.5">{bm.subtitle}</p>}
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    {bm.entity_type === 'paper' && (
                      <button
                        onClick={() => { onClose(); onOpenPaperStudy(bm.entity_id); }}
                        className="px-2.5 py-1 bg-academic-900 text-white rounded text-[11px] font-medium hover:bg-academic-800"
                      >
                        Study
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(bm.entity_id)}
                      className="p-1 text-neutral-400 hover:text-rose-600 rounded"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between">
          <button
            onClick={handleExportBibtex}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export BibTeX</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-medium hover:bg-neutral-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
