import { NextResponse } from "next/server";
import { getEntryById } from "./getEntry";

export async function GET(req) {
  try {
    // Extract ID from the URL path
    const id = req.nextUrl.pathname.split("/").pop();
    console.log("Extracted ID:", id);
    const decodedId = decodeURIComponent(id);
    // Check if ID is provided
    if (!id) {
      console.log("No ID provided");
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Fetch entry data by ID
    const entryData = await getEntryById(decodedId);
    console.log("Fetched Entry Data:", entryData);

    // Return response based on entry data
    if (entryData) {
      return NextResponse.json(entryData, { status: 200 });
    } else {
      console.log("Entry not found");
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error in GET request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
