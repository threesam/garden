export class WhisperClient {
  /**
   * @param baseUrl OpenAI-compatible base URL (default: https://api.openai.com).
   *                Set to e.g. http://localhost:8000 for faster-whisper-server.
   * @param apiKey  API key sent as Bearer token. Empty string is fine for local servers.
   */
  async transcribe(blob: Blob, apiKey: string, baseUrl = 'https://api.openai.com'): Promise<string> {
    const formData = new FormData();
    formData.append('file', blob, 'chunk.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en'); // hardcoded; add to VoiceJournalSettings if multi-language needed

    const headers: Record<string, string> = {};
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const response = await fetch(`${baseUrl}/v1/audio/transcriptions`, {
      method: 'POST',
      headers,
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
