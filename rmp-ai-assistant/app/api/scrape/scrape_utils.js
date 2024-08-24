import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import dotenv from "dotenv";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAI } from "openai";

// Load environment variables
dotenv.config();

export async function scrapeProfessorData(professorUrl) {
  try {
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

    const starsTag = $(".RatingValue__Numerator-qw8sqy-2.liyUjw");
    const stars = starsTag.text().trim() || "N/A";

    const reviewTag = $(".Comments__StyledComments-dzzyvm-0.gRjWel");
    const review = reviewTag.text().trim() || "N/A";

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

    // Save to JSON
    const data = {
      professor: professorName,
      subject: subject,
      stars: stars,
      levelOfDifficulty: difficulty,
      takeAgain: takeAgain,
      tags: tags,
      reviews: reviews,
    };
    fs.writeFileSync(
      "reviews.json",
      JSON.stringify({ reviews: [data] }, null, 4)
    );
  } catch (error) {
    console.error(`Error scraping data: ${error.message}`);
  }
}

export async function processAndAddEmbeddings() {
  try {
    // Initialize Pinecone client
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    const index_name = "rag";
    const index = pc.Index(index_name);
    console.log(`Index initialized: ${index_name}`);

    const data = JSON.parse(
      fs.readFileSync("reviews.json", "utf8")
    );
    const reviewData = data.reviews; // Assuming only one professor's data
    console.log("review data", reviewData);
    // Initialize OpenAI
    const openai = new OpenAI();

    const processedData = [];
    console.log("processing data");
    for (const review of reviewData) {
      try {
        console.log("review", typeof review);
        const response = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: review.reviews,
        });
        console.log("response", response);
        console.log("response.data", response.data[0]);
        const embedding = response.data[0].embedding;
        // console.log("embedding", embedding);
        console.log("typeof embedding", typeof embedding);
        console.log("review.professor", review.professor);
        console.log("review.subject", review.subject);
        console.log("review.stars", review.stars);
        console.log("review.levelOfDifficulty", review.levelOfDifficulty);
        console.log("review.takeAgain", review.takeAgain);
        console.log("review.tags", review.tags);
        console.log("review.reviews", review.reviews);

        processedData.push({
          id: review.professor, // Use professor name as ID
          values: embedding,
          metadata: {
            reviews: review.reviews,
            subject: review.subject,
            stars: review.stars,
            levelOfDifficulty: review.levelOfDifficulty,
            takeAgain: review.takeAgain,
            tags: review.tags,
          },
        });
      } catch (error) {
        console.error(
          `Error generating embedding for review "${review}": ${error.message}`
        );
      }
    }
    // console.log('processedData',processedData);
    // console.log("Upserting data:", JSON.stringify(processedData, null, 2));

    // Upsert to Pinecone
    // if (processedData.length > 0) {
    // try {
    await index.namespace("ns1").upsert([
      {
        id: processedData[0].id,
        values: processedData[0].values,
        metadata: processedData[0].metadata
      },
    ]);
    const stats = await index.describeIndexStats();
    console.log("Index stats:", stats);
  } catch (error) {
    console.error(`Error processing and adding embeddings: ${error.message}`);
  }
}
