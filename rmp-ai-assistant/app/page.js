'use client'
import { useState } from 'react'
import { Box, 
    Button,
    Stack,
    TextField,
    AppBar,
    Toolbar,
    Typography,} from '@mui/material'
import {ThemeProvider} from '@mui/material/styles';
import CustomAppBar from "./components/CustomAppBar";
import CustomTheme from "./components/Theme";
import Image from "next/image";

export default function Home() {
    return (
        <ThemeProvider theme={CustomTheme}>
            <CustomAppBar />
        </ThemeProvider>
    )









    










    }
