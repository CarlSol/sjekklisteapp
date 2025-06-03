import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Card,
  CardMedia,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import { PhotoCamera, Email as EmailIcon, Download as DownloadIcon } from '@mui/icons-material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import type { Checklist, ChecklistItem } from '../types/Checklist';
import { storageService } from '../services/storageService';
import { generatePDF } from '../services/emailService';
import { CHECKLIST_ITEMS } from '../constants/checklistItems';

export default function ChecklistForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    const loadChecklist = async () => {
      if (!id) return;
      try {
        const loadedChecklist = await storageService.getChecklistById(id);
        if (loadedChecklist) {
          setChecklist(loadedChecklist);
        } else {
          setSnackbar({
            open: true,
            message: 'Sjekkliste ikke funnet',
            severity: 'error'
          });
          navigate('/');
        }
      } catch (error) {
        console.error('Feil ved lasting av sjekkliste:', error);
        setSnackbar({
          open: true,
          message: 'Feil ved lasting av sjekkliste',
          severity: 'error'
        });
      }
    };
    loadChecklist();
  }, [id, navigate]);

  const handleItemClick = (item: ChecklistItem) => {
    setSelectedItem(item);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
  };

  const handleStatusChange = async (itemId: string, status: 'OK' | 'Avvik' | 'Anbefalt tiltak' | 'Ikke aktuelt' | null) => {
    if (!checklist) return;

    const updatedItems = checklist.items.map(item =>
      item.id === itemId ? { ...item, status, timestamp: new Date().toISOString() } : item
    );

    const updatedChecklist = {
      ...checklist,
      items: updatedItems,
      updatedAt: new Date().toISOString()
    };

    try {
      await storageService.saveChecklist(updatedChecklist);
      setChecklist(updatedChecklist);
      setSnackbar({
        open: true,
        message: 'Status oppdatert',
        severity: 'success'
      });
    } catch (error) {
      console.error('Feil ved oppdatering av status:', error);
      setSnackbar({
        open: true,
        message: 'Feil ved oppdatering av status',
        severity: 'error'
      });
    }
  };

  const handleNotesChange = async (itemId: string, notes: string) => {
    if (!checklist) return;

    const updatedItems = checklist.items.map(item =>
      item.id === itemId ? { ...item, notes, timestamp: new Date().toISOString() } : item
    );

    const updatedChecklist = {
      ...checklist,
      items: updatedItems,
      updatedAt: new Date().toISOString()
    };

    try {
      await storageService.saveChecklist(updatedChecklist);
      setChecklist(updatedChecklist);
    } catch (error) {
      console.error('Feil ved oppdatering av notater:', error);
      setSnackbar({
        open: true,
        message: 'Feil ved oppdatering av notater',
        severity: 'error'
      });
    }
  };

  const handleImageUpload = async (itemId: string, file: File) => {
    if (!checklist) return;

    try {
      const imageRef = await storageService.uploadImage(file);
      const updatedItems = checklist.items.map(item =>
        item.id === itemId
          ? { ...item, imageRefs: [...item.imageRefs, imageRef], timestamp: new Date().toISOString() }
          : item
      );

      const updatedChecklist = {
        ...checklist,
        items: updatedItems,
        updatedAt: new Date().toISOString()
      };

      await storageService.saveChecklist(updatedChecklist);
      setChecklist(updatedChecklist);
      setSnackbar({
        open: true,
        message: 'Bilde lastet opp',
        severity: 'success'
      });
    } catch (error) {
      console.error('Feil ved opplasting av bilde:', error);
      setSnackbar({
        open: true,
        message: 'Feil ved opplasting av bilde',
        severity: 'error'
      });
    }
  };

  const handleDeleteImage = async (itemId: string, imageRef: string) => {
    if (!checklist) return;

    try {
      await storageService.deleteImage(imageRef);
      const updatedItems = checklist.items.map(item =>
        item.id === itemId
          ? {
              ...item,
              imageRefs: item.imageRefs.filter(ref => ref !== imageRef),
              timestamp: new Date().toISOString()
            }
          : item
      );

      const updatedChecklist = {
        ...checklist,
        items: updatedItems,
        updatedAt: new Date().toISOString()
      };

      await storageService.saveChecklist(updatedChecklist);
      setChecklist(updatedChecklist);
      setSnackbar({
        open: true,
        message: 'Bilde slettet',
        severity: 'success'
      });
    } catch (error) {
      console.error('Feil ved sletting av bilde:', error);
      setSnackbar({
        open: true,
        message: 'Feil ved sletting av bilde',
        severity: 'error'
      });
    }
  };

  const handleSubmit = async () => {
    if (!checklist) return;

    const updatedChecklist = {
      ...checklist,
      status: 'completed',
      updatedAt: new Date().toISOString()
    };

    try {
      await storageService.saveChecklist(updatedChecklist);
      setChecklist(updatedChecklist);
      setSnackbar({
        open: true,
        message: 'Sjekkliste fullført',
        severity: 'success'
      });
      navigate('/');
    } catch (error) {
      console.error('Feil ved fullføring av sjekkliste:', error);
      setSnackbar({
        open: true,
        message: 'Feil ved fullføring av sjekkliste',
        severity: 'error'
      });
    }
  };

  const handleEmail = async () => {
    if (!checklist) return;

    try {
      const pdfBlob = await generatePDF(checklist);
      const emailSubject = `Sjekkliste for ${checklist.solparkName} - Område ${checklist.areaNumber}`;
      const emailBody = `Vedlagt finner du sjekklisten for ${checklist.solparkName} - Område ${checklist.areaNumber}.\n\nMed vennlig hilsen,\n${checklist.inspectors.join(', ')}`;
      
      const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      window.location.href = mailtoLink;
    } catch (error) {
      console.error('Feil ved generering av PDF:', error);
      setSnackbar({
        open: true,
        message: 'Feil ved generering av PDF',
        severity: 'error'
      });
    }
  };

  const handleDownload = async () => {
    if (!checklist) return;

    try {
      const pdfBlob = await generatePDF(checklist);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sjekkliste_${checklist.solparkName}_omrade_${checklist.areaNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Feil ved nedlasting av PDF:', error);
      setSnackbar({
        open: true,
        message: 'Feil ved nedlasting av PDF',
        severity: 'error'
      });
    }
  };

  if (!checklist) {
    return (
      <Container>
        <Typography>Laster...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Sjekkliste - {checklist.solparkName}
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1">
              Område: {checklist.areaNumber}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1">
              Dato: {new Date(checklist.inspectionDate).toLocaleDateString('nb-NO')}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1">
              Inspektører: {checklist.inspectors.join(', ')}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <List>
        {checklist.items.map((item) => (
          <ListItem
            key={item.id}
            button
            onClick={() => handleItemClick(item)}
            sx={{
              mb: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <ListItemText
              primary={item.checkPoint}
              secondary={
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Status: {item.status || 'Ikke sjekket'}
                  </Typography>
                  {item.notes && (
                    <Typography variant="body2" color="text.secondary">
                      Notater: {item.notes}
                    </Typography>
                  )}
                  {item.imageRefs.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      {item.imageRefs.map((imageRef, index) => (
                        <Card key={index} sx={{ maxWidth: 100 }}>
                          <CardMedia
                            component="img"
                            height="100"
                            image={imageRef}
                            alt={`Bilde ${index + 1}`}
                          />
                        </Card>
                      ))}
                    </Box>
                  )}
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>

      <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={checklist.status === 'completed'}
        >
          Fullfør sjekkliste
        </Button>
        <Button
          variant="outlined"
          startIcon={<EmailIcon />}
          onClick={handleEmail}
          disabled={checklist.status !== 'completed'}
        >
          Send på e-post
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          disabled={checklist.status !== 'completed'}
        >
          Last ned PDF
        </Button>
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {selectedItem && (
          <>
            <DialogTitle>{selectedItem.checkPoint}</DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={selectedItem.status || ''}
                    onChange={(e) =>
                      handleStatusChange(
                        selectedItem.id,
                        e.target.value as 'OK' | 'Avvik' | 'Anbefalt tiltak' | 'Ikke aktuelt' | null
                      )
                    }
                  >
                    <MenuItem value="">Velg status</MenuItem>
                    <MenuItem value="OK">OK</MenuItem>
                    <MenuItem value="Avvik">Avvik</MenuItem>
                    <MenuItem value="Anbefalt tiltak">Anbefalt tiltak</MenuItem>
                    <MenuItem value="Ikke aktuelt">Ikke aktuelt</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Notater"
                value={selectedItem.notes}
                onChange={(e) => handleNotesChange(selectedItem.id, e.target.value)}
                sx={{ mb: 3 }}
              />

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Bilder
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {selectedItem.imageRefs.map((imageRef, index) => (
                    <Card key={index} sx={{ maxWidth: 200 }}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={imageRef}
                        alt={`Bilde ${index + 1}`}
                      />
                      <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteImage(selectedItem.id, imageRef)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Card>
                  ))}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="image-upload"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(selectedItem.id, file);
                    }
                  }}
                />
                <label htmlFor="image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<PhotoCamera />}
                  >
                    Last opp bilde
                  </Button>
                </label>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Lukk</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity as 'success' | 'error'}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
} 