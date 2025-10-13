"use client";

import React, { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ThumbnailNavigationPanelProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  scale?: number;
}

const ThumbnailNavigationPanel: React.FC<ThumbnailNavigationPanelProps> = ({
  pdfDoc,
  currentPage,
  onPageChange,
  scale = 0.2,
}) => {
  const [thumbnails, setThumbnails] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!pdfDoc) return;

    const generateThumbnails = async () => {
      setLoading(true);
      const newThumbnails = new Map<number, string>();

      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        try {
          const page = await pdfDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const context = canvas.getContext('2d');
          if (!context) continue;

          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;

          newThumbnails.set(pageNum, canvas.toDataURL());
        } catch (error) {
          console.error(`Error generating thumbnail for page ${pageNum}:`, error);
        }
      }

      setThumbnails(newThumbnails);
      setLoading(false);
    };

    generateThumbnails();
  }, [pdfDoc, scale]);

  if (!pdfDoc) return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "fixed left-0 top-1/2 -translate-y-1/2 bg-white border border-gray-300 rounded-r-md p-2 shadow-lg z-50 hover:bg-gray-50 transition-all",
          collapsed ? "left-0" : "left-60"
        )}
        title={collapsed ? "Show Thumbnails" : "Hide Thumbnails"}
      >
        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {/* Thumbnail Panel */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full bg-gray-100 border-r border-gray-200 overflow-y-auto transition-transform duration-300 z-40",
          collapsed ? "-translate-x-full" : "translate-x-0"
        )}
        style={{ width: '240px' }}
      >
        <div className="p-3 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 sticky top-0 bg-gray-100 py-2">
            Pages ({pdfDoc.numPages})
          </h3>

          {loading && (
            <div className="text-center py-8 text-sm text-gray-500">
              Generating thumbnails...
            </div>
          )}

          {Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1).map((pageNum) => {
            const thumbnail = thumbnails.get(pageNum);
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  "w-full rounded-lg border-2 overflow-hidden transition-all hover:shadow-lg",
                  isActive
                    ? "border-blue-500 shadow-md"
                    : "border-gray-300 hover:border-blue-300"
                )}
              >
                <div className="relative bg-white">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={`Page ${pageNum}`}
                      className="w-full h-auto"
                    />
                  ) : (
                    <div className="w-full aspect-[8.5/11] bg-gray-200 animate-pulse flex items-center justify-center">
                      <span className="text-gray-400 text-xs">Loading...</span>
                    </div>
                  )}
                  
                  {/* Page Number Badge */}
                  <div
                    className={cn(
                      "absolute bottom-2 right-2 px-2 py-1 rounded text-xs font-medium",
                      isActive
                        ? "bg-blue-500 text-white"
                        : "bg-gray-800 bg-opacity-75 text-white"
                    )}
                  >
                    {pageNum}
                  </div>
                </div>
                
                <div
                  className={cn(
                    "px-2 py-1.5 text-xs font-medium",
                    isActive
                      ? "bg-blue-500 text-white"
                      : "bg-gray-50 text-gray-700"
                  )}
                >
                  Page {pageNum}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default ThumbnailNavigationPanel;
