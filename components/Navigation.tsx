"use client";

import Link from "next/link";
import { useState } from "react";
import GlobalSearch from "./GlobalSearch";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const quickTools = [
    { name: "Compress PDF", href: "/tools/compress", description: "Reduce PDF file size" },
    { name: "Merge PDF", href: "/tools/merge", description: "Combine multiple PDFs" },
    { name: "Image to PDF", href: "/tools/jpg-to-pdf", description: "Convert images to PDF" },
    { name: "Remove Pages", href: "/tools/remove-pages", description: "Remove pages from PDF" },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-500 rounded-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">
                Yes I <span className="text-red-500">Love</span> PDF
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <GlobalSearch />
            
            <div className="relative group">
              <button className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium flex items-center">
                Quick Tools
                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-2">
                    {quickTools.map((tool) => (
                      <Link
                        key={tool.name}
                        href={tool.href}
                        className="p-3 rounded-md hover:bg-gray-50 transition-colors duration-150"
                      >
                        <div className="font-medium text-sm text-gray-900">{tool.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{tool.description}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Link href="/pricing" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
              Pricing
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
              Contact
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <GlobalSearch />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-gray-900 p-2"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              {quickTools.map((tool) => (
                <Link
                  key={tool.name}
                  href={tool.href}
                  className="block px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {tool.name}
                </Link>
              ))}
              <hr className="my-2" />
              <Link href="/pricing" className="block px-3 py-2 text-sm text-gray-700 hover:text-gray-900">
                Pricing
              </Link>
              <Link href="/about" className="block px-3 py-2 text-sm text-gray-700 hover:text-gray-900">
                About
              </Link>
              <Link href="/contact" className="block px-3 py-2 text-sm text-gray-700 hover:text-gray-900">
                Contact
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;