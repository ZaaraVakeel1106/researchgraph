import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { BookOpen, X, Code, Check } from 'lucide-react';

interface GraphTheoryGuideModalProps {
  onClose: () => void;
}

export const GraphTheoryGuideModal: React.FC<GraphTheoryGuideModalProps> = ({ onClose }) => {
  const [docData, setDocData] = useState<any>(null);

  useEffect(() => {
    api.fetchGraphTheoryDocs().then((res) => setDocData(res)).catch(console.error);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-3xl max-h-[85vh] rounded-2xl border border-neutral-200 shadow-2xl flex flex-col overflow-hidden text-neutral-800">
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/60">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-academic-900" />
            <div>
              <h2 className="text-base font-bold text-neutral-900">Academic Graph Theory Documentation</h2>
              <p className="text-[11px] text-neutral-500">B.Tech Graph Theory Project Specifications & NetworkX Algorithms</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {docData?.sections ? (
            docData.sections.map((sec: any, idx: number) => (
              <div key={idx} className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-1">
                <h3 className="font-bold text-neutral-900 text-sm">{sec.topic}</h3>
                <p className="text-neutral-700 leading-relaxed font-sans">{sec.content}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-neutral-500">Loading documentation...</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-medium hover:bg-neutral-800"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
