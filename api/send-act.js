export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = req.body;
  const { ticketNum, actDate, orgName, model, managerEmail, pdfBase64 } = data;

  if (!managerEmail) return res.status(400).json({ error: 'Email менеджера не указан' });
  if (!pdfBase64) return res.status(400).json({ error: 'PDF не сформирован' });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return res.status(500).json({ error: 'RESEND_API_KEY не настроен' });

  const dateFormatted = actDate ? new Date(actDate).toLocaleDateString('ru-RU') : '---';
  const actNum = ticketNum || '---';

  const htmlBody = `<!DOCTYPE html>
<html lang="ru"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;">
  <tr><td style="background:#1a3a5c;padding:20px 28px;">
    <table width="100%"><tr>
      <td><div style="color:white;font-size:18px;font-weight:700;">Акт Выполненных Работ</div>
          <div style="color:rgba(255,255,255,0.65);font-size:12px;margin-top:3px;">PDF прикреплён к письму</div></td>
      <td align="right">
        <div style="color:white;font-size:22px;font-weight:700;">No. ${actNum}</div>
        <div style="color:rgba(255,255,255,0.65);font-size:12px;">${dateFormatted}</div>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:28px;">
    <p style="font-size:15px;color:#333;margin:0 0 12px;">Акт выполненных работ сформирован и прикреплён к письму в виде PDF файла.</p>
    <p style="font-size:13px;color:#666;margin:0;">Организация: <strong>${orgName || '---'}</strong> | Модель: <strong>${model || '---'}</strong></p>
  </td></tr>
  <tr><td style="background:#f8f9fb;padding:14px 28px;border-top:1px solid #eee;">
    <table width="100%"><tr>
      <td style="font-size:11px;color:#999;">Сформировано: ${new Date().toLocaleString('ru-RU')}</td>
      <td align="right" style="font-size:11px;color:#999;">printer-act.vercel.app</td>
    </tr></table>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Akty <onboarding@resend.dev>',
      to: [managerEmail],
      subject: `Akt No.${actNum} | ${orgName || '---'} | ${model || '---'} | ${dateFormatted}`,
      html: htmlBody,
      attachments: [{
        filename: `act_${actNum}.pdf`,
        content: pdfBase64
      }]
    })
  });

  if (!resendRes.ok) {
    const err = await resendRes.json().catch(() => ({}));
    return res.status(500).json({ error: err.message || 'Oshibka Resend', details: err });
  }

  const resendData = await resendRes.json().catch(() => ({}));
  return res.status(200).json({ ok: true, resend: resendData });
}
