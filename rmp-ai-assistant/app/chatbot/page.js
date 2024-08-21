'use client'
import { Box, Button, Stack, TextField } from '@mui/material'
import { useState } from 'react'

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm the Rate My Professor support assistant. How can I help you today?"
    }
  ])
  
  const [message, setMessage] = useState('');
  
  const sendMessage = async () => {
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' }
    ])
    setMessage('')
    
    const response = fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([...messages, { role: 'user', content: message }]),
    }).then(async (res) => {
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let result = ''

      return reader.read().then(function processText({ done, value }) {
        if (done) {
          return result
        }
        const text = decoder.decode(value || new Uint8Array(), { stream: true })
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length - 1)
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ]
        })
        return reader.read().then(processText)
      })
    })
  }

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      position="relative"  // Important for layering the video
      overflow="hidden"  // To ensure no overflow from the video
    >
      {/* Background Video */}
      <Box
        component="video"
        src="/background.mp4"  // Path to the video in the public folder
        autoPlay
        loop
        muted
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',  // Ensure the video covers the entire container
          zIndex: -1  // Place the video behind other content
        }}
      />
      
      <Stack
        direction={'column'}
        width="500px"
        height="700px"
        border="1px solid #8A2BE2"  // Purple border
        p={2}
        spacing={3}
        bgcolor="#F9F9F9"  // Light gray background for the chat container
        borderRadius={2}  // Optional: add rounded corners
        sx={{ zIndex: 1 }}  // Ensure the chat container is above the video
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
                    ? '#8A2BE2'  // Purple for assistant messages
                    : '#6A0D91'  // Darker purple for user messages
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
                color: '#6A0D91',  // Darker purple for label
              },
              border: '1px solid #8A2BE2',  // Purple border
            }}
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            sx={{
              backgroundColor: '#8A2BE2',  // Purple button
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
  )
}
