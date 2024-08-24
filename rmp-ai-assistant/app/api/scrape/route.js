import { NextResponse } from "next/server";
import {
  scrapeProfessorData,
  processProfessorEmbeddings,
} from "./scrape_utils";
import {
  scrapeSchoolData,
  processSchoolEmbeddings,
} from "./school_scrape_utils";

export async function POST(request) {
  try {
    const { professorUrl } = await request.json();
    console.log(
      `Received request to scrape professor data from URL: ${professorUrl}`
    );
    // Validate the URL
    if (professorUrl.includes("ratemyprofessors.com/school")) {
      // Scrape the school data
      const scrapedData = await scrapeSchoolData(professorUrl);

      // Process and add embeddings to Pinecone
      await processSchoolEmbeddings(scrapedData);

      return NextResponse.json(
        {
          success: true,
          message: "School data scraped and embeddings added successfully",
        },
        { status: 200 }
      );
    } else if (professorUrl.includes("ratemyprofessors.com/professor")) {
      // Scrape the professor data
      const scrapedData = await scrapeProfessorData(professorUrl);

      // Process and add embeddings to Pinecone
      await processProfessorEmbeddings(scrapedData);

      return NextResponse.json(
        {
          success: true,
          message: "Professor data scraped and embeddings added successfully",
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid URL provided" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
