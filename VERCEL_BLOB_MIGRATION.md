# Vercel Blob Storage Migration

This document explains the migration from Owlbear Rodeo's built-in metadata storage to Vercel Blob storage.

## Overview

The extension now uses Vercel Blob storage as the primary backend for persistent data storage, with OBR metadata serving as a local cache and fallback. This eliminates the 16KB per-token limit and provides more scalable storage.

## Architecture

### Storage Service (`src/services/storageService.ts`)
The storage service provides a unified interface for data persistence:
- **Hybrid Approach**: Saves to both Vercel Blob (source of truth) and OBR metadata (cache)
- **Graceful Fallback**: If Vercel Blob fails, falls back to OBR metadata
- **Type-Safe**: Uses existing TypeScript interfaces

### API Routes (`/api`)
Serverless functions handle data persistence:

#### Character Data
- `GET /api/characters/[campaignId]/[tokenId]` - Load character/token data
- `PUT /api/characters/[campaignId]/[tokenId]` - Save character/token data
- `DELETE /api/characters/[campaignId]/[tokenId]` - Delete character data

#### Custom Repositories
- `GET /api/repositories/[campaignId]/items` - Load custom items
- `PUT /api/repositories/[campaignId]/items` - Save custom items
- `GET /api/repositories/[campaignId]/spells` - Load custom spells
- `PUT /api/repositories/[campaignId]/spells` - Save custom spells

### Repository Context (`src/context/RepositoryContext.tsx`)
Manages custom items and spells:
- Loads custom repositories on app initialization
- Merges custom items/spells with built-in repositories
- Provides functions to add/update custom items/spells
- All search functionality remains client-side

## Storage Structure

```
characters/{campaignId}/{tokenId}.json          # Character/lore token data
repositories/{campaignId}/custom-items.json      # GM's custom items
repositories/{campaignId}/custom-spells.json     # GM's custom spells
```

## Environment Setup

### Required Environment Variables
Set the following environment variables in your Vercel project:

```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
ALLOWED_ORIGINS=https://your-owlbear-domain.com,https://another-allowed-origin.com
```

**Note**: `ALLOWED_ORIGINS` is optional. If not set, CORS will allow all origins (*). In production, it's recommended to set specific allowed origins for security.

## Usage

### Character Data
The `useInventory` hook automatically uses the storage service:
```typescript
// Load character data (automatically uses Vercel Blob + OBR metadata cache)
const { characterData, updateData } = useInventory();

// Update data (saves to both Vercel Blob and OBR metadata)
updateData({ inventory: newInventory });
```

### Custom Repositories
Use the repository context to access merged repositories:
```typescript
import { useRepository } from './context/RepositoryContext';

function MyComponent() {
  const { 
    itemRepository,      // Built-in + custom items
    spellRepository,     // Built-in + custom spells
    addCustomItem,       // Add a custom item
    addCustomSpell       // Add a custom spell
  } = useRepository();
}
```

## Migration Path

1. **Backwards Compatible**: Existing OBR metadata continues to work
2. **Automatic Migration**: On first load, data is migrated to Vercel Blob
3. **Hybrid Storage**: Both systems are updated on every save
4. **Fallback**: If Vercel Blob is unavailable, OBR metadata is used

## Key Features

### 1. No Size Limits
- Vercel Blob storage eliminates the 16KB per-token limit
- Large character sheets with extensive data are now supported

### 2. Campaign-Scoped Custom Repositories
- GMs can create custom items/spells per campaign
- Custom content is automatically merged with built-in repositories
- All search functionality works seamlessly

### 3. Graceful Degradation
- If Vercel Blob is unavailable, the extension falls back to OBR metadata
- No data loss or functionality degradation

### 4. Type Safety
- All storage operations use existing TypeScript types
- Type-safe interfaces prevent data corruption

### 5. Security
- Uses Vercel Blob SDK methods for secure API access (no token exposure)
- CORS can be restricted to specific allowed origins via `ALLOWED_ORIGINS` environment variable
- Blob access is public (downloadUrl), but only the API endpoints can write data

## Testing

To test the implementation:

1. **Local Development**:
   ```bash
   npm run dev
   ```

2. **Build**:
   ```bash
   npm run build
   ```

3. **Deploy to Vercel**:
   - Ensure `BLOB_READ_WRITE_TOKEN` environment variable is set
   - Deploy via Vercel CLI or GitHub integration

## Future Enhancements

Possible future improvements:
- Add versioning for character data
- Implement data compression for large datasets
- Add data export/import functionality
- Implement conflict resolution for simultaneous edits
