import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Card,
  CardContent,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Fab,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, FileUpload as FileUploadIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import type { Checklist } from '../types/Checklist';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [savedChecklists, setSavedChecklists] = useState<Checklist[]>([]);
  const [openActionDialog, setOpenActionDialog] = useState(false);

  useEffect(() => {
    const loadChecklists = async () => {
      try {
        const loadedChecklists = await storageService.getAllChecklists();
        setSavedChecklists(loadedChecklists);
      } catch (error) {
        console.error('Feil ved lasting av sjekklister:', error);
      }
    };
    loadChecklists();
  }, []);

  const handleCreateNew = () => {
    navigate('/new');
    setOpenActionDialog(false);
  };

  const handleLoadChecklist = (checklist: Checklist) => {
    navigate(`/checklist/${checklist.id}`);
    setOpenActionDialog(false);
  };

  const handleDeleteChecklist = async (id: string) => {
    if (window.confirm('Er du sikker på at du vil slette denne sjekklisten?')) {
      try {
        await storageService.deleteChecklist(id);
        const updatedChecklists = await storageService.getAllChecklists();
        setSavedChecklists(updatedChecklists);
      } catch (error) {
        console.error('Feil ved sletting av sjekkliste:', error);
      }
    }
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
      setSavedChecklists(prev => [...prev, importedChecklist]);
      navigate(`/checklist/${importedChecklist.id}`);
      setOpenActionDialog(false);
    } catch (error) {
      console.error('Feil ved import av sjekkliste:', error);
      alert('Kunne ikke importere sjekklisten. Vennligst sjekk at filen er i riktig format.');
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Ukjent dato';
    return new Date(dateString).toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Sjekklister
        </Typography>

        {savedChecklists.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Ingen sjekklister funnet
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Trykk på plus-knappen for å opprette din første sjekkliste
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {savedChecklists.map((checklist) => (
              <Grid item xs={12} sm={6} md={4} key={checklist.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">
                      {checklist.solparkName || 'Ukjent solpark'}
                    </Typography>
                    <Typography variant="subtitle1" color="textSecondary">
                      Område {checklist.areaNumber || 'Ukjent'}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {formatDate(checklist.inspectionDate)}
                    </Typography>
                    <Typography variant="body2">
                      Status: {checklist.status || 'Opprettet'}
                    </Typography>
                    <Typography variant="body2">
                      Inspektører: {checklist.inspectors?.join(', ') || 'Ingen'}
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                      <IconButton
                        onClick={() => handleLoadChecklist(checklist)}
                        color="primary"
                        size="small"
                        title="Åpne sjekkliste"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteChecklist(checklist.id)}
                        color="error"
                        size="small"
                        title="Slett sjekkliste"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setOpenActionDialog(true)}
        >
          <AddIcon />
        </Fab>

        <Dialog open={openActionDialog} onClose={() => setOpenActionDialog(false)}>
          <DialogTitle>Velg handling</DialogTitle>
          <DialogContent>
            <List>
              <ListItem button onClick={handleCreateNew}>
                <ListItemText 
                  primary="Opprett ny sjekkliste" 
                  secondary="Opprett en ny sjekkliste med standard sjekkpunkter"
                />
              </ListItem>
              <ListItem button component="label">
                <ListItemText 
                  primary="Importer sjekkliste" 
                  secondary="Last opp en tidligere lagret sjekkliste fra fil"
                />
                <input
                  type="file"
                  hidden
                  accept=".json"
                  onChange={handleImportChecklist}
                />
                <FileUploadIcon />
              </ListItem>
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenActionDialog(false)}>Avbryt</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Home; 