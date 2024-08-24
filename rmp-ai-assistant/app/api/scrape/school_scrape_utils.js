import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAI } from "openai";

// Load environment variables
dotenv.config();

export async function scrapeSchoolData(schoolUrl) {
  try {
    // Send a GET request to the school's page
    const response = await axios.get(schoolUrl);
    const $ = cheerio.load(response.data);
    console.log(`Scraping data from URL: ${schoolUrl}`);

    // Extract school name
    const schoolNameTag = $(
      "div.HeaderDescription__StyledTitleName-sc-1lt205f-1.eNxccF"
    );
    console.log("schoolNameTag: ", schoolNameTag.text());
    const schoolName = schoolNameTag.text().trim() || "N/A";
    console.log("schoolName: ", schoolName);

    // Extract institute location
    const instituteLocationTag = $(
      "span.HeaderDescription__StyledCityState-sc-1lt205f-2.cyDJfW"
    );
    console.log("instituteLocationTag: ", instituteLocationTag.text());
    const instituteLocation = instituteLocationTag.text().trim() || "N/A";
    console.log("instituteLocation: ", instituteLocation);

    // Extract overall quality
    const overallQualityTag = $("div.OverallRating__Number-y66epv-3.dXoyqn");
    console.log("overallQualityTag: ", overallQualityTag.text());
    const overallQuality = overallQualityTag.text().trim() || "N/A";
    console.log("overallQuality: ", overallQuality);

    // Find all div elements with the specified class
    const ratingsTag = $(
      "div.SchoolSummary__SchoolSummaryContainer-pz83zp-1.kYvWmU"
    );

    // Initialize an object to store the ratings
    const ratingsDict = {};

    // Find all category containers
    const categories = ratingsTag.find(
      "div.CategoryGrade__CategoryGradeContainer-sc-17vzv7e-0"
    );

    // Iterate through each category and extract the title and corresponding rating
    categories.each((i, category) => {
      const title = $(category)
        .find("div.CategoryGrade__CategoryTitle-sc-17vzv7e-1")
        .text()
        .trim();
      const rating = $(category)
        .find('div[class^="GradeSquare__ColoredSquare-sc-6d97x2-0"]')
        .text()
        .trim();
      ratingsDict[title.toLowerCase()] = rating;
    });
    console.log("ratingsDict: ", ratingsDict);
    // Extract ratings for each category, defaulting to 'N/A' if not found
    const reputation = ratingsDict["reputation"] || "N/A";
    const happiness = ratingsDict["happiness"] || "N/A";
    const facilities = ratingsDict["facilities"] || "N/A";
    const safety = ratingsDict["safety"] || "N/A";
    const opportunities = ratingsDict["opportunities"] || "N/A";
    const clubs = ratingsDict["clubs"] || "N/A";
    const social = ratingsDict["social"] || "N/A";
    const internet = ratingsDict["internet"] || "N/A";
    const location = ratingsDict["location"] || "N/A";
    const food = ratingsDict["food"] || "N/A";

    // Extract reviews
    const reviews = [];
    $("ul.SchoolRatingsList__ListContainer-sc-1tg2phb-0.jSdWoM").each(
      (i, list) => {
        $("li", list).each((i, item) => {
          const reviewText = $(
            "div.SchoolRating__RatingComment-sb9dsm-6.eNyCKI",
            item
          )
            .text()
            .trim();
          if (reviewText) {
            reviews.push(reviewText);
          }
        });
      }
    );

    // Return the scraped data
    return {
      school: schoolName,
      location: instituteLocation,
      overallQuality: overallQuality,
      reputation: ratingsDict["reputation"],
      happiness: ratingsDict["happiness"],
      facilities: ratingsDict["facilities"],
      safety: ratingsDict["safety"],
      opportunities: ratingsDict["opportunities"],
      clubs: ratingsDict["clubs"],
      social: ratingsDict["social"],
      internet: ratingsDict["internet"],
      location: ratingsDict["location"],
      food: ratingsDict["food"],
      reviews: reviews,
    };
  } catch (error) {
    console.error(`Error scraping data: ${error.message}`);
    throw error;
  }
}

export async function processSchoolEmbeddings(scrapedData) {
  try {
    // Initialize Pinecone client
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    const index_name = "rag";
    const index = pc.Index(index_name);
    console.log(`Index initialized: ${index_name}`);

    // Initialize OpenAI client
    const openai = new OpenAI();

    const processedData = [];
    console.log("Scraped data:", scrapedData);
    // Create embeddings for each review
    for (const review of scrapedData.reviews) {
      try {
        const response = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: scrapedData.reviews,
        });
        const embedding = response.data[0].embedding;

        processedData.push({
          id: scrapedData.school, // Use a unique ID for each review
          values: embedding,
          metadata: {
            overallQuality: scrapedData.overallQuality,
            location: scrapedData.location,
            reputation: scrapedData.reputation,
            happiness: scrapedData.happiness,
            facilities: scrapedData.facilities,
            safety: scrapedData.safety,
            opportunities: scrapedData.opportunities,
            clubs: scrapedData.clubs,
            social: scrapedData.social,
            internet: scrapedData.internet,
            locationRating: scrapedData.location,
            food: scrapedData.food,
            review: scrapedData.reviews,
          },
        });
      } catch (error) {
        console.error(
          `Error generating embedding for review "${review}": ${error.message}`
        );
      }
    }

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
