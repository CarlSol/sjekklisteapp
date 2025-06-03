import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import type { Checklist } from '../types/Checklist';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [checklists, setChecklists] = useState<Checklist[]>([]);

  useEffect(() => {
    const loadChecklists = async () => {
      try {
        const loadedChecklists = await storageService.getAllChecklists();
        setChecklists(loadedChecklists);
      } catch (error) {
        console.error('Feil ved lasting av sjekklister:', error);
      }
    };
    loadChecklists();
  }, []);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('nb-NO');
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Sjekklister
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/new')}
          sx={{ mb: 4 }}
        >
          Opprett ny sjekkliste
        </Button>

        <Paper>
          <List>
            {checklists.map((checklist) => (
              <ListItem
                key={checklist.id}
                button
                onClick={() => navigate(`/checklist/${checklist.id}`)}
              >
                <ListItemText
                  primary={`${checklist.solparkName} - Område ${checklist.areaNumber}`}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.primary">
                        {formatDate(checklist.inspectionDate)}
                      </Typography>
                      <br />
                      <Typography component="span" variant="body2" color="text.secondary">
                        Inspektører: {checklist.inspectors?.join(', ') || 'Ingen'}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    </Container>
  );
};

export default HomePage; 