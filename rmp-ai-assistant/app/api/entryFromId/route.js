import { Pinecone } from "@pinecone-database/pinecone";
import { getEntryById } from './getEntry'; 


export default async function handler(req, res) {
const { id } = req.query;
if (!id) {
return res.status(400).json({ error: 'ID is required' });
}
const entryData = await getEntryById(id);
if (entryData) {
res.status(200).json(entryData);
} else {
res.status(404).json({ error: 'Entry not found' });
}
}
