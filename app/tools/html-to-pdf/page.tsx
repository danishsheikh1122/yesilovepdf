"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import HtmlToPdf from "@/components/HtmlToPdf";

export default function HtmlToPdfPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/")}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
            </div>
            <div className="text-sm text-gray-500">
              Free • No registration required
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <HtmlToPdf />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <h3 className="text-lg font-semibold mb-2">How to convert HTML to PDF</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="text-center">
                <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-red-600 font-bold">1</span>
                </div>
                <h4 className="font-medium mb-2">Enter URL</h4>
                <p className="text-sm text-gray-500">
                  Paste the web page URL you want to convert to PDF
                </p>
              </div>
              <div className="text-center">
                <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-red-600 font-bold">2</span>
                </div>
                <h4 className="font-medium mb-2">Preview & Configure</h4>
                <p className="text-sm text-gray-500">
                  Preview the page layout and adjust PDF formatting options
                </p>
              </div>
              <div className="text-center">
                <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-red-600 font-bold">3</span>
                </div>
                <h4 className="font-medium mb-2">Download PDF</h4>
                <p className="text-sm text-gray-500">
                  Click convert and download your PDF document
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}