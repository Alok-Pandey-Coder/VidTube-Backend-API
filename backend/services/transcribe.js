import { openAsBlob } from 'fs';

const URL_ = process.env.TRANSCRIBE_URL || 'https://api.groq.com/openai/v1/audio/transcriptions';
const MODEL = process.env.TRANSCRIBE_MODEL || 'whisper-large-v3-turbo';

export async function transcribeAudio(filePath) {
  const key = process.env.TRANSCRIBE_API_KEY;
  if (!key) throw new Error('TRANSCRIBE_API_KEY not set');

  const form = new FormData();
  form.append('file', await openAsBlob(filePath), 'audio.mp3');
  form.append('model', MODEL);
  form.append('response_format', 'verbose_json');

  const res = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
    signal: AbortSignal.timeout(5 * 60 * 1000),
  });
  if (!res.ok) throw new Error(`transcribe ${res.status}: ${(await res.text()).slice(0, 200)}`);

  const data = await res.json();
  return {
    language: data.language,
    text: data.text,
    segments: (data.segments || []).map((s) => ({
      start: s.start,
      end: s.end,
      text: String(s.text).trim(),
    })),
  };
}

const ts = (sec) => {
  const ms = Math.round(sec * 1000);
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor((ms % 3600000) / 60000))}:${p(Math.floor((ms % 60000) / 1000))}.${p(ms % 1000, 3)}`;
};

export const toVtt = (segments) =>
  'WEBVTT\n\n' +
  segments.map((s, i) => `${i + 1}\n${ts(s.start)} --> ${ts(s.end)}\n${s.text}\n`).join('\n');