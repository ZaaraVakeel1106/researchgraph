import React, { useEffect, useRef, useState } from 'react';
import cytoscape, { Core, EventObject } from 'cytoscape';
import { ResearchGraphData, GraphNode, RelevanceTier } from '../../types';

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

  useEffect(() => {
    if (!containerRef.current || !graphData || !graphData.nodes) return;

    // Scope selection is applied by the API. Keep the layout intact for timeline filtering.
    const cyNodes = graphData.nodes
      .map((n) => {
        const pr = n.metrics?.pagerank || 0.01;
        const size = Math.max(34, Math.min(75, 34 + pr * 300));
        
        let color = '#0f766e'; // paper
        let shape = 'round-rectangle';
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

        const priorNode = cyRef.current?.getElementById(n.id);
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
          },
          ...(priorNode && !priorNode.empty() ? { position: priorNode.position() } : {})
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
        { selector: 'edge[type = "cites"]', style: { 'line-color': '#0f766e', 'target-arrow-color': '#0f766e' } },
        { selector: 'edge[type = "authored"]', style: { 'line-color': '#d97706', 'target-arrow-shape': 'none', 'line-style': 'dashed' } },
        { selector: 'edge[type = "affiliated_with"]', style: { 'line-color': '#6366f1', 'target-arrow-shape': 'none', 'line-style': 'dotted' } },
        { selector: 'edge[type = "has_topic"]', style: { 'line-color': '#e11d48', 'target-arrow-shape': 'none', 'line-style': 'dashed' } },
        { selector: 'edge[type = "related_work"]', style: { 'line-color': '#64748b', 'target-arrow-shape': 'none', 'line-style': 'dotted' } },
        { selector: 'edge[type = "collaborates_with"]', style: { 'line-color': '#d97706', 'target-arrow-shape': 'none', 'line-style': 'dashed' } },
        { selector: 'edge[type = "topic_association"]', style: { 'line-color': '#e11d48', 'target-arrow-shape': 'none', 'line-style': 'dotted' } },
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
        randomize: false,
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
  }, [graphData]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const hiddenPapers = new Set(cy.nodes().filter(n => n.data('type') === 'paper' && n.data('rawNode').year &&
      (n.data('rawNode').year < yearRange[0] || n.data('rawNode').year > yearRange[1])).map(n => n.id()));
    cy.batch(() => {
      cy.nodes().forEach(node => {
        const raw = node.data('rawNode') as GraphNode;
        const outsideYear = raw.type === 'paper' && raw.year !== undefined && (raw.year < yearRange[0] || raw.year > yearRange[1]);
        const nearbyPapers = node.neighborhood().union(node.neighborhood().neighborhood()).filter('node[type = "paper"]');
        const nearbyPaperIds = nearbyPapers.toArray().map((paper) => paper.id());
        const noVisiblePaper = raw.type !== 'paper' && (nearbyPaperIds.length === 0 || nearbyPaperIds.every((id) => hiddenPapers.has(id)));
        node.style('display', outsideYear || noVisiblePaper ? 'none' : 'element');
      });
      cy.edges().forEach(edge => { edge.style('display', hiddenPapers.has(edge.source().id()) || hiddenPapers.has(edge.target().id()) ? 'none' : 'element'); });
    });
  }, [yearRange, graphData]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.elements().removeClass('dimmed').removeClass('highlighted').removeClass('edge-highlighted');
    if (!selectedNodeId) return;
    const selected = cy.getElementById(selectedNodeId);
    if (selected.empty()) return;
    cy.elements().addClass('dimmed');
    selected.closedNeighborhood().removeClass('dimmed').addClass('highlighted');
    selected.connectedEdges().removeClass('dimmed').addClass('edge-highlighted');
  }, [selectedNodeId]);

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
        <div className="text-[10px] text-neutral-500">Citation arrow: citing paper → referenced paper</div>
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
        <div className="border-t pt-1 text-[10px] text-neutral-500">Teal arrows cite; amber links show authorship; blue links show affiliation; rose links show topics.</div>
      </div>
    </div>
  );
};
