'use client'
import { Box, Button, Stack, TextField, Toolbar } from '@mui/material';
import { useState, useEffect } from 'react';
import {ThemeProvider} from '@mui/material/styles';
import CustomAppBar from "../components/CustomAppBar";
import CustomTheme from "../components/Theme";
import { useRouter } from 'next/router';
import axios from 'axios';
import { Container, Typography, Card, CardContent, CircularProgress } from '@mui/material';


export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm the Rate My Professor support assistant. How can I help you today?"
    }
  ]);

  const [message, setMessage] = useState('');
  const router = useRouter();
  const { id } = router.query;
  const [entryData, setEntryData] = useState(null);
  const [loading, setLoading] = useState(true);

  const sendMessage = async () => {
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' }
    ]);

    setMessage('');

    const response = fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([...messages, { role: 'user', content: message }]),
    }).then(async (res) => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let result = '';

      return reader.read().then(function processText({ done, value }) {
        if (done) {
          return result;
        }

        const text = decoder.decode(value || new Uint8Array(), { stream: true });
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);

          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ];
        });

        return reader.read().then(processText);
      });
    });
  };
    // Fetch entry data by ID
    useEffect(() => {
      if (id) {
        axios.get(`/api/getEntryById`, { params: { id } })
          .then((response) => {
            setEntryData(response.data);
            setLoading(false);
          })
          .catch((error) => {
            console.error('Error fetching entry data:', error);
            setLoading(false);
          });
      }
    }, [id]);
    


  return (
    <ThemeProvider theme={CustomTheme}>
             
      <CustomAppBar />
      {/* Add Toolbar to create space for the AppBar */}
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
            direction={'column'}
            width="500px"
            height="600px"
            border="1px solid #8A2BE2"  // Purple border
            p={2}
            spacing={3}
            bgcolor="#F9F9F9"  // Light gray background for the chat container
            borderRadius={2}  //  add rounded corners
          >
            <Stack
              direction={'column'}
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
                    message.role === 'assistant' ? 'flex-start' : 'flex-end'
                  }
                >
                  <Box
                    bgcolor={
                      message.role === 'assistant'
                        ? 'primary.main'  // Purple for assistant messages
                        : 'primary.dark'  // Darker purple for user messages
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

            <Stack direction={'row'} spacing={2}>
              <TextField
                label="Message"
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                sx={{
                  input: {
                    color: 'black',  // Black text for better readability
                  },
                  label: {
                    color: '#a648cd',  // Darker purple for label
                  },
                  border: '1px solid #a648cd',  // Purple border
                }}
              />
              <Button
                variant="contained"
                onClick={sendMessage}
                sx={{
                  backgroundColor: '#a648cd',  // Purple button
                  '&:hover': {
                    backgroundColor: '#6A0D91',  // Darker purple on hover
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
                <Typography variant="h5">Entry ID: {entryData.id}</Typography>
                <Typography variant="h6">Metadata:</Typography>
                <pre>{JSON.stringify(entryData.metadata, null, 2)}</pre>
              </CardContent>
            </Card>
          )}
        </Container>
  </ThemeProvider>
  );
}



