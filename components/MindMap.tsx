import React, { useState, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

interface Node {
  _id: string;
  text: string;
  children: Node[];
  parentId: string | null;
  createdAt: string;
}

const DeleteIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
  >
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
);

type LayoutType = "horizontal" | "vertical";

export default function MindMap() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [newNodeText, setNewNodeText] = useState("");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [layout, setLayout] = useState<LayoutType>("vertical");

  useEffect(() => {
    fetchNodes();
  }, []);

  const fetchNodes = async () => {
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

  const deleteNode = async (nodeId: string) => {
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
  };

  const moveNode = async (nodeId: string, newParentId: string | null) => {
    try {
      const response = await fetch(`/api/nodes/${nodeId}/move`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newParentId,
        }),
      });

      if (response.ok) {
        fetchNodes();
      }
    } catch (error) {
      console.error("Error moving node:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addNode(selectedNode === null);
    }
  };

  const NodeComponent = ({ node, level }: { node: Node; level: number }) => {
    const isSelected = selectedNode === node._id;

    const [{ isDragging }, drag] = useDrag({
      type: "NODE",
      item: { id: node._id, parentId: node.parentId },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    const [{ isOver }, drop] = useDrop({
      accept: "NODE",
      drop: (item: { id: string; parentId: string | null }) => {
        if (item.id !== node._id && item.parentId !== node._id) {
          moveNode(item.id, node._id);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    });

    const isVertical = layout === "vertical";
    const spacing = isVertical ? 80 : 48;

    // Sort children by creation time
    const sortedChildren = [...(node.children || [])].sort(
      (a, b) =>
        // Always sort so child nodes appear above parent nodes (newer first)
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return (
      <div
        key={node._id}
        ref={(el) => {
          drag(el);
          drop(el);
        }}
        style={{
          position: "relative",
          marginBottom: isVertical ? "2rem" : "1rem",
          marginRight: isVertical ? "1.5rem" : "0",
          opacity: isDragging ? 0.5 : 1,
          cursor: "move",
          display: isVertical ? "inline-block" : "block",
          verticalAlign: "top",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginLeft: isVertical ? "0" : `${level * spacing}px`,
            marginTop: isVertical ? `${level * spacing}px` : "0",
            position: "relative",
          }}
        >
          {level > 0 && isVertical && (
            <>
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: `-${spacing / 2}px`,
                  width: "2px",
                  height: `${spacing / 2 - 12}px`,
                  transform: "translateX(-50%)",
                  backgroundColor: "#64748b",
                  zIndex: 1,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "-12px",
                  width: "0",
                  height: "0",
                  transform: "translateX(-50%)",
                  borderLeft: "8px solid transparent",
                  borderRight: "8px solid transparent",
                  borderBottom: "12px solid #64748b",
                  zIndex: 1,
                }}
              />
            </>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              minWidth: "200px",
              border: isOver ? "2px dashed #3B82F6" : "none",
              borderRadius: "0.5rem",
              padding: isOver ? "2px" : "0",
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
              background: isSelected ? "#3B82F6" : "#F3F4F6",
              zIndex: 2,
            }}
          >
            <div
              style={{
                flexGrow: 1,
                padding: "0.75rem",
                borderRadius: "0.5rem",
                cursor: "pointer",
                color: isSelected ? "white" : "black",
              }}
              onClick={() => setSelectedNode(isSelected ? null : node._id)}
            >
              {node.text}
            </div>
            <div
              style={{ display: "flex", gap: "0.5rem", padding: "0 0.5rem" }}
            >
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
                  backgroundColor: isSelected ? "#60a5fa" : "#3B82F6",
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
              <button
                onClick={() => deleteNode(node._id)}
                style={{
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  backgroundColor: "#EF4444",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
                title="Delete node"
              >
                <DeleteIcon />
              </button>
            </div>
          </div>
        </div>
        <div
          style={{
            display: isVertical ? "flex" : "block",
            gap: "1.5rem",
            marginLeft: isVertical ? "0" : "0",
            position: "relative",
          }}
        >
          {sortedChildren.map((child) => (
            <NodeComponent key={child._id} node={child} level={level + 1} />
          ))}
        </div>
        {isSelected && isAddingBranch && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginLeft: isVertical ? "0" : `${(level + 1) * spacing}px`,
              marginTop: isVertical ? `${(level + 1) * spacing}px` : "1rem",
              position: "relative",
            }}
          >
            {isVertical && (
              <>
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: `-${spacing / 2}px`,
                    width: "2px",
                    height: `${spacing / 2 - 12}px`,
                    transform: "translateX(-50%)",
                    backgroundColor: "#64748b",
                    zIndex: 1,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "-12px",
                    width: "0",
                    height: "0",
                    transform: "translateX(-50%)",
                    borderLeft: "8px solid transparent",
                    borderRight: "8px solid transparent",
                    borderBottom: "12px solid #64748b",
                    zIndex: 1,
                  }}
                />
              </>
            )}
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
                minWidth: "200px",
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
                borderRadius: "0.5rem",
                padding: "0.25rem",
                background: "#FFFFFF",
                zIndex: 2,
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
    <DndProvider backend={HTML5Backend}>
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
          <button
            onClick={() =>
              setLayout(layout === "horizontal" ? "vertical" : "horizontal")
            }
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#F3F4F6",
              color: "#374151",
              borderRadius: "0.5rem",
              border: "1px solid #E5E7EB",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
            title="Toggle layout"
          >
            {layout === "horizontal"
              ? "Switch to Tree View"
              : "Switch to Horizontal View"}
          </button>
        </div>
        <div
          className="mindmap-container"
          style={{
            minHeight: layout === "vertical" ? "calc(100vh - 100px)" : "auto",
            display: layout === "vertical" ? "flex" : "block",
            flexDirection: layout === "vertical" ? "column-reverse" : "column",
            justifyContent: "flex-start",
            alignItems: "center",
            paddingBottom: layout === "vertical" ? "2rem" : "0",
          }}
        >
          {nodes
            .filter((node) => node.parentId === null)
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .map((node) => (
              <NodeComponent key={node._id} node={node} level={0} />
            ))}
        </div>
      </div>
    </DndProvider>
  );
}
