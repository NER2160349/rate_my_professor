'use client'
import { Box, Button, Stack, TextField, Typography, Toolbar } from '@mui/material'
import { useState } from 'react'
import CustomAppBar from "../components/CustomAppBar";
import CustomTheme from "../components/Theme";
import {ThemeProvider} from '@mui/material/styles';

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
                setStatus(`Scraped Successfully`)
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
        <ThemeProvider theme={CustomTheme}>
             
            <CustomAppBar />

            {/* Add Toolbar to create space for the AppBar */}
            <Toolbar />

                <Box sx={{ p: 4  }}>
                    <Stack spacing={2} alignItems="center">
                        <Typography variant="h3" gutterBottom>
                           <strong> Rate My Professor Scraper </strong>
                        </Typography>
                        <Typography variant="h5" gutterBottom>
                           Expand our database by adding a URL of a PROFESSOR or SCHOOL from Rate My Professor website 
                        </Typography>
                        <TextField
                            fullWidth
                            label="Professor / School URL"
                            variant="outlined"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleScrape}
                            size='large'
                        >
                            Add to Database
                        </Button>
                        {status && (
                            <Typography variant="body1" color={status.startsWith('Scraped') ? 'green' : 'red'}>
                                {status}
                            </Typography>
                        )}
                    </Stack>
                </Box>
    </ThemeProvider>
    )
}