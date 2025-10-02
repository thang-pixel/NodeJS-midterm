import React from 'react';
import { Container, Typography } from '@mui/material';

function Home() {
  return (
    <Container maxWidth="sm">
      <Typography variant="h4" align="center" gutterBottom>
        Welcome to Home Page
      </Typography>
      <Typography variant="body1">
        This is the home page of your application.
      </Typography>
    </Container>
  );
}

export default Home;