'use client'
import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'

export default function Home() {
    const [url, setUrl] = useState('')
    const [status, setStatus] = useState('')

    const handleScrape = async () => {
        if (!url) {
            setStatus('Please enter a URL')
            return
        }
        
        setStatus('Processing...')
        try {
            const response = await fetch('/api/scrape', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ professorUrl: url }), // Use professorUrl key
            })

            if (response.ok) {
                const result = await response.text()
                setStatus(`Success: ${result}`)
            } else {
                const errorResult = await response.text()
                setStatus(`Failed to process the request: ${errorResult}`)
            }
        } catch (error) {
            console.error('Error:', error)
            setStatus('An error occurred')
        }
    }

    return (
        <Box sx={{ p: 4 }}>
            <Stack spacing={2} alignItems="center">
                <Typography variant="h4" gutterBottom>
                    Rate My Professor Scraper
                </Typography>
                <TextField
                    fullWidth
                    label="Professor URL"
                    variant="outlined"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleScrape}
                >
                    Scrape and Add to Pinecone
                </Button>
                {status && (
                    <Typography variant="body1" color={status.startsWith('Success') ? 'green' : 'red'}>
                        {status}
                    </Typography>
                )}
            </Stack>
        </Box>
    )
}