'use client'
import { useState } from 'react'
import { Box, 
    Button,
    Stack,
    TextField,
    AppBar,
    Toolbar,
    Typography,Grid} from '@mui/material'
import {ThemeProvider} from '@mui/material/styles';
import CustomAppBar from "./components/CustomAppBar";
import CustomTheme from "./components/Theme";
import Image from "next/image";
import Head from "next/head";

export default function Home() {
    return (
    <Box sx={{ overflowX: 'hidden' }}> {/* This hides any horizontal overflow */}
        <Head>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <ThemeProvider theme={CustomTheme}>
             
                <CustomAppBar />
                <Box
                component="section"
                sx={{
                    backgroundColor: 'primary.main',  // Set the background to the primary color
                    width: '100%',  // Stretch to full width
                    minHeight: '700px',  // Set some height for the Box
                    display: 'flex',  // Flexbox to center content
                    justifyContent: 'center',  // Center content horizontally
                    alignItems: 'center',  // Center content vertically
                    overflow: 'hidden',  // Prevents overflowing content
                }}
            >
                <Grid container spacing={4} sx={{ px: 7 }}>
                    <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Typography
                            variant="h2"
                            sx={{ mb: 5 }}  // Margin bottom to create space between heading and button
                        >
                            <strong>RateMyProfessorAI</strong>
                        </Typography>
                        <Button
                            variant="outlined"  // Button style variant
                            color="secondary"  // Button color
                            size="large"  // Button size
                            sx={{ mb: 2 }}  // Margin bottom to create space below the button
                            href="/chatbot"
                        >
                            Get Started
                        </Button>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Box
                            sx={{ 
                                width: '100%',  // Adjust width of the image container
                                height: 500,  // Adjust height of the image container
                                borderRadius: '16px',  // Set the border radius for rounded corners
                                overflow: 'hidden',  // Ensure the image fits within the rounded corners
                                position: 'relative'  // Required for the Image component
                            }}
                        >
                            <Image 
                                src="/images/chatbot.jpeg"  // Replace with your image path
                                alt="Background Image"
                                layout="fill"  // Use fill layout to fit the container
                                objectFit="cover"  // Ensure the image covers the container
                            />
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            <Box sx={{ marginTop: 2 , padding: 1, marginBottom:6 }}> 
          <Typography variant="h4" component="h2" gutterBottom align='center' padding={1}> 
            <strong>Features</strong>
          </Typography>

          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box
                  sx={{
                    p: 3,
                    border: "1px solid",
                    borderColor: "grey.300",
                    borderRadius: 2,
                    ":hover": {
                    boxShadow: 6,
                   },
                  }}
                >
                  <Typography variant="h6" gutterBottom color={"secondary"}>
                  Personalized Recommendations
                  </Typography>
                  <Typography>
                  Our AI chatbot analyzes your academic interests, 
                  learning preferences, and course requirements to provide tailored recommendations 
                  for professors who best match your educational goals.
                  </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
            <Box
                sx={{
                  p: 3,
                  border: "1px solid",
                  borderColor: "grey.300",
                  borderRadius: 2,
                  ":hover": {
                    boxShadow: 6,
                   },
                }}
              >
              <Typography variant="h6" gutterBottom color={"secondary"}>
              Real-Time Insights
              </Typography>
              <Typography>
              Get instant feedback and reviews on professors from students who have taken their courses,
               along with detailed analysis and ratings to help you make informed decisions
                about your next class.
              </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
            <Box
                sx={{
                  p: 3,
                  border: "1px solid",
                  borderColor: "grey.300",
                  borderRadius: 2,
                  ":hover": {
                    boxShadow: 6,
                   },
                }}
              >
              <Typography variant="h6" gutterBottom color={"secondary"}>
              Interactive Assistance
              </Typography>
              <Typography>
              Engage with our AI chatbot for personalized advice and answers to your questions about professors, course content,
               and academic experiences, making your decision-making process smoother and more efficient. 
              </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
        {/* Footer */}
        <Box 
                component="footer"
                sx={{
                    backgroundColor: 'black',
                    color: 'white',
                    padding: 3,
                    textAlign: 'center',
                    width: '100%',
                    position: 'relative',
                    bottom: 0, // Makes sure it sticks at the bottom
                }}
        >
                <Typography variant="body1">
                    © 2024 RateMyProfessorAI. All rights reserved.
                </Typography>
            </Box>
          
            

            
        </ThemeProvider>
    </Box>
    )









    










    }
