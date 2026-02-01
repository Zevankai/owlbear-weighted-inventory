import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put, list } from '@vercel/blob';

/**
 * Serverless function for custom items repository
 * 
 * GET - Load custom items for a campaign
 * PUT - Save/update custom items
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS - restrict to specific origins in production
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
  const origin = req.headers.origin || '';
  
  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins.includes('*') ? '*' : origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { campaignId } = req.query;

  if (!campaignId || Array.isArray(campaignId)) {
    return res.status(400).json({ error: 'Invalid campaignId' });
  }

  const blobPath = `repositories/${campaignId}/custom-items.json`;

  try {
    if (req.method === 'GET') {
      // Load custom items using Vercel Blob SDK
      try {
        // List blobs to check if the file exists and get its URL
        const { blobs } = await list({ prefix: blobPath, limit: 1 });
        
        if (blobs.length === 0) {
          // Return empty array if no custom items exist yet
          return res.status(200).json([]);
        }

        // Fetch the blob content using the download URL
        const response = await fetch(blobs[0].downloadUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.statusText}`);
        }

        const data = await response.json();
        return res.status(200).json(data);
      } catch (error) {
        console.error('Error loading custom items:', error);
        // Return empty array on error
        return res.status(200).json([]);
      }
    }

    if (req.method === 'PUT') {
      // Save custom items
      const customItems = req.body;
      
      console.log('[items API] PUT request:', {
        campaignId,
        itemCount: Array.isArray(customItems) ? customItems.length : 'invalid',
        bodySize: JSON.stringify(customItems).length,
      });

      if (!Array.isArray(customItems)) {
        console.error('[items API] Invalid body - not an array');
        return res.status(400).json({ error: 'Custom items must be an array' });
      }

      try {
        // Note: Using 'public' access since Owlbear Rodeo is a collaborative platform
        // where players share game resources. Custom items are campaign-specific.
        const blob = await put(blobPath, JSON.stringify(customItems), {
          access: 'public',
          contentType: 'application/json',
          addRandomSuffix: false,
        });

        console.log('[items API] Successfully saved to blob:', blob.url);
        
        return res.status(200).json({ 
          success: true, 
          url: blob.url,
          path: blobPath,
          count: customItems.length
        });
      } catch (blobError) {
        console.error('[items API] Vercel Blob put() failed:', {
          error: blobError,
          message: blobError instanceof Error ? blobError.message : 'Unknown error',
          stack: blobError instanceof Error ? blobError.stack : undefined,
        });
        
        return res.status(500).json({ 
          error: 'Failed to save to blob storage',
          message: blobError instanceof Error ? blobError.message : 'Unknown error'
        });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in items repository API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
