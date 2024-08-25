import { Pinecone } from "@pinecone-database/pinecone";

const indexName = "rag";
const namespace = "ns1";

export async function getEntryById(id) {
  try {
    // Initialize Pinecone client
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    const index = pc.Index(indexName);
    // Fetch the entry by its ID
    console.log("id", id);
    const fetchResult = await index.namespace(namespace).fetch([id]);
    console.log("fetchResult", fetchResult);
    return fetchResult;
  } catch (error) {
    console.error("Error fetching entry from Pinecone:", error);
    return null;
  }
}
