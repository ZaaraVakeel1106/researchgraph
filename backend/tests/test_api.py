import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.graph_service import graph_service
from app.services.openalex_service import openalex_service

def test_graph_building():
    g = graph_service.build_graph_for_topic("Graph Neural Networks", mode="landscape")
    assert len(g["nodes"]) > 0
    assert len(g["edges"]) > 0
    assert "stats" in g
    print(f"Graph test passed: {g['stats']}")

if __name__ == "__main__":
    test_graph_building()
