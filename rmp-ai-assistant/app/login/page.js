"use client";
import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Box, Button, TextField, Typography, Container, Paper } from '@mui/material';
import { auth } from '../firebaseConfig.mjs'; // Ensure this path is correct

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // Added for success messages
  const [isSignUp, setIsSignUp] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect to a protected route or homepage
      window.location.href = '/'; // Example redirection
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Automatically log in the user after successful sign-up
      await signInWithEmailAndPassword(auth, email, password);
      setSuccess('Account created successfully. You are now logged in.');
      // Redirect to a protected route or homepage
      window.location.href = '/'; // Example redirection
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // Redirect to a protected route or homepage
      window.location.href = '/'; // Example redirection
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ padding: 3 }}>
        <Typography variant="h5">{isSignUp ? 'Sign Up' : 'Sign In'}</Typography>
        {error && <Typography color="error">{error}</Typography>}
        {success && <Typography color="success">{success}</Typography>} {/* Display success message */}
        <Box component="form" onSubmit={isSignUp ? handleSignUp : handleLogin} sx={{ mt: 2 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
          >
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </Button>
          <Button
            type="button"
            fullWidth
            variant="outlined"
            color="secondary"
            sx={{ mt: 2 }}
            onClick={handleGoogleSignIn}
          >
            Sign In with Google
          </Button>
          <Button
            type="button"
            fullWidth
            variant="text"
            sx={{ mt: 2 }}
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

