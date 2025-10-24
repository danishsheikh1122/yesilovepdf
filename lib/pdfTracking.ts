// PDF Tracking Utilities with Supabase
// Provides easy-to-use functions for logging PDF actions throughout the app

import { supabase } from '../utils/supabaseClient'

export type PdfAction = 
  | 'compress' 
  | 'merge' 
  | 'split' 
  | 'crop' 
  | 'rotate' 
  | 'edit' 
  | 'convert-to-jpg' 
  | 'convert-to-word' 
  | 'convert-to-powerpoint' 
  | 'convert-to-excel'
  | 'add-watermark' 
  | 'add-page-numbers' 
  | 'organize' 
  | 'remove-pages'
  | 'extract-pages'
  | 'scan-to-pdf'
  | 'html-to-pdf'
  | 'jpg-to-pdf'
  | 'word-to-pdf'
  | 'powerpoint-to-pdf'
  | 'excel-to-pdf'
  | 'other';

interface LogPdfUsageParams {
  pdfName?: string;
  actionType: PdfAction;
  fileSize?: number;
}

/**
 * Logs PDF usage to Supabase
 * Call this function whenever a user performs a PDF action
 */
export async function logPdfUsage({ 
  pdfName, 
  actionType, 
  fileSize 
}: LogPdfUsageParams): Promise<boolean> {
  try {
    // Get user's IP and user agent (will be handled by API route)
    const response = await fetch('/api/log-pdf-usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfName: pdfName || 'unknown.pdf',
        actionType,
        fileSize,
      }),
    });

    if (!response.ok) {
      console.error('Failed to log PDF usage:', response.statusText);
      return false;
    }

    const result = await response.json();
    console.log('PDF usage logged:', result.logged);
    return true;

  } catch (error) {
    console.error('Error logging PDF usage:', error);
    return false;
  }
}

/**
 * Fetches total usage statistics from Supabase
 */
export async function getTotalUsage() {
  try {
    const response = await fetch('/api/get-total-usage');
    
    if (!response.ok) {
      throw new Error('Failed to fetch usage data');
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching usage data:', error);
    throw error;
  }
}

/**
 * Helper function to extract filename from File object or path
 */
export function extractFileName(file: File | string): string {
  if (typeof file === 'string') {
    return file.split('/').pop() || 'unknown.pdf';
  }
  return file.name || 'unknown.pdf';
}

/**
 * Helper function to get file size from File object
 */
export function getFileSize(file: File): number {
  return file.size;
}

/**
 * Convenience function for common PDF operations
 * Automatically extracts filename and size from File objects
 */
export async function trackPdfAction(
  action: PdfAction, 
  file?: File | string
): Promise<boolean> {
  const pdfName = file ? extractFileName(file) : undefined;
  const fileSize = file instanceof File ? getFileSize(file) : undefined;

  return logPdfUsage({
    pdfName,
    actionType: action,
    fileSize,
  });
}

// Example usage functions for different PDF operations
export const pdfTrackers = {
  compress: (file?: File | string) => trackPdfAction('compress', file),
  merge: (files?: File[] | string[]) => {
    const fileName = files && files.length > 0 
      ? `merged_${files.length}_files.pdf` 
      : 'merged_files.pdf';
    return trackPdfAction('merge', fileName);
  },
  split: (file?: File | string) => trackPdfAction('split', file),
  crop: (file?: File | string) => trackPdfAction('crop', file),
  rotate: (file?: File | string) => trackPdfAction('rotate', file),
  edit: (file?: File | string) => trackPdfAction('edit', file),
  convertToJpg: (file?: File | string) => trackPdfAction('convert-to-jpg', file),
  convertToWord: (file?: File | string) => trackPdfAction('convert-to-word', file),
  convertToPowerpoint: (file?: File | string) => trackPdfAction('convert-to-powerpoint', file),
  convertToExcel: (file?: File | string) => trackPdfAction('convert-to-excel', file),
  addWatermark: (file?: File | string) => trackPdfAction('add-watermark', file),
  addPageNumbers: (file?: File | string) => trackPdfAction('add-page-numbers', file),
  organize: (file?: File | string) => trackPdfAction('organize', file),
  removePages: (file?: File | string) => trackPdfAction('remove-pages', file),
  extractPages: (file?: File | string) => trackPdfAction('extract-pages', file),
};

// Export all tracking functions
export default {
  logPdfUsage,
  getTotalUsage,
  trackPdfAction,
  pdfTrackers,
  extractFileName,
  getFileSize,
};