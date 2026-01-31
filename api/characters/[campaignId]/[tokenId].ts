import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put, del, list } from '@vercel/blob';

/**
 * Serverless function for character/lore token data
 * 
 * GET - Load character data
 * PUT - Save character data
 * DELETE - Delete character data
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS - restrict to specific origins in production
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
  const origin = req.headers.origin || '';
  
  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins.includes('*') ? '*' : origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { campaignId, tokenId } = req.query;

  if (!campaignId || !tokenId || Array.isArray(campaignId) || Array.isArray(tokenId)) {
    return res.status(400).json({ error: 'Invalid campaignId or tokenId' });
  }

  const blobPath = `characters/${campaignId}/${tokenId}.json`;

  try {
    if (req.method === 'GET') {
      // Load character data using Vercel Blob SDK
      try {
        // List blobs to check if the file exists and get its URL
        const { blobs } = await list({ prefix: blobPath, limit: 1 });
        
        if (blobs.length === 0) {
          return res.status(404).json({ error: 'Character data not found' });
        }

        // Fetch the blob content using the download URL
        const response = await fetch(blobs[0].downloadUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.statusText}`);
        }

        const data = await response.json();
        return res.status(200).json(data);
      } catch (error) {
        console.error('Error loading character data:', error);
        return res.status(404).json({ error: 'Character data not found' });
      }
    }

    if (req.method === 'PUT') {
      // Save character data
      const characterData = req.body;

      if (!characterData) {
        return res.status(400).json({ error: 'No character data provided' });
      }

      const blob = await put(blobPath, JSON.stringify(characterData), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
      });

      return res.status(200).json({ 
        success: true, 
        url: blob.url,
        path: blobPath 
      });
    }

    if (req.method === 'DELETE') {
      // Delete character data
      await del(blobPath);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in character API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
