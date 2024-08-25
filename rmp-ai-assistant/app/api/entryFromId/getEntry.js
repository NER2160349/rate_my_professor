import pinecone from '@pinecone-database/pinecone';

const indexName = 'rag';
const namespace = 'ns1';

/*function extractProfessorNames(response) {
    const regex = /(?:The professors who teach \w+ are : )([\w\s,]+)\./i;
    const match = response.match(regex);
    if (match && match[1]) {
    const id = match[1].split(',').map(name => name.trim());
    return id;
    }
    return [];
    }*/


export async function getEntryById(id) {
try {
// Fetch the entry by its ID
const response = await pinecone.Index(indexName).fetch({
ids: [id],
namespace: namespace,
});
// Check if the entry exists
if (response && response.vectors && response.vectors.length > 0) {
const entry = response.vectors[0];
// Extract the metadata for front-end display
const metadata = entry.metadata;
return { id: entry.id, metadata: metadata };
} else {
// Handle the case where the entry is not found
console.error('Entry not found');
return null;
}
} catch (error) {
console.error('Error fetching entry from Pinecone:', error);
return null;
}
}

/*async function getProfessorsByName(names, index) {
    const professorData = [];
    for (const name of names) {
    const result = await index.query({
    filter: {
    "name": name,
    },
    includeMetadata: true,
    });
     if (result && result.matches && result.matches.length > 0) {
    professorData.push(result.matches[0].metadata);
    }
    }
    return professorData;
 }*/


    