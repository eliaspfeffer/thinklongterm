import React, { useState, useEffect, useCallback } from "react";
import Tree from "react-d3-tree";
import { useCenteredTree } from "../hooks/useCenteredTree";
import { ObjectId } from "mongodb";

interface Node {
  _id: string | ObjectId;
  text: string;
  children: Node[];
  parentId: string | null;
  createdAt: string;
}

interface D3Node {
  name: string;
  attributes: {
    id: string;
    createdAt: string;
  };
  children?: D3Node[];
}

const DeleteIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
  >
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
);

const TreeVisualizer: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [newNodeText, setNewNodeText] = useState("");
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const { containerRef, translate, dimensions } = useCenteredTree();

  // Fetch nodes from API
  const fetchNodes = useCallback(async () => {
    try {
      const response = await fetch("/api/nodes");
      const data = await response.json();

      // Sort nodes by creation time (newest first)
      const sortedData = [...data].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setNodes(sortedData);
    } catch (error) {
      console.error("Error fetching nodes:", error);
    }
  }, []);

  // Add a new node
  const addNode = useCallback(
    async (isRoot = false) => {
      if (!newNodeText) return;

      try {
        const response = await fetch("/api/nodes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: newNodeText,
            parentId: isRoot ? null : selectedNode,
          }),
        });

        if (response.ok) {
          setNewNodeText("");
          if (!isRoot) {
            setIsAddingBranch(false);
          }
          fetchNodes();
        }
      } catch (error) {
        console.error("Error adding node:", error);
      }
    },
    [newNodeText, selectedNode, fetchNodes]
  );

  // Delete a node
  const deleteNode = useCallback(
    async (nodeId: string) => {
      try {
        const response = await fetch(`/api/nodes/${nodeId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          if (selectedNode === nodeId) {
            setSelectedNode(null);
          }
          fetchNodes();
        }
      } catch (error) {
        console.error("Error deleting node:", error);
      }
    },
    [selectedNode, fetchNodes]
  );

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addNode(selectedNode === null);
    }
  };

  // Convert nodes to react-d3-tree format
  const convertToTreeData = (nodes: Node[]): D3Node[] => {
    // Sicherstellen, dass alle IDs als Strings behandelt werden
    const normalizedNodes = nodes.map((node) => ({
      ...node,
      _id: node._id.toString(),
      parentId: node.parentId ? node.parentId.toString() : null,
    }));

    // Root-Nodes filtern
    const rootNodes = normalizedNodes.filter((node) => !node.parentId);

    console.log("Normalisierte Nodes:", normalizedNodes);
    console.log("Root Nodes nach Normalisierung:", rootNodes);

    const mapNode = (node: any): D3Node => {
      // Alle Kinder dieses Nodes finden, mit String-ID-Vergleich
      const childNodes = normalizedNodes.filter(
        (n) => n.parentId === node._id.toString()
      );

      console.log(
        `Für Node ${node.text} (${node._id}) gefundene Kinder:`,
        childNodes.map((c) => `${c.text} (${c._id})`)
      );

      return {
        name: node.text,
        attributes: {
          id: node._id.toString(),
          createdAt: node.createdAt,
        },
        children: childNodes.length > 0 ? childNodes.map(mapNode) : [],
      };
    };

    return rootNodes.map(mapNode);
  };

  // Custom node component for react-d3-tree
  const renderCustomNode = ({ nodeDatum, toggleNode }: any) => {
    const isSelected = selectedNode === nodeDatum.attributes.id;

    return (
      <g>
        <rect
          width="200"
          height="40"
          x="-100"
          y="-20"
          rx="5"
          fill={isSelected ? "#3B82F6" : "#F3F4F6"}
          stroke={isSelected ? "#2563EB" : "#D1D5DB"}
          strokeWidth="1.5"
          filter="drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.1))"
          onClick={() =>
            setSelectedNode(isSelected ? null : nodeDatum.attributes.id)
          }
        />
        <text
          x="0"
          y="5"
          textAnchor="middle"
          fill={isSelected ? "white" : "black"}
          style={{ fontSize: "14px", fontWeight: "500" }}
          onClick={() =>
            setSelectedNode(isSelected ? null : nodeDatum.attributes.id)
          }
        >
          {nodeDatum.name}
        </text>

        {/* Add button */}
        <circle
          r="12"
          cx="75"
          cy="0"
          fill="#3B82F6"
          onClick={() => {
            setSelectedNode(nodeDatum.attributes.id);
            setIsAddingBranch(true);
          }}
        />
        <text
          x="75"
          y="4"
          textAnchor="middle"
          fill="white"
          style={{ fontSize: "16px", fontWeight: "bold" }}
          onClick={() => {
            setSelectedNode(nodeDatum.attributes.id);
            setIsAddingBranch(true);
          }}
        >
          +
        </text>

        {/* Delete button */}
        <circle
          r="12"
          cx="105"
          cy="0"
          fill="#EF4444"
          onClick={() => deleteNode(nodeDatum.attributes.id)}
        />
        <foreignObject
          width="24"
          height="24"
          x="93"
          y="-12"
          onClick={() => deleteNode(nodeDatum.attributes.id)}
        >
          <div
            style={{
              color: "white",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <DeleteIcon />
          </div>
        </foreignObject>
      </g>
    );
  };

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  const treeData = convertToTreeData(nodes);

  // Debug: Zeige die gefundenen Nodes in der Konsole an
  useEffect(() => {
    if (nodes.length > 0) {
      console.log("Alle Nodes:", nodes);
      console.log(
        "Root Nodes:",
        nodes.filter((node) => !node.parentId)
      );
      console.log("Tree Data:", treeData);
    }
  }, [nodes, treeData]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <div
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          position: "sticky",
          top: 0,
          backgroundColor: "white",
          zIndex: 10,
          padding: "1rem 0",
        }}
      >
        <input
          type="text"
          value={newNodeText}
          onChange={(e) => setNewNodeText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add a root thought..."
          style={{
            flexGrow: 1,
            padding: "0.5rem",
            borderRadius: "0.5rem",
            border: "1px solid #E5E7EB",
            outline: "none",
          }}
        />
        <button
          onClick={() => addNode(true)}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#3B82F6",
            color: "white",
            borderRadius: "0.5rem",
            border: "none",
            cursor: "pointer",
          }}
        >
          Add Root Node
        </button>
      </div>

      {/* Form for adding a branch when a node is selected */}
      {selectedNode && isAddingBranch && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            backgroundColor: "white",
            padding: "1rem",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            width: "500px",
            maxWidth: "90%",
          }}
        >
          <input
            type="text"
            value={newNodeText}
            onChange={(e) => setNewNodeText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="New branch..."
            style={{
              flexGrow: 1,
              padding: "0.5rem",
              borderRadius: "0.5rem",
              border: "1px solid #E5E7EB",
              outline: "none",
            }}
            autoFocus
          />
          <button
            onClick={() => addNode(false)}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#22C55E",
              color: "white",
              borderRadius: "0.5rem",
              border: "none",
              cursor: "pointer",
            }}
          >
            Add
          </button>
          <button
            onClick={() => setIsAddingBranch(false)}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#F3F4F6",
              color: "#374151",
              borderRadius: "0.5rem",
              border: "1px solid #E5E7EB",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Tree container */}
      <div
        style={{ width: "100%", height: "calc(100vh - 100px)" }}
        ref={containerRef}
      >
        {treeData.length > 0 ? (
          treeData.length === 1 ? (
            <Tree
              data={treeData[0]}
              translate={translate}
              orientation="vertical"
              renderCustomNodeElement={renderCustomNode}
              pathFunc="elbow"
              pathClassFunc={() => "tree-link"}
              separation={{ siblings: 2, nonSiblings: 2.5 }}
              zoom={0.8}
              nodeSize={{ x: 250, y: 100 }}
              enableLegacyTransitions={true}
              transitionDuration={800}
              rootNodeClassName="tree-root-node"
              branchNodeClassName="tree-branch-node"
              leafNodeClassName="tree-leaf-node"
            />
          ) : (
            <Tree
              data={{
                name: "",
                attributes: { id: "root", createdAt: "" },
                children: treeData,
              }}
              translate={translate}
              orientation="vertical"
              renderCustomNodeElement={renderCustomNode}
              pathFunc="elbow"
              pathClassFunc={() => "tree-link"}
              separation={{ siblings: 2, nonSiblings: 2.5 }}
              zoom={0.8}
              nodeSize={{ x: 250, y: 100 }}
              enableLegacyTransitions={true}
              transitionDuration={800}
              initialDepth={1}
              rootNodeClassName="tree-root-node"
              branchNodeClassName="tree-branch-node"
              leafNodeClassName="tree-leaf-node"
            />
          )
        ) : (
          <div
            style={{
              textAlign: "center",
              paddingTop: "100px",
              color: "#6B7280",
            }}
          >
            Keine Daten vorhanden. Erstelle einen Root-Node, um zu beginnen.
          </div>
        )}
      </div>

      {/* CSS für die Baum-Linien */}
      <style jsx global>{`
        .tree-link {
          stroke: #64748b;
          stroke-width: 2px;
        }
        .tree-root-node,
        .tree-branch-node,
        .tree-leaf-node {
          stroke-width: 0;
        }
      `}</style>
    </div>
  );
};

export default TreeVisualizer;
