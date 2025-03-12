import React, { useState, useEffect } from "react";

interface Node {
  _id: string;
  text: string;
  children: Node[];
  parentId: string | null;
}

const PlusIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export default function MindMap() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [newNodeText, setNewNodeText] = useState("");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isAddingBranch, setIsAddingBranch] = useState(false);

  useEffect(() => {
    fetchNodes();
  }, []);

  const fetchNodes = async () => {
    try {
      const response = await fetch("/api/nodes");
      const data = await response.json();
      setNodes(data);
    } catch (error) {
      console.error("Error fetching nodes:", error);
    }
  };

  const addNode = async (isRoot = false) => {
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
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addNode(selectedNode === null);
    }
  };

  const renderNode = (node: Node, level: number = 0) => {
    const isSelected = selectedNode === node._id;

    return (
      <div
        key={node._id}
        style={{ position: "relative", marginBottom: "1rem" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginLeft: `${level * 48}px`,
          }}
        >
          {level > 0 && (
            <div
              style={{
                position: "absolute",
                left: `${level * 48 - 32}px`,
                top: "50%",
                width: "32px",
                height: "1px",
                backgroundColor: "#E5E7EB",
              }}
            />
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              minWidth: "200px",
            }}
          >
            <div
              style={{
                flexGrow: 1,
                padding: "0.75rem",
                borderRadius: "0.5rem",
                cursor: "pointer",
                backgroundColor: isSelected ? "#3B82F6" : "#F3F4F6",
                color: isSelected ? "white" : "black",
              }}
              onClick={() => setSelectedNode(isSelected ? null : node._id)}
            >
              {node.text}
            </div>
            <button
              onClick={() => {
                setSelectedNode(node._id);
                setIsAddingBranch(true);
              }}
              style={{
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                backgroundColor: "#3B82F6",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: "20px",
                fontWeight: "bold",
              }}
              title="Add branch"
            >
              +
            </button>
          </div>
        </div>
        {node.children?.map((child) => renderNode(child, level + 1))}
        {isSelected && isAddingBranch && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginLeft: `${(level + 1) * 48}px`,
              marginTop: "1rem",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: `${(level + 1) * 48 - 32}px`,
                top: "50%",
                width: "32px",
                height: "1px",
                backgroundColor: "#E5E7EB",
              }}
            />
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
                minWidth: "200px",
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
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  backgroundColor: "#22C55E",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "20px",
                }}
                title="Add branch"
              >
                ✓
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          gap: "1rem",
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
          Add Root
        </button>
      </div>
      <div style={{ marginTop: "1rem" }}>
        {nodes.map((node) => node.parentId === null && renderNode(node))}
      </div>
    </div>
  );
}
