import type { ChecklistItem } from '../types/Checklist';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import sgMail from '@sendgrid/mail';

// Konfigurasjon for SendGrid
const SENDGRID_API_KEY = import.meta.env.VITE_SENDGRID_API_KEY;
const EMAIL_FROM = import.meta.env.VITE_EMAIL_FROM;
const EMAIL_TO = import.meta.env.VITE_EMAIL_TO;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

interface EmailData {
  to: string;
  subject: string;
  text: string;
  html: string;
  checklistItems: ChecklistItem[];
}

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

export const generateEmailContent = (checklistItems: ChecklistItem[]): { text: string; html: string } => {
  const date = format(new Date(), 'dd.MM.yyyy', { locale: nb });
  const time = format(new Date(), 'HH:mm', { locale: nb });

  const textContent = `
Sjekkliste - ${date} ${time}

${checklistItems.map(item => `${item.status === 'OK' ? '✓' : '✗'} ${item.checkPoint}`).join('\n')}

Sendt fra SjekklisteApp
`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .header { margin-bottom: 20px; }
    .item { margin: 5px 0; }
    .checked { color: #2e7d32; }
    .unchecked { color: #c62828; }
    .footer { margin-top: 20px; font-size: 0.9em; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h2>Sjekkliste - ${date} ${time}</h2>
  </div>
  <div class="items">
    ${checklistItems.map(item => `
      <div class="item ${item.status === 'OK' ? 'checked' : 'unchecked'}">
        ${item.status === 'OK' ? '✓' : '✗'} ${item.checkPoint}
      </div>
    `).join('')}
  </div>
  <div class="footer">
    <p>Sendt fra SjekklisteApp</p>
  </div>
</body>
</html>
`;

  return { text: textContent, html: htmlContent };
}; 