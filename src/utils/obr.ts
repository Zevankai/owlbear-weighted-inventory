import OBR from '@owlbear-rodeo/sdk';

/**
 * Wait for OBR to be ready
 * Provides a consistent Promise-based pattern for OBR initialization
 * @returns Promise that resolves when OBR is ready
 */
export const waitForOBR = (): Promise<void> => 
  new Promise(resolve => OBR.onReady(() => resolve()));
