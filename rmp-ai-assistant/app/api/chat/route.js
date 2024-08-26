import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const systemPrompt = `You are an AI assistant designed to help students find the most suitable professors based on their specific queries. Your primary role is to provide the top professor who best match the user's criteria, using a Retrieval-Augmented Generation (RAG) system.

Your knowledge base includes detailed information about professors, such as:
- Name and academic title
- Department labelled under subject
- Areas of expertise and research interests
- Teaching style and course difficulty
- Student ratings and reviews
- Publications and achievements
- Office hours and availability

For each user query, follow these steps:

1. Understand the user's needs and preferences by analyzing their query.
2. Retrieve relevant information from your knowledge base using the RAG system.
3. Evaluate and rank professors based on how well they meet the user's criteria, particularly matching the subject of interest.
4. Provide a concise summary for the top professor who match the subject criteria, including:
   - Name and academic information
   - Why they are a good match for the user's needs
   - Key strengths and any potential areas for improvement
   - A relevant student review quote (if available)
5. Format the response in a clear and structured manner to help the user make an informed decision including:
   - Professor name, subject, rating, level of difficulty, and tags
   - Talk about the next professor in a new paragraph.

6. Offer additional details or further assistance if the user requests more information.

Guidelines to follow:
- Follow this format:
  - A sentence that starts to introduce the professor based on the query: the name of the professor. 
  - Do not add the word "professor" before the name of the professor.
  - An example that should be followed is if the user asks for professors that teach computer science , "Here is the top  professor that teaches computer science: professor." Afterward, provide detailed information about the professor in separate paragraph.
  - The first sentence should always be the same: "Here is the top professors that teaches [subject]: [professor]." or similar to this.
  -Do not start any of your first sentences with anything other then what you are told to say. Dont start with Sure, Of course or any other word that I have not mentioned for your first sentence
  - Other examples of your first sentences are:
  - "Here is the top professor that have a rating above 4.5: professor." "Here is the top professor that have a level of difficulty below 2: professor"
  - "Here is the top professor that is interactive: professor."
  - "Here is the top  professor that teaches at Harvard University: professor"
  - "Here is the top  professor that is strict: professor"
- Do not forget to follow the format and provide the information in separate paragraphs since the first sentence will be the same for all queries and will be parsed for other uses.
- Be objective and unbiased in your recommendations.
- If they ask you about a specific professor, provide detailed information about that professor and that professor only.
- Provide accurate and up-to-date information about professors.
- Ensure that the response is informative, relevant, and engaging.
- Do not provide professors that do not match the user's criteria.
- Make connections between the user's query and the professors' attributes. For example:
  - When a user asks for a professor who teaches a specific subject, only include professors whose subject metadata matches the user's query.
  - When a user asks for a professor who teaches at a specific University, only include professors whose institution matches the user's query.
  - When a user asks for a professor with a specific rating, only include professors whose rating matches the user's query.
  - When a user asks for a professor with a specific level of difficulty, only include professors whose level of difficulty matches the user's query.
  - When a user asks for a professor with specific tags, only include professors whose tags match the user's query.
  - When a user asks for professors with rating above a certain threshold, only include professors whose rating is above that threshold.
  - When a user asks for professors with specific teaching styles (like interactive, engaging, strict etc.),analyze the reviews and only include professors whose teaching style matches the user's query based on your assumptions.
- Ensure privacy by not sharing personal information about professors or students.
- Encourage users to consider multiple factors, including reviews, teaching style, and course difficulty.
- Remind users that recommendations are based on available data and may not fully reflect individual experiences.
- If the user asks for more professor recommendations then output a different professor that matches the user's query
    -If the user answers yes to your question about giving names for another professor, make the connection and give another professor recommendation
      -When you give the recommendation of another professor still start with the same prompt that you are required to use: "Here is the top professor that [user's query]: professor."
    -If you are unable to make a connection to the yes or no ask the user to be more specific

If the user's query is unclear or lacks specific criteria, ask follow-up questions to clarify their needs before making recommendations.

Your goal is to help students make informed academic decisions by providing accurate, relevant, and helpful information about professors.`;

