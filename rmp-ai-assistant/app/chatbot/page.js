"use client";
import { Box, Button, Stack, TextField, Toolbar } from "@mui/material";
import { useState, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CustomAppBar from "../components/CustomAppBar";
import CustomTheme from "../components/Theme";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Container,
  Typography,
  Card,
  CardContent,
  CircularProgress,
} from "@mui/material";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm the Rate My Professor support assistant. How can I help you today?",
    },
  ]);

  const [message, setMessage] = useState("");
  const [entryData, setEntryData] = useState(null);
  const [entryId, setEntryId] = useState(null);
  const [loading, setLoading] = useState(true);

  const extractNames = (text) => {
    // Split the text by colon to get the part after the colon
    const afterColon = text.split(/:/)[1] || "";

    // Trim leading and trailing spaces
    const trimmedText = afterColon.trim();

    // Extract content up to the first period
    const firstSentence = trimmedText.split(/[.!?]/)[0].trim();
    // alert(firstSentence);
    const firstName = firstSentence.split(",")[0].trim();
    // alert(`${firstName}`);
    return firstName;

    // Regex to find names in the format "Professor Firstname Lastname"
    // Adjust the pattern based on your expected name formats
    // const nameRegex = /Professor\s([\w'-]+(?:\s[\w'-]+)*),?\s|Professor\s([\w'-]+(?:\s[\w'-]+)*)/;

    // const match = nameRegex.exec(firstSentence);
    // alert(match);
    // return match ? match[1] : null;
  };

  const fetchEntryData = async (id) => {
    try {
      // alert(encodeURIComponent(id));
      const response = await axios.get(
        `/api/entryFromId/${encodeURIComponent(id)}`
      );
      const entryData = response.data;
      const entryid = id;
      // alert(entryData.records[id].metadata.subject);
      setEntryData(entryData);
      setEntryId(entryid);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching entry data:", error);
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);

    setMessage("");

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify([...messages, { role: "user", content: message }]),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = "";

    const processText = async ({ done, value }) => {
      if (done) {
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);

          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + result },
          ];
        });

        // Extract names from the assistant's final response and fetch data
        const assistantMessage = result; // Get the full response content
        const names = extractNames(assistantMessage);
        // alert(names);
        if (names.length > 0) {
          fetchEntryData(names); // Assuming the first name is used as ID
        }

        return;
      }

      result += decoder.decode(value || new Uint8Array(), { stream: true });
      reader.read().then(processText);
    };

    reader.read().then(processText);
  };

  return (
    <ThemeProvider theme={CustomTheme}>
      <CustomAppBar />
      <Toolbar />
      <Box
        width="100vw"
        height="100vh"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
      >
        <Stack
          direction={"column"}
          width="500px"
          height="600px"
          border="1px solid #8A2BE2" // Purple border
          p={2}
          spacing={3}
          bgcolor="#F9F9F9" // Light gray background for the chat container
          borderRadius={2} //  add rounded corners
        >
          <Stack
            direction={"column"}
            spacing={2}
            flexGrow={1}
            overflow="auto"
            maxHeight="100%"
          >
            {messages.map((message, index) => (
              <Box
                key={index}
                display="flex"
                justifyContent={
                  message.role === "assistant" ? "flex-start" : "flex-end"
                }
              >
                <Box
                  bgcolor={
                    message.role === "assistant"
                      ? "primary.main" // Purple for assistant messages
                      : "primary.dark" // Darker purple for user messages
                  }
                  color="white"
                  borderRadius={16}
                  p={3}
                >
                  {message.content}
                </Box>
              </Box>
            ))}
          </Stack>

          <Stack direction={"row"} spacing={2}>
            <TextField
              label="Message"
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              sx={{
                input: {
                  color: "black", // Black text for better readability
                },
                label: {
                  color: "#a648cd", // Darker purple for label
                },
                border: "1px solid #a648cd", // Purple border
              }}
            />
            <Button
              variant="contained"
              onClick={sendMessage}
              sx={{
                backgroundColor: "#a648cd", // Purple button
                "&:hover": {
                  backgroundColor: "#6A0D91", // Darker purple on hover
                },
              }}
            >
              Send
            </Button>
          </Stack>
        </Stack>
      </Box>
      {/* Metadata Section */}
      <Container>
        {loading ? (
          <CircularProgress />
        ) : !entryData ? (
          <Typography variant="h6">Entry not found</Typography>
        ) : (
          <Card>
            <CardContent>
              <Typography variant="h5">
                Professor: {entryData.records[entryId].id}
              </Typography>
              <Typography variant="h6">
                Institution: {entryData.records[entryId].metadata.institution}
              </Typography>
              <Typography variant="h6">
                Subject: {entryData.records[entryId].metadata.subject}
              </Typography>
              <Typography variant="h6">
                Stars: {entryData.records[entryId].metadata.stars}
              </Typography>
              <Typography variant="h6">
                Level of Difficulty:{" "}
                {entryData.records[entryId].metadata.levelOfDifficulty}
              </Typography>
              <Typography variant="h6">
                Take Again: {entryData.records[entryId].metadata.takeAgain}
              </Typography>

              {/* Display Tags as a comma-separated list */}
              <Typography variant="h6">Tags:</Typography>
              <ul>
                {entryData.records[entryId].metadata.tags &&
                entryData.records[entryId].metadata.tags.length > 0 ? (
                  entryData.records[entryId].metadata.tags.map((tag, index) => (
                    <li key={index}>{tag}</li>
                  ))
                ) : (
                  <Typography>No tags available</Typography>
                )}
              </ul>

              {/* Display Reviews as a list of paragraphs or another suitable format */}
              <Typography variant="h6">Reviews:</Typography>
              {entryData.records[entryId].metadata.reviews &&
              entryData.records[entryId].metadata.reviews.length > 0 ? (
                entryData.records[entryId].metadata.reviews.map(
                  (review, index) => (
                    <Box key={index} p={1} borderBottom="1px solid #ddd">
                      <Typography variant="body1">{review}</Typography>
                    </Box>
                  )
                )
              ) : (
                <Typography>No reviews available</Typography>
              )}
            </CardContent>
          </Card>
        )}
      </Container>
    </ThemeProvider>
  );
}
