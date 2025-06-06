import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Grid,
  Card,
  CardMedia,
  IconButton
} from '@mui/material';
import { PhotoCamera, Download as DownloadIcon, Delete as DeleteIcon, Save as SaveIcon } from '@mui/icons-material';
import { storageService } from '../services/storageService';
import { generatePDF } from '../services/emailService';
import type { Checklist, ChecklistItem } from '../types/Checklist';

const ChecklistForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const loadChecklist = async () => {
      if (id) {
        const loadedChecklist = await storageService.getChecklistById(id);
        if (loadedChecklist) {
          setChecklist(loadedChecklist);
        }
      }
    };
    loadChecklist();
  }, [id]);

  const handleItemClick = (item: ChecklistItem) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (itemId: string, file: File) => {
    if (!checklist) return;
    
    try {
      const imageData = await storageService.uploadImage(file);
      const updatedChecklist = { ...checklist };
      if (updatedChecklist.items) {
        const itemIndex = updatedChecklist.items.findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
          updatedChecklist.items[itemIndex].images = [
            ...(updatedChecklist.items[itemIndex].images || []),
            imageData
          ];
          await storageService.saveChecklist(updatedChecklist);
          setChecklist(updatedChecklist);
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Kunne ikke laste opp bildet. Vennligst prøv igjen.');
    }
  };

  const handleDeleteImage = async (itemId: string, imageIndex: number) => {
    if (!checklist) return;
    
    try {
      const updatedChecklist = { ...checklist };
      if (updatedChecklist.items) {
        const itemIndex = updatedChecklist.items.findIndex(item => item.id === itemId);
        if (itemIndex !== -1 && updatedChecklist.items[itemIndex].images) {
          updatedChecklist.items[itemIndex].images = updatedChecklist.items[itemIndex].images.filter((_, index) => index !== imageIndex);
          await storageService.saveChecklist(updatedChecklist);
          setChecklist(updatedChecklist);
        }
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Kunne ikke slette bildet. Vennligst prøv igjen.');
    }
  };

  const handleExportRawData = () => {
    try {
      if (!checklist) return;
      
      // Opprett en komplett kopi av sjekklista med all data
      const exportData = {
        ...checklist,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      // Konverter til JSON
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Opprett fil for nedlasting
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `sjekkliste_rådata_${checklist.solparkName}_${checklist.areaNumber}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Rådata eksportert successfully');

    } catch (error) {
      console.error('Feil ved eksport av rådata:', error);
      alert('Kunne ikke eksportere rådata. Vennligst prøv igjen.');
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('nb-NO');
  };

  if (!checklist) {
    return (
      <Container>
        <Typography>Laster sjekkliste...</Typography>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>
          {checklist.solparkName} - Område {checklist.areaNumber}
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Inspeksjonsdato: {formatDate(checklist.inspectionDate)}
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Inspektører: {checklist.inspectors?.join(', ') || ''}
        </Typography>

        <Box sx={{ mt: 2, mb: 4 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleExportRawData}
            sx={{ mr: 2 }}
          >
            Eksporter rådata
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<DownloadIcon />}
            onClick={async () => {
              if (checklist) {
                const pdfBlob = await generatePDF(checklist);
                const url = URL.createObjectURL(pdfBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `sjekkliste_${checklist.solparkName}_${checklist.areaNumber}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }
            }}
          >
            Last ned PDF
          </Button>
        </Box>

        <Paper sx={{ p: 2 }}>
          <List>
            {checklist.items?.map((item) => (
              <React.Fragment key={item.id}>
                <ListItem button onClick={() => handleItemClick(item)}>
                  <ListItemText
                    primary={item.checkPoint}
                    secondary={
                      <React.Fragment>
                        <Typography component="span" variant="body2" color="text.primary">
                          {item.category}
                        </Typography>
                        {item.notes && (
                          <Typography variant="body2" color="text.secondary">
                            Notat: {item.notes}
                          </Typography>
                        )}
                        {item.images && item.images.length > 0 && (
                          <Typography variant="body2" color="text.secondary">
                            Bilder: {item.images.length}
                          </Typography>
                        )}
                      </React.Fragment>
                    }
                  />
                  <ListItemSecondaryAction>
                    {item.images && item.images.map((imageRef, index) => (
                      <IconButton
                        key={imageRef}
                        edge="end"
                        aria-label="delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(item.id, index);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    ))}
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id={`image-upload-${item.id}`}
                      type="file"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          const file = e.target.files[0];
                          handleImageUpload(item.id, file);
                        }
                      }}
                    />
                    <label htmlFor={`image-upload-${item.id}`}>
                      <IconButton
                        edge="end"
                        aria-label="upload"
                        component="span"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <PhotoCamera />
                      </IconButton>
                    </label>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </Box>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedItem?.checkPoint}
        </DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Kategori: {selectedItem.category}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Frekvens: {selectedItem.frequency}
              </Typography>
              {selectedItem.notes && (
                <Typography variant="body1" gutterBottom>
                  Notat: {selectedItem.notes}
                </Typography>
              )}
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Bilder
              </Typography>
              <Grid container spacing={2}>
                {selectedItem.images && selectedItem.images.map((imageRef) => (
                  <Grid item xs={12} sm={6} md={4} key={imageRef}>
                    <Card>
                      <CardMedia
                        component="img"
                        height="200"
                        image={imageRef}
                        alt="Sjekkpunkt bilde"
                      />
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Lukk</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ChecklistForm; 