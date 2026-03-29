export class WhisperClient {
  async transcribe(blob: Blob, apiKey: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', blob, 'chunk.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`Whisper API error ${response.status}: ${errorText}`);
    }

    const data = await response.json() as { text: string };
    return data.text.trim();
  }
}
