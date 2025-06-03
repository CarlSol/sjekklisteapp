import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, Typography, Grid, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { storageService } from '../services/storageService';
import type { Checklist } from '../types/Checklist';

export default function HomePage() {
  const navigate = useNavigate();
  const [savedChecklists, setSavedChecklists] = useState<Checklist[]>([]);
  const [openLoadDialog, setOpenLoadDialog] = useState(false);

  useEffect(() => {
    loadSavedChecklists();
  }, []);

  const loadSavedChecklists = () => {
    const checklists = storageService.getAllChecklists();
    setSavedChecklists(checklists);
  };

  const handleCreateNew = () => {
    navigate('/checklist/new');
  };

  const handleLoadChecklist = (checklist: Checklist) => {
    navigate(`/checklist/${checklist.id}`, { state: { checklist } });
    setOpenLoadDialog(false);
  };

  const handleDeleteChecklist = (id: string) => {
    storageService.deleteChecklist(id);
    loadSavedChecklists();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Sjekklister
      </Typography>

      <Grid container spacing={3}>
        {savedChecklists.map((checklist) => (
          <Grid item xs={12} sm={6} md={4} key={checklist.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">
                  Område {checklist.areaNumber}
                </Typography>
                <Typography color="textSecondary">
                  {formatDate(checklist.inspectionDate)}
                </Typography>
                <Typography variant="body2">
                  Status: {checklist.status}
                </Typography>
                <Typography variant="body2">
                  Inspektører: {checklist.inspectors.join(', ')}
                </Typography>
                <div style={{ marginTop: '10px' }}>
                  <IconButton
                    onClick={() => handleLoadChecklist(checklist)}
                    color="primary"
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteChecklist(checklist.id)}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={() => setOpenLoadDialog(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          minWidth: '56px',
          padding: 0
        }}
      >
        <AddIcon />
      </Button>

      <Dialog open={openLoadDialog} onClose={() => setOpenLoadDialog(false)}>
        <DialogTitle>Velg handling</DialogTitle>
        <DialogContent>
          <List>
            <ListItem button onClick={handleCreateNew}>
              <ListItemText primary="Opprett ny sjekkliste" />
            </ListItem>
            {savedChecklists.length > 0 && (
              <ListItem>
                <ListItemText primary="Last inn eksisterende sjekkliste" />
              </ListItem>
            )}
            {savedChecklists.map((checklist) => (
              <ListItem
                key={checklist.id}
                button
                onClick={() => handleLoadChecklist(checklist)}
                style={{ paddingLeft: '32px' }}
              >
                <ListItemText
                  primary={`Område ${checklist.areaNumber}`}
                  secondary={formatDate(checklist.inspectionDate)}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLoadDialog(false)}>Avbryt</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
} 