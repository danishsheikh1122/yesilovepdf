'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import availableToolIds from '@/lib/availableTools';
import { Search, FileText, Zap, Star, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  href: string;
  icon: React.ReactNode;
  popular?: boolean;
  keywords?: string[];
}

export interface SearchBarRef {
  focus: () => void;
  toggle: () => void;
}

const SearchBar = forwardRef<SearchBarRef>((props, ref) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const allTools: SearchResult[] = [
    // Organize Tools
    {
      id: 'merge',
      title: 'Merge PDF',
      description: 'Combine multiple PDF files into one document',
      category: 'Organize',
      href: '/tools/merge',
      icon: <FileText className="w-4 h-4" />,
      popular: true,
      keywords: ['merge', 'combine', 'join', 'unite', 'concatenate'],
    },
    {
      id: 'split',
      title: 'Split PDF',
      description: 'Split a PDF into multiple files or extract pages',
      category: 'Organize',
      href: '/tools/split',
      icon: <FileText className="w-4 h-4" />,
      popular: true,
      keywords: ['split', 'divide', 'separate', 'extract', 'break'],
    },
    {
      id: 'organize',
      title: 'Organize PDF',
      description: 'Reorder, rotate, and manage pages',
      category: 'Organize',
      href: '/tools/organize',
      icon: <FileText className="w-4 h-4" />,
      keywords: ['organize', 'reorder', 'arrange', 'sort', 'rearrange'],
    },
    {
      id: 'remove-pages',
      title: 'Remove Pages',
      description: 'Delete unwanted pages from your PDF',
      category: 'Organize',
      href: '/tools/remove-pages',
      icon: <FileText className="w-4 h-4" />,
      keywords: ['remove', 'delete', 'pages', 'unwanted'],
    },
    {
      id: 'extract-pages',
      title: 'Extract Pages',
      description: 'Extract specific pages to create new documents',
      category: 'Organize',
      href: '/tools/extract-pages',
      icon: <FileText className="w-4 h-4" />,
      keywords: ['extract', 'pages', 'select', 'get', 'specific'],
    },
    {
      id: 'scan-to-pdf',
      title: 'Scan to PDF',
      description: 'Convert scanned images into searchable PDFs',
      category: 'Convert',
      href: '/tools/scan-to-pdf',
      icon: <FileText className="w-4 h-4" />,
      keywords: ['scan', 'camera', 'document', 'photo', 'ocr'],
    },
    // Optimize Tools
    {
      id: 'compress',
      title: 'Compress PDF',
      description: 'Reduce file size while maintaining quality',
      category: 'Optimize',
      href: '/tools/compress',
      icon: <Zap className="w-4 h-4" />,
      popular: true,
      keywords: ['compress', 'reduce', 'optimize', 'shrink', 'size', 'small'],
    },
    {
      id: 'crop-pdf',
      title: 'Crop PDF',
      description: 'Remove unwanted margins and content',
      category: 'Edit',
      href: '/tools/crop-pdf',
      icon: <Zap className="w-4 h-4" />,
      keywords: ['crop', 'trim', 'cut', 'resize', 'margins'],
    },
    // Convert Tools - Images
    {
      id: 'pdf-to-jpg',
      title: 'PDF to JPG',
      description: 'Convert PDF pages to JPG images',
      category: 'Convert',
      href: '/tools/pdf-to-jpg',
      icon: <FileText className="w-4 h-4" />,
      keywords: ['pdf to jpg', 'pdf to jpeg', 'pdf to image', 'convert to jpg', 'convert to jpeg', 'extract images'],
    },
    {
      id: 'pdf-to-images',
      title: 'PDF to Images',
      description: 'Convert PDF pages to various image formats',
      category: 'Convert',
      href: '/tools/pdf-to-images',
      icon: <FileText className="w-4 h-4" />,
      keywords: ['pdf to image', 'pdf to png', 'pdf to gif', 'convert to images', 'extract images'],
    },
    {
      id: 'jpg-to-pdf',
      title: 'JPG to PDF',
      description: 'Convert JPG images to PDF format',
      category: 'Convert',
      href: '/tools/jpg-to-pdf',
      icon: <FileText className="w-4 h-4" />,
      keywords: ['jpg to pdf', 'jpeg to pdf', 'image to pdf', 'convert from jpg', 'photo to pdf'],
    },
    // Convert Tools - Office
    {
      id: 'word-to-pdf',
      title: 'Word to PDF',
      description: 'Convert Word documents to PDF',
      category: 'Convert',
      href: '/tools/word-to-pdf',
      icon: <FileText className="w-4 h-4" />,
      keywords: ['word to pdf', 'doc to pdf', 'docx to pdf', 'convert word', 'microsoft word'],
    },
    {
      id: 'pdf-to-word',
      title: 'PDF to Word',
      description: 'Convert PDF to editable Word documents',
      category: 'Convert',
      href: '/tools/pdf-to-word',
      icon: <FileText className="w-4 h-4" />,
      keywords: ['pdf to word', 'pdf to doc', 'pdf to docx', 'convert to word', 'editable'],
    },
    {
      id: 'powerpoint-to-pdf',
      title: 'PowerPoint to PDF',
      description: 'Convert presentations to PDF format',
      category: 'Convert',
      href: '/tools/powerpoint-to-pdf',
      icon: <FileText className="w-4 h-4" />,
      keywords: ['powerpoint to pdf', 'ppt to pdf', 'pptx to pdf', 'presentation to pdf', 'slides'],
    },
    {
      id: 'pdf-to-powerpoint',
      title: 'PDF to PowerPoint',
      description: 'Convert PDF to PowerPoint presentations',
      category: 'Convert',
      href: '/tools/pdf-to-powerpoint',
      icon: <FileText className="w-4 h-4" />,
      keywords: ['pdf to powerpoint', 'pdf to ppt', 'pdf to pptx', 'convert to presentation', 'slides'],
    },
    {
      id: 'excel-to-pdf',
      title: 'Excel to PDF',
      description: 'Convert spreadsheets to PDF format',
      category: 'Convert',
      href: '/tools/excel-to-pdf',
      icon: <FileText className="w-4 h-4" />,
      keywords: ['excel to pdf', 'xls to pdf', 'xlsx to pdf', 'spreadsheet to pdf', 'convert excel'],
    },
    {
      id: 'html-to-pdf',
      title: 'HTML to PDF',
      description: 'Convert web pages to PDF documents',
      category: 'Convert',
      href: '/tools/html-to-pdf',
      icon: <FileText className="w-4 h-4" />,
      keywords: ['html to pdf', 'webpage to pdf', 'url to pdf', 'website to pdf', 'web to pdf'],
    },
    // Edit Tools
    {
      id: 'edit-pdf',
      title: 'Edit PDF',
      description: 'Add text, images, and annotations to PDFs',
      category: 'Edit',
      href: '/tools/edit-pdf',
      icon: <FileText className="w-4 h-4" />,
      popular: true,
      keywords: ['edit', 'modify', 'annotate', 'text', 'draw', 'write'],
    },
    {
      id: 'enhanced-edit-pdf',
      title: 'Enhanced Edit PDF',
      description: 'Advanced PDF editing with more features',
      category: 'Edit',
      href: '/tools/enhanced-edit-pdf',
      icon: <FileText className="w-4 h-4" />,
      keywords: ['advanced edit', 'enhanced edit', 'professional edit', 'advanced features'],
    },
    {
      id: 'add-page-numbers',
      title: 'Add Page Numbers',
      description: 'Add page numbers to your PDF documents',
      category: 'Edit',
      href: '/tools/add-page-numbers',
      icon: <FileText className="w-4 h-4" />,
      keywords: ['page numbers', 'numbering', 'pagination', 'add numbers'],
    },
    {
      id: 'add-watermark',
      title: 'Add Watermark',
      description: 'Add text or image watermarks to PDFs',
      category: 'Edit',
      href: '/tools/add-watermark',
      icon: <FileText className="w-4 h-4" />,
      keywords: ['watermark', 'stamp', 'logo', 'brand', 'mark', 'overlay'],
    },
    {
      id: 'rotate',
      title: 'Rotate PDF',
      description: 'Rotate pages in your PDF documents',
      category: 'Edit',
      href: '/tools/rotate',
      icon: <FileText className="w-4 h-4" />,
      keywords: ['rotate', 'turn', 'flip', 'orientation', 'clockwise', 'counterclockwise'],
    },
    // Utility Tools
    {
      id: 'pdf-info',
      title: 'PDF Info',
      description: 'View PDF metadata and properties',
      category: 'Utility',
      href: '/tools/pdf-info',
      icon: <FileText className="w-4 h-4" />,
      keywords: ['info', 'metadata', 'properties', 'details', 'information'],
    },
    {
      id: 'pdf-thumbnail',
      title: 'PDF Thumbnail',
      description: 'Generate thumbnails from PDF pages',
      category: 'Utility',
      href: '/tools/pdf-thumbnail',
      icon: <FileText className="w-4 h-4" />,
      keywords: ['thumbnail', 'preview', 'small image', 'cover'],
    },
  ];

  // Only include tools that actually exist (implemented pages)
  const implementedTools = allTools.filter(t => availableToolIds.has(t.id));
  const popularTools = implementedTools.filter(tool => tool.popular);

  useEffect(() => {
    if (query.trim() === '') {
      setFilteredResults([]);
      setHighlightedIndex(-1);
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    
    // Simple phrase mappings to prioritize specific tools for common multi-word queries
    const phraseMappings: { phrases: string[]; targets: string[] }[] = [
      { phrases: ['pdf to image', 'pdf to jpg', 'pdf to jpeg', 'pdf2jpg', 'pdf2jpeg', 'pdf to jpeg'], targets: ['pdf-to-jpg', 'pdf-to-images'] },
      { phrases: ['image to pdf', 'jpg to pdf', 'jpeg to pdf'], targets: ['jpg-to-pdf'] },
      { phrases: ['word to pdf', 'doc to pdf', 'docx to pdf'], targets: ['word-to-pdf'] },
      { phrases: ['pdf to word', 'pdf to doc', 'pdf to docx'], targets: ['pdf-to-word'] },
      { phrases: ['powerpoint to pdf', 'ppt to pdf', 'pptx to pdf'], targets: ['powerpoint-to-pdf'] },
    ];

    // Build raw matches with a simple scoring system
    const tokens = searchTerm.split(/\s+/).filter(Boolean);

  const matches: { tool: SearchResult; score: number }[] = [];

  for (const tool of implementedTools) {
      let score = 0;
      const title = tool.title.toLowerCase();
      const desc = tool.description.toLowerCase();
      const category = tool.category.toLowerCase();

      if (title === searchTerm) score += 200;
      if (title.includes(searchTerm)) score += 120;
      if (title.startsWith(searchTerm)) score += 140;
      if (desc.includes(searchTerm)) score += 60;
      if (category.includes(searchTerm)) score += 50;
      if (tool.popular) score += 20;

      // Keyword matches
      if (tool.keywords) {
        for (const k of tool.keywords) {
          const lk = k.toLowerCase();
          if (lk === searchTerm) score += 100;
          if (lk.includes(searchTerm) || searchTerm.includes(lk)) score += 40;
        }
      }

      // token-level scoring (fuzzy-ish)
      for (const t of tokens) {
        if (title.includes(t)) score += 15;
        if (desc.includes(t)) score += 8;
        if (category.includes(t)) score += 6;
        if (tool.keywords && tool.keywords.some(k => k.toLowerCase().includes(t))) score += 12;
      }

      // Phrase mapping bump
      for (const mapping of phraseMappings) {
        for (const phrase of mapping.phrases) {
          if (searchTerm.includes(phrase)) {
            if (mapping.targets.includes(tool.id)) score += 500; // strong boost for mapped targets
          }
        }
      }

      if (score > 0) matches.push({ tool, score });
    }

    // If searchTerm is empty we won't reach here, but ensure we set results accordingly
    const sortedResults = matches
      .sort((a, b) => b.score - a.score)
      .map(m => m.tool);

    setFilteredResults(sortedResults);
    setHighlightedIndex(-1);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global keyboard shortcut: Ctrl/Cmd+K toggles the search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      if (cmdOrCtrl && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (isOpen) {
          setIsOpen(false);
          inputRef.current?.blur();
        } else {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const results = query.trim() === '' ? popularTools : filteredResults;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const newIndex = prev < results.length - 1 ? prev + 1 : prev;
          // Scroll into view
          setTimeout(() => {
            const element = document.querySelector(`[data-result-index="${newIndex}"]`);
            if (element) {
              element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
          }, 0);
          return newIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : 0;
          // Scroll into view
          setTimeout(() => {
            const element = document.querySelector(`[data-result-index="${newIndex}"]`);
            if (element) {
              element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
          }, 0);
          return newIndex;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < results.length) {
          handleResultClick(results[highlightedIndex].href);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleResultClick = (href: string) => {
    router.push(href);
    setIsOpen(false);
    setQuery('');
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
      setIsOpen(true);
    },
    toggle: () => {
      if (isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      } else {
        inputRef.current?.focus();
        setIsOpen(true);
      }
    }
  }));

  const displayResults = query.trim() === '' ? popularTools : filteredResults;

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto z-50">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder="Search PDF tools... (Try 'merge', 'compress', 'convert')"
          className="w-full pl-12 pr-12 py-4 text-lg border border-gray-200 rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-gray-400 transition-all duration-200"
        />
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
          <kbd className="hidden sm:inline-flex px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-b-2xl shadow-2xl border border-gray-100 z-[9999] overflow-visible">
          {displayResults.length > 0 ? (
            <div className="flex flex-col">
              {query.trim() === '' && (
                <div className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Popular Tools
                </div>
              )}
              <div className="overflow-y-auto max-h-80 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                {displayResults.map((result, index) => (
                  <button
                    key={result.id}
                    data-result-index={index}
                    onClick={() => handleResultClick(result.href)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full px-4 py-3 text-left hover:bg-red-50 focus:bg-red-50 focus:outline-none transition-all duration-150 border-b border-gray-100 ${
                      index === highlightedIndex ? 'bg-red-50 border-red-200' : ''
                    } ${index === displayResults.length - 1 ? 'rounded-b-2xl' : ''}`}
                    style={{ display: 'block' }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 text-gray-400 flex-shrink-0">
                        {result.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {result.title}
                          </p>
                          {result.popular && (
                            <Star className="w-3 h-3 text-yellow-400 fill-current flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {result.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {result.category}
                          </span>
                          {result.keywords && (
                            <div className="flex gap-1 overflow-hidden">
                              {result.keywords.slice(0, 2).map((keyword, idx) => (
                                <span 
                                  key={idx} 
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700"
                                >
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : query.trim() !== '' ? (
            <div className="py-8 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No tools found for "{query}"</p>
              <p className="text-xs mt-1 text-gray-400">Try searching for: merge, compress, convert, edit, image</p>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Start typing to search PDF tools</p>
              <p className="text-xs mt-1 text-gray-400">Popular searches: pdf to jpg, merge, compress</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;