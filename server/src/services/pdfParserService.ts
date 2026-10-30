import * as pdfParseModule from 'pdf-parse';

const pdfParse = ((pdfParseModule as any).default || pdfParseModule) as (buf: Buffer) => Promise<{ text: string }>;

export async function extractTextFromBuffer(buffer: Buffer, originalFilename: string = '', mimeType: string = ''): Promise<string> {
  const isPdf = originalFilename.toLowerCase().endsWith('.pdf') || mimeType === 'application/pdf';

  if (isPdf) {
    try {
      const data = await pdfParse(buffer);
      if (data && data.text && data.text.trim().length > 0) {
        return data.text.trim();
      }
    } catch (err: any) {
      console.warn('pdf-parse encountered error, attempting raw text extraction:', err?.message || err);
      // Fallback: extract printable strings from raw buffer if pdf stream parser fails
      const rawString = buffer.toString('utf-8');
      const cleanAscii = rawString.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleanAscii.length > 50) {
        return cleanAscii;
      }
      throw new Error('Unable to extract text from the uploaded PDF document. Please verify the file is not encrypted or password-protected.');
    }
  }

  // Text or Markdown
  return buffer.toString('utf-8').trim();
}
