export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  let data;
  try {
    data = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const {
    ticketNum, actDate, timeStart, timeEnd,
    orgName, orgAddress, contactName, contactPhone,
    model, serial, ipAddr, firmware, cntBW, cntColor,
    workTypes, workComment, deviceState, result,
    parts, engineerName, clientName, managerEmail,
    signatureData
  } = data;

  if (!managerEmail) {
    return new Response(JSON.stringify({ error: 'Email менеджера не указан' }), { status: 400 });
  }

  // Формируем таблицу запчастей
  const partsRows = (parts || []).filter(p => p.name || p.pn).map(p => `
    <tr>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;">${p.pn || '—'}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;">${p.name || '—'}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center;">${p.installed || '—'}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center;">${p.needed || '—'}</td>
    </tr>
  `).join('');

  const partsTable = partsRows ? `
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:8px;">
      <thead>
        <tr style="background:#f0f5ff;">
          <th style="padding:7px 10px;text-align:left;color:#1a3a5c;font-size:11px;">Каталожный №</th>
          <th style="padding:7px 10px;text-align:left;color:#1a3a5c;font-size:11px;">Название</th>
          <th style="padding:7px 10px;color:#1a3a5c;font-size:11px;">Уст.</th>
          <th style="padding:7px 10px;color:#1a3a5c;font-size:11px;">Треб.</th>
        </tr>
      </thead>
      <tbody>${partsRows}</tbody>
    </table>
  ` : '<p style="color:#999;font-size:13px;">Не указано</p>';

  // Подпись клиента
  const sigBlock = signatureData
    ? `<img src="${signatureData}" style="max-width:200px;height:70px;border:1px dashed #ccc;border-radius:6px;object-fit:contain;background:#fafbff;">`
    : '<span style="color:#999;font-size:13px;">Подпись не получена</span>';

  // Форматируем дату
  const dateFormatted = actDate ? new Date(actDate).toLocaleDateString('ru-RU') : '—';

  const stateColor = deviceState?.includes('301') ? '#1a7a40' : deviceState?.includes('303') ? '#c00' : '#b85c00';
  const stateBg = deviceState?.includes('301') ? '#e6f9ef' : deviceState?.includes('303') ? '#fee' : '#fff3e0';

  const htmlBody = `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

  <!-- Шапка -->
  <tr>
    <td style="background:#1a3a5c;padding:20px 28px;">
      <table width="100%"><tr>
        <td>
          <div style="color:white;font-size:18px;font-weight:700;">Акт Выполненных Работ</div>
          <div style="color:rgba(255,255,255,0.65);font-size:12px;margin-top:3px;">Сформирован автоматически</div>
        </td>
        <td align="right">
          <div style="color:white;font-size:22px;font-weight:700;">№ ${ticketNum || '—'}</div>
          <div style="color:rgba(255,255,255,0.65);font-size:12px;">${dateFormatted}</div>
        </td>
      </tr></table>
    </td>
  </tr>

  <tr><td style="padding:24px 28px;">

    <!-- Заказчик -->
    <div style="font-size:11px;font-weight:700;color:#1a3a5c;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #e8f0f8;">Заказчик</div>
    <table width="100%" style="margin-bottom:20px;font-size:13px;">
      <tr>
        <td width="50%" style="padding-bottom:8px;"><span style="color:#888;font-size:11px;">Организация</span><br><strong>${orgName || '—'}</strong></td>
        <td width="50%" style="padding-bottom:8px;"><span style="color:#888;font-size:11px;">Адрес</span><br><strong>${orgAddress || '—'}</strong></td>
      </tr>
      <tr>
        <td style="padding-bottom:8px;"><span style="color:#888;font-size:11px;">Контактное лицо</span><br><strong>${contactName || '—'}</strong></td>
        <td style="padding-bottom:8px;"><span style="color:#888;font-size:11px;">Телефон</span><br><strong>${contactPhone || '—'}</strong></td>
      </tr>
    </table>

    <!-- Оборудование -->
    <div style="font-size:11px;font-weight:700;color:#1a3a5c;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #e8f0f8;">Оборудование</div>
    <table width="100%" style="margin-bottom:20px;font-size:13px;">
      <tr>
        <td width="33%" style="padding-bottom:8px;"><span style="color:#888;font-size:11px;">Модель</span><br><strong>${model || '—'}</strong></td>
        <td width="33%" style="padding-bottom:8px;"><span style="color:#888;font-size:11px;">Серийный №</span><br><strong>${serial || '—'}</strong></td>
        <td width="33%" style="padding-bottom:8px;"><span style="color:#888;font-size:11px;">IP адрес</span><br><strong>${ipAddr || '—'}</strong></td>
      </tr>
      <tr>
        <td style="padding-bottom:8px;"><span style="color:#888;font-size:11px;">Счётчик Ч/Б</span><br><strong>${cntBW || '—'}</strong></td>
        <td style="padding-bottom:8px;"><span style="color:#888;font-size:11px;">Счётчик Цвет</span><br><strong>${cntColor || '—'}</strong></td>
        <td style="padding-bottom:8px;"><span style="color:#888;font-size:11px;">Прошивка</span><br><strong>${firmware || '—'}</strong></td>
      </tr>
    </table>

    <!-- Тип работ и состояние -->
    <table width="100%" style="margin-bottom:20px;">
      <tr>
        <td width="50%" valign="top">
          <div style="font-size:11px;font-weight:700;color:#1a3a5c;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #e8f0f8;">Тип работ</div>
          <div style="font-size:13px;">${(workTypes || []).join(', ') || '—'}</div>
          ${workComment ? `<div style="margin-top:8px;font-size:12px;color:#555;">${workComment}</div>` : ''}
        </td>
        <td width="10%"></td>
        <td width="40%" valign="top">
          <div style="font-size:11px;font-weight:700;color:#1a3a5c;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #e8f0f8;">Состояние</div>
          <span style="background:${stateBg};color:${stateColor};padding:5px 12px;border-radius:20px;font-size:12px;font-weight:700;">${deviceState || '—'}</span>
        </td>
      </tr>
    </table>

    <!-- Запчасти -->
    <div style="font-size:11px;font-weight:700;color:#1a3a5c;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #e8f0f8;">Заменённые детали</div>
    <div style="margin-bottom:20px;">${partsTable}</div>

    <!-- Результат -->
    <div style="font-size:11px;font-weight:700;color:#1a3a5c;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #e8f0f8;">Результат</div>
    <div style="margin-bottom:20px;">
      <span style="background:#e6f9ef;color:#1a7a40;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;">${result || '—'}</span>
    </div>

    <!-- Время и инженер -->
    <table width="100%" style="margin-bottom:20px;font-size:13px;">
      <tr>
        <td width="40%"><span style="color:#888;font-size:11px;">Инженер</span><br><strong>${engineerName || '—'}</strong></td>
        <td width="30%"><span style="color:#888;font-size:11px;">Начало работ</span><br><strong>${timeStart || '—'}</strong></td>
        <td width="30%"><span style="color:#888;font-size:11px;">Завершение</span><br><strong>${timeEnd || '—'}</strong></td>
      </tr>
    </table>

    <!-- Подписи -->
    <div style="font-size:11px;font-weight:700;color:#1a3a5c;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #e8f0f8;">Подписи</div>
    <table width="100%">
      <tr>
        <td width="50%" valign="top" style="padding-right:16px;">
          <div style="font-size:11px;color:#888;margin-bottom:4px;">Представитель клиента</div>
          <div style="font-size:13px;font-weight:700;margin-bottom:8px;">${clientName || '—'}</div>
          ${sigBlock}
        </td>
        <td width="50%" valign="top">
          <div style="font-size:11px;color:#888;margin-bottom:4px;">Инженер (исполнитель)</div>
          <div style="font-size:13px;font-weight:700;margin-bottom:8px;">${engineerName || '—'}</div>
          <div style="width:160px;height:50px;border:1px dashed #ccc;border-radius:6px;background:#fafbff;"></div>
        </td>
      </tr>
    </table>

  </td></tr>

  <!-- Футер -->
  <tr>
    <td style="background:#f8f9fb;padding:14px 28px;border-top:1px solid #eee;">
      <table width="100%"><tr>
        <td style="font-size:11px;color:#999;">Сформировано: ${new Date().toLocaleString('ru-RU')}</td>
        <td align="right" style="font-size:11px;color:#999;">printer-act.vercel.app</td>
      </tr></table>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>
  `;

  // Отправка через Resend
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY не настроен' }), { status: 500 });
  }

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Акты <onboarding@resend.dev>',
      to: [managerEmail],
      subject: `Акт №${ticketNum || '—'} | ${orgName || '—'} | ${model || '—'} | ${dateFormatted}`,
      html: htmlBody
    })
  });

  if (!resendRes.ok) {
    const err = await resendRes.json().catch(() => ({}));
    return new Response(JSON.stringify({ error: err.message || 'Ошибка Resend' }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
