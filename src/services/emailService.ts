import sgMail from '@sendgrid/mail';
import type { Checklist, ChecklistItem } from '../types/Checklist';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Konfigurasjon for SendGrid
const SENDGRID_API_KEY = import.meta.env.VITE_SENDGRID_API_KEY;
const EMAIL_FROM = import.meta.env.VITE_EMAIL_FROM;
const EMAIL_TO = import.meta.env.VITE_EMAIL_TO;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface EmailData {
  to: string;
  subject: string;
  text: string;
  html: string;
  checklistItems: ChecklistItem[];
}

export const generatePDF = async (checklist: Checklist): Promise<Blob> => {
  try {
    console.log('Starter PDF-generering for sjekkliste:', checklist.id);
    
    // Valider input
    if (!checklist || !checklist.items || checklist.items.length === 0) {
      throw new Error('Ugyldig sjekkliste: Mangler data eller sjekkpunkter');
    }

    // Opprett PDF-dokument
    const doc = new jsPDF();
    
    // Tittel
    doc.setFontSize(16);
    doc.text(`Sjekkliste - ${checklist.solparkName || 'Ukjent solpark'}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Område ${checklist.areaNumber || 'Ukjent'}`, 14, 30);
    
    // Metadata
    doc.setFontSize(10);
    doc.text(`Dato: ${new Date().toLocaleDateString('nb-NO')}`, 14, 40);
    doc.text(`Inspektør: ${checklist.inspectors?.join(', ') || 'Ikke spesifisert'}`, 14, 45);
    
    // Tabell
    const tableData = checklist.items.map((item: ChecklistItem) => [
      item.id || '',
      item.checkPoint || '',
      item.status || 'Ikke sjekket',
      item.notes || '',
      item.timestamp ? new Date(item.timestamp).toLocaleString('nb-NO') : ''
    ]);
    
    // Legg til tabell
    (doc as any).autoTable({
      startY: 50,
      head: [['ID', 'Sjekkpunkt', 'Status', 'Notater', 'Tidspunkt']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
      margin: { top: 50 }
    });
    
    // Konverter til Blob
    const pdfOutput = doc.output('blob');
    console.log('PDF generert med størrelse:', pdfOutput.size);
    
    if (!pdfOutput || pdfOutput.size === 0) {
      throw new Error('PDF-generering feilet: Tomt dokument');
    }
    
    return pdfOutput;
  } catch (error) {
    console.error('Feil ved PDF-generering:', error);
    throw new Error(`Kunne ikke generere PDF: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
  }
};

export const generateEmailContent = (items: ChecklistItem[]): { text: string; html: string } => {
  const text = items
    .map((item) => `${item.id}: ${item.checkPoint} - Status: ${item.status || 'Ikke sjekket'}`)
    .join('\n');

  const html = `
    <h2>Sjekkliste Resultater</h2>
    <table border="1" cellpadding="5" style="border-collapse: collapse;">
      <tr>
        <th>ID</th>
        <th>Sjekkpunkt</th>
        <th>Status</th>
        <th>Notater</th>
        <th>Tidspunkt</th>
      </tr>
      ${items
        .map(
          (item) => `
        <tr>
          <td>${item.id}</td>
          <td>${item.checkPoint}</td>
          <td>${item.status || 'Ikke sjekket'}</td>
          <td>${item.notes || ''}</td>
          <td>${item.timestamp ? new Date(item.timestamp).toLocaleString('nb-NO') : ''}</td>
        </tr>
      `
        )
        .join('')}
    </table>
  `;

  return { text, html };
};

export const sendChecklistEmail = async (emailData: EmailData): Promise<void> => {
  try {
    if (!SENDGRID_API_KEY) {
      console.error('SendGrid API-nøkkel mangler. Sjekk at VITE_SENDGRID_API_KEY er satt i .env-filen.');
      throw new Error('SendGrid API-nøkkel er ikke konfigurert. Vennligst kontakt administrator.');
    }

    if (!EMAIL_FROM) {
      console.error('Avsender-e-post mangler. Sjekk at VITE_EMAIL_FROM er satt i .env-filen.');
      throw new Error('Avsender-e-post er ikke konfigurert. Vennligst kontakt administrator.');
    }

    if (!EMAIL_TO) {
      console.error('Mottaker-e-post mangler. Sjekk at VITE_EMAIL_TO er satt i .env-filen.');
      throw new Error('Mottaker-e-post er ikke konfigurert. Vennligst kontakt administrator.');
    }

    const msg = {
      to: emailData.to || EMAIL_TO,
      from: EMAIL_FROM,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
    };

    console.log('Forsøker å sende e-post med følgende data:', {
      to: msg.to,
      from: msg.from,
      subject: msg.subject,
    });

    try {
      await sgMail.send(msg);
      console.log('E-post sendt vellykket');
    } catch (sendError: any) {
      console.error('SendGrid API feil:', {
        statusCode: sendError.code,
        message: sendError.message,
        response: sendError.response?.body
      });
      
      if (sendError.code === 401) {
        throw new Error('Ugyldig API-nøkkel. Vennligst sjekk SendGrid API-nøkkelen.');
      } else if (sendError.code === 403) {
        throw new Error('Ingen tilgang til SendGrid API. Vennligst sjekk API-nøkkelens tillatelser.');
      } else if (sendError.code === 429) {
        throw new Error('For mange forespørsler. Vennligst prøv igjen senere.');
      } else {
        throw new Error(`SendGrid API feil: ${sendError.message}`);
      }
    }
  } catch (error) {
    console.error('Detaljert feil ved sending av e-post:', error);
    if (error instanceof Error) {
      throw new Error(`Kunne ikke sende e-post: ${error.message}`);
    }
    throw new Error('Kunne ikke sende e-post. Vennligst prøv igjen senere.');
  }
}; 