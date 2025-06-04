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
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import type { Checklist } from '../types/Checklist';
import { CHECKLIST_ITEMS } from '../constants/checklistItems';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  const handleCreateNewChecklist = () => {
    navigate('/new');
  };

  const handleImportChecklist = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedChecklist = JSON.parse(text);
      
      // Valider at det er en gyldig sjekkliste
      if (!importedChecklist.id || !importedChecklist.solparkName || !importedChecklist.areaNumber) {
        throw new Error('Ugyldig sjekkliste format');
      }

      // Generer ny ID for den importerte sjekklisten
      importedChecklist.id = Date.now().toString();
      importedChecklist.timestamp = new Date().toISOString();

      await storageService.saveChecklist(importedChecklist);
      setChecklists(prev => [...prev, importedChecklist]);
      navigate(`/checklist/${importedChecklist.id}`);
    } catch (error) {
      console.error('Feil ved import av sjekkliste:', error);
      alert('Kunne ikke importere sjekklisten. Vennligst sjekk at filen er i riktig format.');
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Sjekklister
        </Typography>

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

        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setIsDialogOpen(true)}
        >
          <AddIcon />
        </Fab>

        <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
          <DialogTitle>Opprett ny sjekkliste</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleCreateNewChecklist}
                fullWidth
              >
                Opprett ny sjekkliste
              </Button>
              <Button
                variant="outlined"
                component="label"
                fullWidth
              >
                Importer sjekkliste
                <input
                  type="file"
                  hidden
                  accept=".json"
                  onChange={handleImportChecklist}
                />
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsDialogOpen(false)}>Avbryt</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default HomePage; 