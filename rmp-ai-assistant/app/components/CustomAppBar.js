// CustomAppBar.js
'use client';
import { useState, useEffect } from 'react';
import { Box, Button, AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useRouter } from 'next/navigation';
import { auth } from '../firebaseConfig.mjs'; // Adjust the path
import { signOut, onAuthStateChanged } from 'firebase/auth';

const CustomAppBar = ({ defaultTitle }) => {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const toggleDrawer = (newOpen) => () => {
        setOpen(newOpen);
    };

    const handleSignOut = () => {
        signOut(auth).then(() => {
            router.push('/login'); // Redirect to login page after sign out
        }).catch((error) => {
            console.error('Sign out error', error);
        });
    };

    const DrawerList = (
        <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)}>
            <List>
                {['Home', 'ChatBot', 'Expand Professor Database'].map((text) => (
                    <ListItem key={text} disablePadding>
                        <ListItemButton onClick={() => router.push(text === "ChatBot" ? "/chatbot" : text === "Home" ? "/" : "/scrape_link")}>
                            <ListItemText primary={text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="fixed" sx={{ backgroundColor: 'common.black', color: 'primary.main' }}>
                <Toolbar>
                    <IconButton size="large" edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }} onClick={toggleDrawer(true)}>
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        RateMyProfessorAI
                    </Typography>
                    {user ? (
                        <Button variant="outlined" color="secondary" size="large" sx={{ margin: 2 }} onClick={handleSignOut}>
                            Sign Out
                        </Button>
                    ) : (
                        <Button variant="outlined" color="secondary" size="large" sx={{ margin: 2 }} href="/login">
                            Login
                        </Button>
                    )}
                </Toolbar>
            </AppBar>
            <Drawer open={open} onClose={toggleDrawer(false)}
                PaperProps={{ sx: { backgroundColor: "common.black", color: "primary.main" } }}>
                {DrawerList}
            </Drawer>
        </Box>
    );
};

export default CustomAppBar;
