import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper,
  Box,
  Fab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import type { Checklist } from '../types/Checklist';
import { getAllChecklists } from '../services/storageService';

export default function Home() {
  const navigate = useNavigate();
  const [checklists, setChecklists] = useState<Checklist[]>([]);

  useEffect(() => {
    const loadChecklists = () => {
      const savedChecklists = getAllChecklists();
      setChecklists(savedChecklists);
    };

    loadChecklists();
    // Lytte på endringer i localStorage
    window.addEventListener('storage', loadChecklists);
    return () => window.removeEventListener('storage', loadChecklists);
  }, []);

  const handleNewChecklist = () => {
    navigate('/new');
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Sjekklister - Furuseth Solpark
      </Typography>

      <Paper sx={{ mb: 4, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Aktive sjekklister
        </Typography>
        {checklists.length === 0 ? (
          <Typography color="text.secondary">
            Ingen aktive sjekklister. Opprett en ny for å begynne.
          </Typography>
        ) : (
          <List>
            {checklists.map((checklist) => (
              <ListItem
                key={checklist.id}
                button
                onClick={() => navigate(`/checklist/${checklist.id}`)}
              >
                <ListItemText
                  primary={`Område ${checklist.areaNumber} - ${checklist.inspectionDate}`}
                  secondary={`Status: ${checklist.status}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      <Box sx={{ position: 'fixed', bottom: 16, right: 16 }}>
        <Fab
          color="primary"
          aria-label="Ny sjekkliste"
          onClick={handleNewChecklist}
        >
          <AddIcon />
        </Fab>
      </Box>
    </Container>
  );
} 