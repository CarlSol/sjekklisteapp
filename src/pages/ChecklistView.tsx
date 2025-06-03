import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardMedia,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { PhotoCamera, Email as EmailIcon, Download as DownloadIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { generatePDF, sendChecklistEmail } from '../services/emailService';
import type { Checklist, ChecklistItem } from '../types/Checklist';

const ChecklistView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

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

  const handleSendEmail = async () => {
    if (!checklist) return;

    try {
      setIsSendingEmail(true);
      await generatePDF(checklist);
      const emailBody = `Vedlagt finner du sjekklisten for ${checklist.solparkName} - Område ${checklist.areaNumber}.\n\nMed vennlig hilsen,\n${checklist.inspectors?.join(', ') || ''}`;
      await sendChecklistEmail({
        to: emailAddress,
        subject: 'Sjekkliste',
        text: emailBody,
        html: emailBody,
        checklistItems: checklist.items || []
      });
      setIsEmailDialogOpen(false);
      setEmailAddress('');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Kunne ikke sende e-post. Vennligst prøv igjen.');
    } finally {
      setIsSendingEmail(false);
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
            startIcon={<EmailIcon />}
            onClick={() => setIsEmailDialogOpen(true)}
            sx={{ mr: 2 }}
          >
            Send på e-post
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

      <Dialog open={isEmailDialogOpen} onClose={() => setIsEmailDialogOpen(false)}>
        <DialogTitle>Send sjekkliste på e-post</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="E-postadresse"
            type="email"
            fullWidth
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEmailDialogOpen(false)}>Avbryt</Button>
          <Button
            onClick={handleSendEmail}
            disabled={!emailAddress || isSendingEmail}
          >
            {isSendingEmail ? 'Sender...' : 'Send'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ChecklistView; 