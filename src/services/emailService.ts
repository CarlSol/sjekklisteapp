import type { ChecklistItem } from '../types/Checklist';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

// Konfigurasjon for e-post-tjenesten
const EMAIL_SERVICE_URL = import.meta.env.VITE_EMAIL_SERVICE_URL || 'http://localhost:3001/api/email';

interface EmailData {
  to: string;
  subject: string;
  text: string;
  html: string;
  checklistItems: ChecklistItem[];
}

export const sendChecklistEmail = async (emailData: EmailData): Promise<void> => {
  try {
    const response = await fetch(EMAIL_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      throw new Error(`E-post-tjenesten svarte med status ${response.status}`);
    }
  } catch (error) {
    console.error('Feil ved sending av e-post:', error);
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