import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  Merge,
  Scissors,
  Minimize2,
  Image,
  FileImage,
  Settings,
  Trash2,
  FileX,
  RotateCcw,
  Scan,
  Wrench,
  Shield,
  Eye,
  FileDown,
  FileUp,
  Monitor,
  Presentation,
  Sheet,
  Globe,
  RotateCw,
  Hash,
  Droplets,
  Crop,
  Edit,
  Star,
  Zap,
  Lock,
} from "lucide-react";
import ToolCard from "@/components/ToolCard";

export default function HomePage() {
  const organizeTools = [
    {
      id: "merge",
      title: "Merge PDF",
      description:
        "Combine multiple PDF files into one document with drag-and-drop reordering",
      icon: <Merge className="w-8 h-8 text-white" />,
      gradient: "bg-gradient-to-br from-blue-400 to-blue-600",
      href: "/tools/merge",
    },
    {
      id: "split",
      title: "Split PDF",
      description:
        "Split a PDF into multiple files or extract specific pages with precision",
      icon: <Scissors className="w-8 h-8 text-white" />,
      gradient: "bg-gradient-to-br from-green-400 to-green-600",
      href: "/tools/split",
    },
    {
      id: "remove-pages",
      title: "Remove Pages",
      description: "Delete unwanted pages from your PDF documents easily",
      icon: <Trash2 className="w-8 h-8 text-white" />,
      gradient: "bg-gradient-to-br from-red-400 to-red-600",
      href: "/tools/remove-pages",
    },
    {
      id: "extract-pages",
      title: "Extract Pages",
      description: "Extract specific pages from PDF to create new documents",
      icon: <FileX className="w-8 h-8 text-white" />,
      gradient: "bg-gradient-to-br from-purple-400 to-purple-600",
      href: "/tools/extract-pages",
    },
    {
      id: "organize",
      title: "Organize PDF",
      description:
        "Reorder, rotate, and manage pages with our super-powered editor",
      icon: <Settings className="w-8 h-8 text-white" />,
      gradient: "bg-gradient-to-br from-teal-400 to-teal-600",
      href: "/tools/organize",
    },
    {
      id: "scan-to-pdf",
      title: "Scan to PDF",
      description: "Convert scanned images and documents into searchable PDFs",
      icon: <Scan className="w-8 h-8 text-white" />,
      gradient: "bg-gradient-to-br from-indigo-400 to-indigo-600",
      href: "/tools/scan-to-pdf",
    },
  ];

  const optimizeTools = [
    {
      id: "compress",
      title: "Compress PDF",
      description:
        "Reduce file size while maintaining quality with smart compression",
      icon: <Minimize2 className="w-8 h-8 text-white" />,
      gradient: "bg-gradient-to-br from-orange-400 to-orange-600",
      href: "/tools/compress",
    },
    {
      id: "repair",
      title: "Repair PDF",
      description: "Fix corrupted or damaged PDF files automatically",
      icon: <Wrench className="w-8 h-8 text-white" />,
      gradient: "bg-gradient-to-br from-yellow-400 to-yellow-600",
      href: "/tools/repair",
    },
    {
      id: "ocr",
      title: "OCR PDF",
      description:
        "Make scanned PDFs searchable with optical character recognition",
      icon: <Eye className="w-8 h-8 text-white" />,
      gradient: "bg-gradient-to-br from-pink-400 to-pink-600",
      href: "/tools/ocr",
    },
  ];

  const convertToPdfTools = [
    {
      id: "jpg-to-pdf",
      title: "JPG to PDF",
      description:
        "Convert multiple images into a single, organized PDF document",
      icon: <FileImage className="w-8 h-8 text-white" />,
      gradient: "bg-gradient-to-br from-emerald-400 to-emerald-600",
      href: "/tools/jpg-to-pdf",
    },
    {
      id: "word-to-pdf",
      title: "WORD to PDF",
      description: "Convert Microsoft Word documents to PDF format",
      icon: <FileDown className="w-8 h-8 text-white" />,
      gradient: "bg-gradient-to-br from-blue-500 to-blue-700",
      href: "/tools/word-to-pdf",
    },
    {
      id: "powerpoint-to-pdf",
      title: "PowerPoint to PDF",
      description: "Convert PowerPoint presentations to PDF documents",
      icon: <Presentation className="w-8 h-8 text-white" />,
      gradient: "bg-gradient-to-br from-red-500 to-red-700",
      href: "/tools/powerpoint-to-pdf",
    },
    {
      id: "excel-to-pdf",
      title: "Excel to PDF",
      description: "Convert Excel spreadsheets to PDF format",
      icon: <Sheet className="w-8 h-8 text-white" />,
      gradient: "bg-gradient-to-br from-green-500 to-green-700",
      href: "/tools/excel-to-pdf",
    },
    {
      id: "html-to-pdf",
      title: "HTML to PDF",
      description: "Convert web pages and HTML content to PDF",
      icon: <Globe className="w-8 h-8 text-white" />,
      gradient: "bg-gradient-to-br from-purple-500 to-purple-700",
      href: "/tools/html-to-pdf",
    },
  ];

  const convertFromPdfTools = [
    {
      id: "pdf-to-jpg",
      title: "PDF to JPG",
      description: "Convert PDF pages to high-quality JPG images instantly",
      icon: <Image className="w-8 h-8 text-white" />,
      gradient: "bg-gradient-to-br from-cyan-400 to-cyan-600",
      href: "/tools/pdf-to-jpg",
    },
    {
      id: "pdf-to-word",
      title: "PDF to WORD",
      description: "Convert PDF documents to editable Word format",
      icon: <FileUp className="w-8 h-8 text-white" />,
      gradient: "bg-gradient-to-br from-blue-600 to-blue-800",
      href: "/tools/pdf-to-word",
    },
    {
      id: "pdf-to-powerpoint",
      title: "PDF to PowerPoint",
      description: "Convert PDF to editable PowerPoint presentations",
      icon: <Monitor className="w-8 h-8 text-white" />,
      gradient: "bg-gradient-to-br from-red-600 to-red-800",
      href: "/tools/pdf-to-powerpoint",
    },
    {
      id: "pdf-to-excel",
      title: "PDF to Excel",
      description: "Extract tables and data from PDF to Excel format",
      icon: <Sheet className="w-8 h-8 text-white" />,
      gradient: "bg-gradient-to-br from-green-600 to-green-800",
      href: "/tools/pdf-to-excel",
    },
    {
      id: "pdf-to-pdfa",
      title: "PDF to PDF/A",
      description: "Convert PDF to archival PDF/A format for long-term storage",
      icon: <Shield className="w-8 h-8 text-white" />,
      gradient: "bg-gradient-to-br from-gray-500 to-gray-700",
      href: "/tools/pdf-to-pdfa",
    },
  ];

  const editTools = [
    {
      id: "rotate",
      title: "Rotate PDF",
      description: "Rotate PDF pages to the correct orientation",
      icon: <RotateCw className="w-8 h-8 text-white" />,
      gradient: "bg-gradient-to-br from-violet-400 to-violet-600",
      href: "/tools/rotate",
    },
    {
      id: "add-page-numbers",
      title: "Add Page Numbers",
      description: "Add customizable page numbers to your PDF documents",
      icon: <Hash className="w-8 h-8 text-white" />,
      gradient: "bg-gradient-to-br from-amber-400 to-amber-600",
      href: "/tools/add-page-numbers",
    },
    {
      id: "add-watermark",
      title: "Add Watermark",
      description: "Add text or image watermarks to protect your documents",
      icon: <Droplets className="w-8 h-8 text-white" />,
      gradient: "bg-gradient-to-br from-sky-400 to-sky-600",
      href: "/tools/add-watermark",
    },
    {
      id: "crop",
      title: "Crop PDF",
      description: "Crop and resize PDF pages to remove unwanted margins",
      icon: <Crop className="w-8 h-8 text-white" />,
      gradient: "bg-gradient-to-br from-lime-400 to-lime-600",
      href: "/tools/crop",
    },
    {
      id: "edit",
      title: "Edit PDF",
      description: "Edit text, images, and other elements in your PDF",
      icon: <Edit className="w-8 h-8 text-white" />,
      gradient: "bg-gradient-to-br from-rose-400 to-rose-600",
      href: "/tools/edit",
    },
  ];

  const features = [
    {
      icon: <Zap className="w-6 h-6 text-blue-600" />,
      title: "Lightning Fast",
      description: "Process files in seconds, not minutes",
    },
    {
      icon: <Lock className="w-6 h-6 text-blue-600" />,
      title: "Secure & Private",
      description: "Files auto-deleted after processing",
    },
    {
      icon: <Star className="w-6 h-6 text-blue-600" />,
      title: "No Limits",
      description: "Unlimited file size and usage",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-16 sm:py-24">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-500 rounded-2xl flex items-center justify-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-white">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                </svg>
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold">
                <span className="text-gray-900">Yes I</span>
                <span className="text-red-500 ml-2">Love</span>
                <span className="text-gray-900 ml-2">PDF</span>
              </h1>
            </div>

            <p className="text-xl sm:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto leading-relaxed">
              The Complete PDF Solution for All Your Needs
            </p>

            <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
              Organize, optimize, convert, and edit your PDFs with our
              comprehensive toolkit. No sign-ups, no watermarks, just powerful
              PDF tools. ✨
            </p>

            {/* Quick Features */}
            <div className="flex flex-wrap justify-center gap-8 mb-16">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm rounded-full px-6 py-3 shadow-sm"
                >
                  {feature.icon}
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 text-sm">
                      {feature.title}
                    </p>
                    <p className="text-gray-600 text-xs">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tools Sections */}
      <div className="max-w-7xl mx-auto px-6 pb-24 space-y-20">
        {/* Organize PDF Section */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              📁 Organize PDF
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Merge, split, and organize your PDF documents with precision
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizeTools.map((tool) => (
              <ToolCard
                key={tool.id}
                title={tool.title}
                description={tool.description}
                icon={tool.icon}
                gradient={tool.gradient}
                href={tool.href}
              />
            ))}
          </div>
        </section>

        {/* Optimize PDF Section */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ⚡ Optimize PDF
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Compress, repair, and enhance your PDF files
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {optimizeTools.map((tool) => (
              <ToolCard
                key={tool.id}
                title={tool.title}
                description={tool.description}
                icon={tool.icon}
                gradient={tool.gradient}
                href={tool.href}
              />
            ))}
          </div>
        </section>

        {/* Convert to PDF Section */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              📄 Convert to PDF
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Convert various file formats to PDF documents
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {convertToPdfTools.map((tool) => (
              <ToolCard
                key={tool.id}
                title={tool.title}
                description={tool.description}
                icon={tool.icon}
                gradient={tool.gradient}
                href={tool.href}
              />
            ))}
          </div>
        </section>

        {/* Convert from PDF Section */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              🔄 Convert from PDF
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Extract and convert PDF content to other formats
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {convertFromPdfTools.map((tool) => (
              <ToolCard
                key={tool.id}
                title={tool.title}
                description={tool.description}
                icon={tool.icon}
                gradient={tool.gradient}
                href={tool.href}
              />
            ))}
          </div>
        </section>

        {/* Edit PDF Section */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ✏️ Edit PDF
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Modify and enhance your PDF documents
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {editTools.map((tool) => (
              <ToolCard
                key={tool.id}
                title={tool.title}
                description={tool.description}
                icon={tool.icon}
                gradient={tool.gradient}
                href={tool.href}
              />
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <div className="mt-20">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 border-0 text-white overflow-hidden relative">
            <CardContent className="p-12 text-center relative z-10">
              <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
              <p className="text-blue-100 mb-8 text-lg max-w-2xl mx-auto">
                Choose any tool above to start working with your PDFs. All tools
                are free and require no registration.
              </p>
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-gray-50 font-semibold px-8 py-3"
                asChild
              >
                <a href="#organize">Explore Tools →</a>
              </Button>
            </CardContent>

            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-500 rounded-xl flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 text-white"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
              </svg>
            </div>
            <span className="text-xl font-semibold">PDF Toolkit</span>
          </div>
          <p className="text-gray-400 mb-4">
            Made with ❤️ for everyone who works with PDFs
          </p>
          <p className="text-gray-500 text-sm">
            © 2024 PDF Toolkit. All rights reserved. • Privacy-first • No data
            stored
          </p>
        </div>
      </footer>
    </div>
  );
}
