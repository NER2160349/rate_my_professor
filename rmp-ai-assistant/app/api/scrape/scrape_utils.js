import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAI } from "openai";

// Load environment variables
dotenv.config();

export async function scrapeProfessorData(professorUrl) {
  try {
    // Scrape professor data from RateMyProfessors website
    const response = await axios.get(professorUrl);
    const $ = cheerio.load(response.data);

    const nameDiv = $(".NameTitle__Name-dowf0z-0");
    const firstName = nameDiv.find("span").first().text().trim();
    const lastName = nameDiv
      .find(".NameTitle__LastNameWrapper-dowf0z-2")
      .text()
      .trim();
    const professorName = `${firstName} ${lastName}` || "N/A";

    const subjectTag = $(
      ".TeacherDepartment__StyledDepartmentLink-fl79e8-0.iMmVHb"
    );
    const subject = subjectTag.text().replace("department", "").trim() || "N/A";

    // Extract institution name from <a> tag with href starting with /school/
    const institutionTag = $("a[href^='/school/']").first();
    const institution = institutionTag.text().trim() || "N/A";

    const starsTag = $(".RatingValue__Numerator-qw8sqy-2.liyUjw");
    const stars = starsTag.text().trim() || "N/A";

    const feedbackItems = $(
      ".FeedbackItem__StyledFeedbackItem-uof32n-0.dTFbKx"
    );
    const difficulty =
      feedbackItems
        .eq(1)
        .find(".FeedbackItem__FeedbackNumber-uof32n-1.kkESWs")
        .text()
        .trim() || "N/A";
    const takeAgain =
      feedbackItems
        .eq(0)
        .find(".FeedbackItem__FeedbackNumber-uof32n-1.kkESWs")
        .text()
        .trim() || "N/A";

    const tags = [];
    $(".TeacherTags__TagsContainer-sc-16vmh1y-0.dbxJaW span").each(
      (i, elem) => {
        tags.push($(elem).text().trim());
      }
    );

    const reviews = [];
    $(".RatingsList__RatingsUL-hn9one-0.cbdtns li").each((i, elem) => {
      const reviewText = $(elem)
        .find(".Comments__StyledComments-dzzyvm-0.gRjWel")
        .text()
        .trim();
      if (reviewText) {
        reviews.push(reviewText);
      }
    });

    // Return the data instead of saving it to a file
    return {
      professor: professorName,
      institution: institution,
      subject: subject,
      stars: stars,
      levelOfDifficulty: difficulty,
      takeAgain: takeAgain,
      tags: tags,
      reviews: reviews,
    };
  } catch (error) {
    console.error(`Error scraping data: ${error.message}`);
    throw error;
  }
}

export async function processProfessorEmbeddings(scrapedData) {
  try {
    // Initialize Pinecone client
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    const index_name = "rag";
    const index = pc.Index(index_name);
    console.log(`Index initialized: ${index_name}`);

    // Initialize OpenAI
    const openai = new OpenAI();

    const processedData = [];
    console.log("Scraped data:", scrapedData);
    // Create embedding for the scraped reviews
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: scrapedData.reviews,
    });
    const embedding = response.data[0].embedding;

    processedData.push({
      id: scrapedData.professor, // Use professor name as ID
      values: embedding,
      metadata: {
        institution: scrapedData.institution,
        reviews: scrapedData.reviews,
        subject: scrapedData.subject,
        stars: scrapedData.stars,
        levelOfDifficulty: scrapedData.levelOfDifficulty,
        takeAgain: scrapedData.takeAgain,
        tags: scrapedData.tags,
      },
    });

    // Upsert the data into Pinecone
    await index.namespace("ns1").upsert(processedData);

    // Get index stats to verify the embeddings were added
    const stats = await index.describeIndexStats();
    console.log("Index stats:", stats);
  } catch (error) {
    console.error(`Error processing and adding embeddings: ${error.message}`);
    throw error;
  }
}
