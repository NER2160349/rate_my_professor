import { NextResponse } from 'next/server';
import { scrapeProfessorData, processAndAddEmbeddings } from './scrape_utils'; // Import the functions from a utility file

export async function POST(request) {
  try {
    const { professorUrl } = await request.json();

    // Validate the URL
    if (!professorUrl.includes('ratemyprofessors.com/professor')) {
      return NextResponse.json({ success: false, error: 'Invalid professor URL provided' }, { status: 400 });
    }

    // Scrape the professor data
    await scrapeProfessorData(professorUrl);

    // Process and add embeddings to Pinecone
    await processAndAddEmbeddings();

    return NextResponse.json({ success: true, message: 'Data scraped and embeddings added successfully' }, { status: 200 });

  } catch (error) {
    console.error(`Error: ${error.message}`);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}