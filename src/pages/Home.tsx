import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import type { Checklist } from '../types/Checklist';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [solparkName, setSolparkName] = useState('');
  const [areaNumber, setAreaNumber] = useState('');

  const handleCreateChecklist = async () => {
    if (!solparkName || !areaNumber) {
      alert('Vennligst fyll ut alle felt');
      return;
    }

    try {
      const newChecklist: Checklist = {
        id: Date.now().toString(),
        title: `${solparkName} - Område ${areaNumber}`,
        solparkName,
        areaNumber,
        inspectionDate: new Date().toISOString(),
        inspectors: [],
        items: [],
        timestamp: new Date().toISOString(),
        inspector: ''
      };

      await storageService.saveChecklist(newChecklist);
      navigate(`/checklist/${newChecklist.id}`);
    } catch (error) {
      console.error('Error creating checklist:', error);
      alert('Kunne ikke opprette sjekkliste. Vennligst prøv igjen.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Opprett ny sjekkliste
        </Typography>
        <Box component="form" sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Solpark"
            value={solparkName}
            onChange={(e) => setSolparkName(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Områdenummer"
            value={areaNumber}
            onChange={(e) => setAreaNumber(e.target.value)}
            margin="normal"
            required
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateChecklist}
            sx={{ mt: 2 }}
            fullWidth
          >
            Opprett sjekkliste
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Home; 