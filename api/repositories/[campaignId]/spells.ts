import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put, head } from '@vercel/blob';

/**
 * Serverless function for custom spells repository
 * 
 * GET - Load custom spells for a campaign
 * PUT - Save/update custom spells
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { campaignId } = req.query;

  if (!campaignId || Array.isArray(campaignId)) {
    return res.status(400).json({ error: 'Invalid campaignId' });
  }

  const blobPath = `repositories/${campaignId}/custom-spells.json`;

  try {
    if (req.method === 'GET') {
      // Load custom spells
      try {
        const blobUrl = `${process.env.BLOB_READ_WRITE_TOKEN}/${blobPath}`;
        const response = await fetch(blobUrl);
        
        if (!response.ok) {
          if (response.status === 404) {
            // Return empty array if no custom spells exist yet
            return res.status(200).json([]);
          }
          throw new Error(`Failed to fetch blob: ${response.statusText}`);
        }

        const data = await response.json();
        return res.status(200).json(data);
      } catch (error) {
        console.error('Error loading custom spells:', error);
        // Return empty array on error
        return res.status(200).json([]);
      }
    }

    if (req.method === 'PUT') {
      // Save custom spells
      const customSpells = req.body;

      if (!Array.isArray(customSpells)) {
        return res.status(400).json({ error: 'Custom spells must be an array' });
      }

      const blob = await put(blobPath, JSON.stringify(customSpells), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
      });

      return res.status(200).json({ 
        success: true, 
        url: blob.url,
        path: blobPath,
        count: customSpells.length
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in spells repository API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
