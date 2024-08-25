import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import fetch from 'node-fetch';
globalThis.fetch = fetch;


const systemPrompt = `You are an AI assistant designed to help students find the most suitable professors based on their specific queries. Your primary role is to provide the top 3 professors who best match the user's criteria, using a Retrieval-Augmented Generation (RAG) system.

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
4. Provide a concise summary for each of the top 3 professors(using a new paragraph for each professor) who match the subject criteria, including:
   - Name and academic information
   - Why they are a good match for the user's needs
   - Key strengths and any potential areas for improvement
   - A relevant student review quote (if available)
5. Format the response in a clear and structured manner to help the user make an informed decision including:
   - Professor name, subject, rating, level of difficulty, and tags
   - Talk about the next professor in a new paragraph.

6. Offer additional details or further assistance if the user requests more information.

Guidelines to follow:
- Be objective and unbiased in your recommendations.
- Provide accurate and up-to-date information about professors.
- Make connections between the user's query and the professors' attributes. For example:
  - When a user asks for a professor who teaches a specific subject, only include professors whose subject metadata matches the user's query.
  - When a user asks for a professor who teaches at a specific University, only include professors whose University or College matches the user's query.
- Ensure privacy by not sharing personal information about professors or students.
- Encourage users to consider multiple factors, including reviews, teaching style, and course difficulty.
- Remind users that recommendations are based on available data and may not fully reflect individual experiences.

If the user's query is unclear or lacks specific criteria, ask follow-up questions to clarify their needs before making recommendations.

Your goal is to help students make informed academic decisions by providing accurate, relevant, and helpful information about professors.`;

export async function POST(req) {
  try {
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
    });
    // const embedding = response.data[0].embedding;

    // Query the Pinecone index
    const results = await index.query({
      topK: 3,
      vector: embedding.data[0].embedding,
      includeMetadata: true,
    });

    // Extract subject from the user's query
    const userQuerySubject = extractSubjectFromQuery(text);

    // Build the result string from vector database results
    let resultString = "\n\nReturned results from vector db: ";
    results.matches.forEach((match) => {
      if (match.metadata.subject?.toLowerCase() === userQuerySubject.toLowerCase()) { // Dynamic subject matching
        resultString += `
        Professor: ${match.id}
        ${formatMetadata(match.metadata)}
        \n\n`;
      }
    });

    // Prepare the final user message with the result string
    const lastMessage = data[data.length - 1];
    const lastMessageContent = lastMessage.content + resultString;
    const lastDataWithoutLastMessage = data.slice(0, data.length - 1);

    // Generate a response using the OpenAI chat completion API
    const completion = await openai.chat.completions.create({
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

  } catch (error) {
    console.error("Error:", error);
    return new NextResponse("An error occurred", { status: 500 });
  }
}

// Function to extract the subject from the user query
function extractSubjectFromQuery(query) {
  // Implement logic to extract the subject from the user's query
  const match = query.match(/computer science|mathematics|physics|biology/i);
  return match ? match[0] : "general";
}

// Function to format metadata dynamically
function formatMetadata(metadata) {
  // Define the possible metadata fields
  const fields = [
    'subject', 'stars', 'level_of_difficulty', 'take_again', 'tags', 'review'
  ];

  // Build the formatted string based on available metadata fields
  let result = '';
  fields.forEach(field => {
    if (metadata[field] !== undefined) {
      if (Array.isArray(metadata[field])) {
        result += `${capitalize(field)}: ${metadata[field].join(', ')}\n`;
      } else {
        result += `${capitalize(field)}: ${metadata[field]}\n`;
      }
    }
  });
  return result;
}

// Utility function to capitalize the first letter of a string
function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).replace(/_/g, ' ');
}