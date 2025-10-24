"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { tools, ToolListItem } from "@/lib/toolsList";

// Utility: improved fuzzy match with scoring
function fuzzyMatch(query: string, keywords: string[], name: string, description: string): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  
  let score = 0;
  const allText = [name, description, ...keywords].map(s => s.toLowerCase());
  
  // Exact match in name gets highest score
  if (name.toLowerCase() === q) score += 1000;
  if (name.toLowerCase().includes(q)) score += 500;
  
  // Exact match in keywords
  if (keywords.some(k => k.toLowerCase() === q)) score += 800;
  
  // Partial match in keywords
  if (keywords.some(k => k.toLowerCase().includes(q))) score += 300;
  
  // Match in description
  if (description.toLowerCase().includes(q)) score += 100;
  
  // Multi-word query: all words must be found
  const words = q.split(/\s+/).filter(w => w.length > 0);
  if (words.length > 1) {
    const allWordsFound = words.every(word => 
      allText.some(text => text.includes(word))
    );
    if (allWordsFound) score += 400;
  }
  
  // Word boundary match (e.g., "png to pdf" matches "png to pdf")
  if (keywords.some(k => {
    const keywordWords = k.toLowerCase().split(/\s+/);
    return words.every(w => keywordWords.includes(w));
  })) {
    score += 600;
  }
  
  return score;
}

const RECENT_KEY = "pdf-recent-searches";

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ToolListItem[]>([]);
  const [highlight, setHighlight] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Popular tools to show by default (memoized to prevent infinite re-renders)
  const popularTools = useMemo(() => [
    tools.find(t => t.link === '/tools/merge'),
    tools.find(t => t.link === '/tools/compress'),
    tools.find(t => t.link === '/tools/jpg-to-pdf'),
    tools.find(t => t.link === '/tools/pdf-to-word'),
    tools.find(t => t.link === '/tools/split'),
  ].filter(Boolean) as ToolListItem[], []);

  // Load recent searches
  useEffect(() => {
    if (typeof window !== "undefined") {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"));
    }
  }, [open]);

  // Save recent search
  const saveRecent = useCallback((q: string) => {
    if (!q.trim()) return;
    let arr = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    arr = [q, ...arr.filter((v: string) => v !== q)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(arr));
  }, []);

  // Fuzzy search with scoring
  useEffect(() => {
    if (!query) {
      setResults(popularTools); // Show popular tools when empty
      setHighlight(0);
      return;
    }
    const scored = tools
      .map((tool: ToolListItem) => ({
        tool,
        score: fuzzyMatch(query, tool.keywords, tool.name, tool.description)
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.tool);
    
    setResults(scored);
    setHighlight(0);
  }, [query, popularTools]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(v => !v);
      }
      if (open) {
        if (e.key === "Escape") setOpen(false);
        if (e.key === "ArrowDown") setHighlight(h => Math.min(h + 1, results.length - 1));
        if (e.key === "ArrowUp") setHighlight(h => Math.max(h - 1, 0));
        if (e.key === "Enter" && results[highlight]) {
          saveRecent(query);
          setOpen(false);
          router.push(results[highlight].link);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, results, highlight, query, router, saveRecent]);

  // Focus input when open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
    else setQuery("");
  }, [open]);

  // Click outside to close
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  // UI
  return (
    <>
      <button
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 border border-gray-300 transition text-gray-600 text-sm shadow-sm"
        onClick={() => setOpen(true)}
        aria-label="Open search (Cmd+K)"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="ml-1 sm:ml-2 px-1.5 py-0.5 rounded bg-gray-100 text-xs font-mono">⌘ K</kbd>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4 pt-20 sm:pt-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              ref={modalRef}
              className="relative w-full max-w-2xl mx-auto rounded-2xl shadow-2xl bg-white border border-gray-300 p-4 sm:p-6"
              initial={{ scale: 0.96, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
                onClick={() => setOpen(false)}
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  className="flex-1 bg-transparent outline-none text-base sm:text-lg placeholder-gray-400 text-gray-900"
                  placeholder="Search PDF tools... (Try 'merge', 'compress', 'convert')"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setHighlight(h => Math.min(h + 1, results.length - 1));
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setHighlight(h => Math.max(h - 1, 0));
                    }
                  }}
                  autoFocus
                />
                <kbd className="hidden sm:inline-block ml-2 px-2 py-1 rounded bg-gray-100 text-xs font-mono text-gray-600">⌘ K</kbd>
              </div>
              {recent.length > 0 && !query && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 mb-2">Recent searches</div>
                  <div className="flex flex-wrap gap-2">
                    {recent.map((r, i) => (
                      <button
                        key={r + i}
                        className="px-3 py-1.5 rounded-lg bg-gray-100 text-sm hover:bg-gray-200 transition text-gray-700"
                        onClick={() => setQuery(r)}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {!query && results.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 mb-2">Popular tools</div>
                </div>
              )}
              <div className="max-h-96 overflow-y-auto">
                {results.length === 0 && query && (
                  <div className="text-gray-400 text-center py-12 text-sm">
                    No results found for "{query}"
                  </div>
                )}
                <ul className="space-y-1">
                  {results.map((tool, i) => (
                    <li
                      key={tool.link}
                      className={`flex items-start gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all ${i === highlight ? "bg-red-50 border border-red-200" : "hover:bg-gray-50"}`}
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => {
                        saveRecent(query);
                        setOpen(false);
                        router.push(tool.link);
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm sm:text-base">{tool.name}</div>
                        <div className="text-xs sm:text-sm text-gray-500 mt-0.5 line-clamp-1">{tool.description}</div>
                      </div>
                      {i === highlight && (
                        <kbd className="hidden sm:inline-block px-2 py-1 rounded bg-gray-100 text-xs font-mono text-gray-600 flex-shrink-0">↵</kbd>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              {results.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-gray-100">↑</kbd>
                      <kbd className="px-1.5 py-0.5 rounded bg-gray-100">↓</kbd>
                      to navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-gray-100">↵</kbd>
                      to select
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-gray-100">ESC</kbd>
                    to close
                  </span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
