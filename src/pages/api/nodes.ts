import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface Node {
  _id: string | ObjectId;
  text: string;
  children: Node[];
  parentId: string | null;
  createdAt: Date;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("nodes");

  if (req.method === "GET") {
    try {
      const nodes = (await collection.find({}).toArray()) as Node[];
      const nodeMap = new Map<string, Node>();

      // Create a map of all nodes
      nodes.forEach((node) => {
        node.children = [];
        nodeMap.set(node._id.toString(), node);
      });

      // Build the tree structure
      const rootNodes: Node[] = [];
      nodes.forEach((node) => {
        if (node.parentId) {
          const parent = nodeMap.get(node.parentId);
          if (parent) {
            parent.children.push(node);
          }
        } else {
          rootNodes.push(node);
        }
      });

      res.json(rootNodes);
    } catch (error) {
      res.status(500).json({ error: "Error fetching nodes" });
    }
  } else if (req.method === "POST") {
    try {
      const { text, parentId } = req.body;
      const result = await collection.insertOne({
        text,
        parentId: parentId || null,
        createdAt: new Date(),
      });
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ error: "Error creating node" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
