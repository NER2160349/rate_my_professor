"use client";

import { useEffect, useState } from 'react';
import { ThemeProvider, useTheme, useMediaQuery, Box, Button, Grid, Typography, Toolbar } from '@mui/material';
import CustomAppBar from './components/CustomAppBar';
import CustomTheme from './components/Theme';
import Image from 'next/image';
import Head from 'next/head';
import { auth } from './firebaseConfig.mjs'; // Adjust the path as needed
import { signOut, onAuthStateChanged } from 'firebase/auth';

export default function Home() {
    const theme = useTheme(); // Access theme using useTheme hook
    const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Now it can access breakpoints
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            // Optionally redirect or update state after sign out
        } catch (error) {
            console.error('Sign out error', error);
        }
    };

    return (
        <Box sx={{ overflowX: 'hidden' }}> {/* This hides any horizontal overflow */}
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <ThemeProvider theme={CustomTheme}>
                <CustomAppBar user={user} onSignOut={handleSignOut} />
                <Toolbar /> {/* Add Toolbar to create space for the AppBar */}
                <Box
                    component="section"
                    sx={{
                        backgroundColor: 'primary.main',
                        mt: 2,
                        width: '100%',
                        minHeight: '700px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden',
                        boxShadow: 6,
                        borderRadius: 10
                    }}
                >
                    <Grid container spacing={4} sx={{ px: 7 }}>
                        <Grid 
                            item xs={12} 
                            md={6} 
                            sx={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                justifyContent: 'center',
                                textAlign: isMobile ? 'center' : 'left'
                            }}
                        >
                            <Typography
                                variant={isMobile ? 'h4' : 'h2'}
                                sx={{ mb: 5, textAlign: 'center' }}
                            >
                                <strong>RateMyProfessorAI</strong>
                            </Typography>
                            <Button
                                variant="outlined"
                                color="secondary"
                                size="large"
                                sx={{ mb: 2 }}
                                href="/chatbot"
                            >
                                Get Started
                            </Button>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box
                                sx={{
                                    width: isMobile ? '100%' : '90%',
                                    height: isMobile ? 400 : 700,
                                    overflow: 'hidden',
                                    position: 'relative',
                                    marginLeft: isMobile ? 0 : 5
                                }}
                            >
                                <Image 
                                    src="/images/chatbot.png"  
                                    alt="bot mascot"
                                    fill
                                    objectFit="contain"
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </Box>

                <Box sx={{ marginTop: 10, padding: 1, marginBottom: 10 }}> 
                    <Typography variant="h2" component="h2" gutterBottom align='center' padding={1}> 
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
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    boxShadow: 6,
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
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    boxShadow: 6,
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
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    boxShadow: 6
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

                <Box sx={{ marginTop: 10, padding: 1, marginBottom: 6, textAlign: "center" }}> 
                    <Typography variant="h4" component="h2" gutterBottom align='center' padding={1}> 
                        <strong>Expand Our Database</strong>
                    </Typography>
                    <Box
                        sx={{
                            p: 3,
                            border: "5px solid",
                            borderColor: "primary.dark",
                            borderRadius: 5,
                        }}
                    >
                        <Typography variant="h5">
                            Help us Out By submitting URL of a Professor or School from Rate my Professor website to expand our database
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            color="primary"
                            sx={{ mt: 2 }}
                            href="/scrape_link"
                        >
                            Expand Database
                        </Button>
                    </Box>
                </Box>

                {/* Footer */}
                <Box 
                    component="footer"
                    sx={{
                        backgroundColor: 'black',
                        color: 'white',
                        padding: 3,
                        marginTop: 10,
                        textAlign: 'center',
                        width: '100%',
                        position: 'relative',
                        bottom: 0,
                    }}
                >
                    <Typography variant="body1">
                        © 2024 RateMyProfessorAI. All rights reserved.
                    </Typography>
                </Box>
            </ThemeProvider>
        </Box>
    );
}
