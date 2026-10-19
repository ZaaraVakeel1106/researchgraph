import React, { useEffect, useRef, useState } from 'react';
import cytoscape, { Core, EventObject } from 'cytoscape';
import { ResearchGraphData, GraphNode, RelevanceTier } from '../../types';
import { Layers, Sliders } from 'lucide-react';

interface CytoscapeCanvasProps {
  graphData: ResearchGraphData;
  selectedNodeId: string | null;
  onSelectNode: (node: GraphNode | null) => void;
  yearRange: [number, number];
  searchTerm: string;
}

export const CytoscapeCanvas: React.FC<CytoscapeCanvasProps> = ({
  graphData,
  selectedNodeId,
  onSelectNode,
  yearRange,
  searchTerm
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  // Scope Filter State: 'core' | 'related' | 'all'
  const [scopeFilter, setScopeFilter] = useState<'core' | 'related' | 'all'>('related');

  useEffect(() => {
    if (!containerRef.current || !graphData || !graphData.nodes) return;

    // Filter nodes by year range AND selected scope filter
    const cyNodes = graphData.nodes
      .filter((n) => {
        const yearOk = !n.year || (n.year >= yearRange[0] && n.year <= yearRange[1]);
        if (!yearOk) return false;

        const tier = n.relevance_tier || 'core';
        if (scopeFilter === 'core') return tier === 'core';
        if (scopeFilter === 'related') return tier === 'core' || tier === 'related';
        return true; // 'all' includes adjacent
      })
      .map((n) => {
        const pr = n.metrics?.pagerank || 0.01;
        const size = Math.max(34, Math.min(75, 34 + pr * 300));
        
        let color = '#0f766e'; // paper
        let shape = 'ellipse';
        if (n.type === 'author') { color = '#d97706'; shape = 'ellipse'; }
        else if (n.type === 'institution') { color = '#4338ca'; shape = 'round-rectangle'; }
        else if (n.type === 'topic') { color = '#e11d48'; shape = 'hexagon'; }

        // Tier border colors
        let borderColor = '#ffffff';
        let borderWidth = 2;
        let borderStyle = 'solid';
        if (n.relevance_tier === 'core') {
          borderColor = '#0f766e';
          borderWidth = 3;
        } else if (n.relevance_tier === 'related') {
          borderColor = '#3b82f6';
          borderWidth = 2;
        } else if (n.relevance_tier === 'adjacent') {
          borderColor = '#f59e0b';
          borderWidth = 2;
          borderStyle = 'dashed';
        }

        return {
          data: {
            id: n.id,
            label: n.label,
            type: n.type,
            sub_label: n.sub_label || '',
            size: size,
            color: color,
            shape: shape,
            borderColor: borderColor,
            borderWidth: borderWidth,
            borderStyle: borderStyle,
            rawNode: n
          }
        };
      });

    const validNodeIds = new Set(cyNodes.map((cn) => cn.data.id));

    const cyEdges = graphData.edges
      .filter((e) => validNodeIds.has(e.source) && validNodeIds.has(e.target))
      .map((e) => ({
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label || e.type,
          type: e.type,
          weight: e.weight || 1.0
        }
      }));

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: [...cyNodes, ...cyEdges],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'label': 'data(label)',
            'width': 'data(size)',
            'height': 'data(size)',
            'shape': 'data(shape)' as any,
            'color': '#111827',
            'font-size': '11px',
            'font-family': 'Inter, sans-serif',
            'font-weight': 600,
            'text-valign': 'bottom',
            'text-margin-y': 5,
            'text-wrap': 'wrap',
            'text-max-width': '110px',
            'border-width': 'data(borderWidth)',
            'border-color': 'data(borderColor)',
            'border-style': 'data(borderStyle)' as any,
            'transition-property': 'opacity, border-width, border-color, background-color',
            'transition-duration': 0.25
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 'mapData(weight, 1, 5, 1.5, 4)',
            'line-color': '#cbd5e1',
            'target-arrow-color': '#94a3b8',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.65,
            'transition-property': 'opacity, line-color, width',
            'transition-duration': 0.25
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 5,
            'border-color': '#0f766e',
            'overlay-color': '#0f766e',
            'overlay-opacity': 0.25,
            'overlay-padding': 8
          }
        },
        {
          selector: '.highlighted',
          style: {
            'opacity': 1,
            'border-width': 4,
            'border-color': '#111827'
          }
        },
        {
          selector: '.dimmed',
          style: {
            'opacity': 0.15
          }
        },
        {
          selector: '.edge-highlighted',
          style: {
            'opacity': 1,
            'line-color': '#0f766e',
            'width': 3
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: false,
        nodeRepulsion: 400000,
        idealEdgeLength: 100,
        edgeElasticity: 100,
        gravity: 0.25,
        numIter: 1000,
        padding: 50
      }
    });

    cy.ready(() => {
      cy.fit(undefined, 50);
    });

    // Hover effect
    cy.on('mouseover', 'node', (evt: EventObject) => {
      const node = evt.target;
      const neighborhood = node.neighborhood().add(node);

      cy.elements().addClass('dimmed');
      neighborhood.removeClass('dimmed').addClass('highlighted');
      node.connectedEdges().removeClass('dimmed').addClass('edge-highlighted');
    });

    cy.on('mouseout', 'node', () => {
      cy.elements().removeClass('dimmed').removeClass('highlighted').removeClass('edge-highlighted');
    });

    // Node click
    cy.on('tap', 'node', (evt: EventObject) => {
      const nodeData = evt.target.data('rawNode');
      onSelectNode(nodeData);
    });

    cy.on('tap', (evt: EventObject) => {
      if (evt.target === cy) {
        onSelectNode(null);
      }
    });

    cyRef.current = cy;

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [graphData, yearRange, scopeFilter]);

  // Filter in graph search term
  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    if (!searchTerm.trim()) {
      cy.elements().removeClass('dimmed').removeClass('highlighted');
      return;
    }
    const term = searchTerm.toLowerCase();
    cy.batch(() => {
      cy.nodes().forEach((n) => {
        const label = n.data('label') || '';
        if (label.toLowerCase().includes(term)) {
          n.removeClass('dimmed').addClass('highlighted');
        } else {
          n.removeClass('highlighted').addClass('dimmed');
        }
      });
    });
  }, [searchTerm]);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.2);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit(undefined, 40);

  return (
    <div className="relative w-full h-full min-h-[550px] overflow-hidden bg-neutral-50 rounded-2xl border border-neutral-200 shadow-inner">
      <div ref={containerRef} className="cy-container" />

      {/* Scope Filter Toolbar directly on canvas */}
      <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-200 shadow-sm flex items-center space-x-2 text-xs">
        <span className="text-neutral-400 font-medium text-[11px] flex items-center space-x-1">
          <Layers className="w-3.5 h-3.5" />
          <span>Research Scope:</span>
        </span>
        <div className="flex items-center space-x-1 bg-neutral-100 p-1 rounded-lg">
          {[
            { id: 'core', label: '🟢 Core Only' },
            { id: 'related', label: '🔵 Core + Related' },
            { id: 'all', label: 'Explore Full Network' }
          ].map((scope) => (
            <button
              key={scope.id}
              onClick={() => setScopeFilter(scope.id as any)}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                scopeFilter === scope.id
                  ? 'bg-white text-academic-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {scope.label}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas Floating Controls */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col space-y-1 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-neutral-200 shadow-sm text-neutral-700">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-1.5 hover:bg-neutral-100 rounded text-xs font-semibold"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-1.5 hover:bg-neutral-100 rounded text-xs font-semibold"
        >
          −
        </button>
        <button
          onClick={handleFit}
          title="Fit View"
          className="p-1.5 hover:bg-neutral-100 rounded text-[10px] font-medium"
        >
          FIT
        </button>
      </div>

      {/* Floating Legend */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-neutral-200 shadow-sm text-xs space-y-1 text-neutral-700">
        <div className="font-semibold text-[11px] text-neutral-500 uppercase tracking-wider mb-1">Graph Legend</div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-paper" />
          <span>Paper</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-author" />
          <span>Author</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-institution" />
          <span>Institution</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-topic" />
          <span>Topic</span>
        </div>
      </div>
    </div>
  );
};
