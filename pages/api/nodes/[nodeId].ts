import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("nodes");
  const { nodeId } = req.query;

  if (!nodeId || typeof nodeId !== "string") {
    return res.status(400).json({ error: "Invalid node ID" });
  }

  if (req.method === "DELETE") {
    try {
      // First, recursively get all child nodes
      const getAllChildIds = async (parentId: string): Promise<string[]> => {
        const children = await collection.find({ parentId }).toArray();

        const childIds = children.map((child) => child._id.toString());
        const descendantIds = await Promise.all(
          childIds.map((id) => getAllChildIds(id))
        );

        return [...childIds, ...descendantIds.flat()];
      };

      const childIds = await getAllChildIds(nodeId);
      const idsToDelete = [nodeId, ...childIds];

      // Delete the node and all its descendants
      await collection.deleteMany({
        _id: { $in: idsToDelete.map((id) => new ObjectId(id)) },
      });

      res
        .status(200)
        .json({ message: "Node and its children deleted successfully" });
    } catch (error) {
      console.error("Error deleting node:", error);
      res.status(500).json({ error: "Error deleting node" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
