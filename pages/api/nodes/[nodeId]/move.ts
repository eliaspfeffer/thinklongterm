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
  const { nodeId } = req.query;
  const { newParentId } = req.body;

  if (!nodeId || typeof nodeId !== "string") {
    return res.status(400).json({ error: "Invalid node ID" });
  }

  if (req.method === "PATCH") {
    try {
      // Check if the new parent exists (if not null)
      if (newParentId) {
        const parentExists = await collection.findOne({
          _id: new ObjectId(newParentId),
        });
        if (!parentExists) {
          return res.status(400).json({ error: "Parent node not found" });
        }
      }

      // Check for circular references
      const isCircular = async (
        currentId: string,
        targetParentId: string
      ): Promise<boolean> => {
        if (currentId === targetParentId) return true;

        const node = (await collection.findOne({
          _id: new ObjectId(targetParentId),
        })) as Node | null;

        if (!node || !node.parentId) return false;

        return isCircular(currentId, node.parentId);
      };

      if (newParentId && (await isCircular(nodeId, newParentId))) {
        return res
          .status(400)
          .json({ error: "Cannot create circular reference" });
      }

      // Update the node's parent
      await collection.updateOne(
        { _id: new ObjectId(nodeId) },
        { $set: { parentId: newParentId } }
      );

      res.status(200).json({ message: "Node moved successfully" });
    } catch (error) {
      console.error("Error moving node:", error);
      res.status(500).json({ error: "Error moving node" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
