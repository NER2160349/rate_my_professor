'use client'
import { useState } from 'react'
import { Box, 
    Button,
    Stack,
    TextField,
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Drawer,
    List,ListItem,ListItemButton,ListItemIcon,ListItemText,} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu';
import InboxIcon from '@mui/icons-material/Inbox'; 
import MailIcon from '@mui/icons-material/Mail'; 
import { usePathname, useRouter } from "next/navigation";



import Image from "next/image";


const CustomAppBar = ({ defaultTitle }) => {

const router = useRouter(); // Use useRouter hook for navigation

const [open, setOpen] = useState(false);
const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
};

    const DrawerList = (
        <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)}>
          <List>
            {['Home','ChatBot'].map((text, index) => (
              <ListItem key={text} disablePadding>
                <ListItemButton
                    onClick={
                        text === "ChatBot"
                          ? () => router.push("/chatbot")
                          : text === "Home"
                          ? () => router.push("/")
                          : undefined
                      }
                >
                  <ListItemText primary={text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      );

    return (
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static">
            <Toolbar>
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 2 }}
                onClick={toggleDrawer(true)}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Rate My Professor AI Support
              </Typography>
              <Button color="inherit">Login</Button>
            </Toolbar>
          </AppBar>
          <Drawer open={open} onClose={toggleDrawer(false)}>
        {DrawerList}
          </Drawer>
        </Box>
      );




}

export default CustomAppBar;