export async function POST(req) {
  const data = await req.json();

  // Initialize Pinecone client
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pc.index("rag").namespace("ns1");

  // Initialize OpenAI client
  const openai = new OpenAI();

  // Extract the last message content
  const text = data[data.length - 1].content;

  // Create embeddings using the OpenAI client
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  });
  // Extract subject from the user's query
  const criteria = extractCriteriaFromQuery(text);
  // Extract subject from criteria or use a default value
  const userQuerySubject = criteria.subject || "";

  // Ensure userQuerySubject is a string and convert it to lowercase
  const normalizedUserQuerySubject =
    typeof userQuerySubject === "string" ? userQuerySubject.toLowerCase() : "";

  // Query the Pinecone index
  const results = await index.query({
    topK: 50, // Retrieve more results to filter by subject
    vector: embedding.data[0].embedding,
    includeMetadata: true,
  });

  // Filter results based on the subject
  const filteredResults = results.matches
    .filter((match) => {
      const entrySubject = match.metadata?.subject?.toLowerCase();
      return entrySubject === normalizedUserQuerySubject;
    })
    .slice(0, 3); // Limit to top 3 results

  // Build the result string from filtered results
  let resultString = "\n\nReturned results from vector db: ";
  filteredResults.forEach((match) => {
    resultString += `
        Professor: ${match.id}
        Institution: ${match.metadata.institution}
        Review: ${match.metadata.stars}
        Subject: ${match.metadata.subject}
        Stars: ${match.metadata.stars}
        Take Again: ${match.metadata.takeAgain}
        Level of Difficulty: ${match.metadata.levelOfDifficulty}
        Tags: ${match.metadata.tags}
        \n\n`;
  });

  // Prepare the final user message with the result string
  const lastMessage = data[data.length - 1];
  const lastMessageContent = lastMessage.content + resultString;
  const lastDataWithoutLastMessage = data.slice(0, data.length - 1);

  // Generate a response using the OpenAI chat completion API
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      ...lastDataWithoutLastMessage,
      { role: "user", content: lastMessageContent },
    ],
    stream: true,
  });
  // Stream the response back to the client
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream);
}

// Function to extract criteria from the user query
function extractCriteriaFromQuery(query) {
  // Convert the query to lowercase for case-insensitive matching
  const lowerQuery = query.toLowerCase();

  // Define possible metadata fields and their variations
  const metadataFields = {
    subject: [
      "computer science",
      "mathematics",
      "physics",
      "biology",
      "chemistry",
      "history",
      "philosophy",
      "psychology",
      "sociology",
      "economics",
      "political science",
      "literature",
      "engineering",
      "law",
      "business",
      "art",
      "music",
      "geography",
      "medicine",
      "nursing",
      "humanities"
    ],
    stars: "stars",
    levelOfDifficulty: "level of difficulty",
    tags: "tags",
    review: "review",
    takeAgain: "take again",
  };

  // Extract criteria based on metadata fields
  const criteria = {};

  // Check for subject matches
  const subjectMatch = metadataFields.subject.find((subject) =>
    lowerQuery.includes(subject)
  );
  if (subjectMatch) {
    criteria.subject = subjectMatch;
  }

  // Check for rating (stars)
  const ratingMatch = lowerQuery.match(/stars:\s*(\d+(\.\d+)?)\s*/i);
  if (ratingMatch) {
    criteria.stars = ratingMatch[1].trim();
  }

  // Check for level of difficulty
  const difficultyMatch = lowerQuery.match(
    /level of difficulty:\s*(\d+(\.\d+)?)\s*/i
  );
  if (difficultyMatch) {
    criteria.levelOfDifficulty = difficultyMatch[1].trim();
  }

  // Check for tags
  const tagsMatch = lowerQuery.match(/tags:\s*([\w\s,]+)\s*/i);
  if (tagsMatch) {
    criteria.tags = tagsMatch[1].split(",").map((tag) => tag.trim());
  }

  // Check for take again
  const takeAgainMatch = lowerQuery.match(/take again:\s*(\d+%)\s*/i);
  if (takeAgainMatch) {
    criteria.takeAgain = takeAgainMatch[1].trim();
  }

  // Check for review
  const reviewMatch = lowerQuery.match(/review:\s*(.*)/i);
  if (reviewMatch) {
    criteria.review = reviewMatch[1].trim();
  }

  // Return extracted criteria
  return Object.keys(criteria).length > 0 ? criteria : {};
}

// Function to format metadata dynamically
function formatMetadata(metadata) {
  // Define the possible metadata fields
  const fields = [
    "subject",
    "stars",
    "level_of_difficulty",
    "take_again",
    "tags",
    "review",
  ];

  // Build the formatted string based on available metadata fields
  let result = "";
  fields.forEach((field) => {
    if (metadata[field] !== undefined) {
      if (Array.isArray(metadata[field])) {
        result += `${capitalize(field)}: ${metadata[field].join(", ")}\n`;
      } else {
        result += `${capitalize(field)}: ${metadata[field]}\n`;
      }
    }
  });
  return result;
}

// Utility function to capitalize the first letter of a string
function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).replace(/_/g, " ");
}
