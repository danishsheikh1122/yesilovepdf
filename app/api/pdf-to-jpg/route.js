import { NextResponse } from "next/server";
import { writeFile, unlink, readFile, mkdir, rmdir } from "fs/promises";
import path from "path";
import os from "os";
import archiver from "archiver";
import { existsSync } from "fs";
import { PDFDocument } from "pdf-lib";
import { uploadToSupabaseIfEligible } from '@/lib/supabaseFileUpload';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("files");
    const format = formData.get("format") || "jpeg";
  // Image quality 0-100 (use 100 for lossless JPEG generation from canvas)
  const quality = parseInt(formData.get("quality") || "100");
  // Fixed high DPI for excellent image quality (no user control needed)
  const dpi = 1200;

    if (!file) {
      return NextResponse.json(
        {
          error: "Please upload a PDF file to convert.",
        },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        {
          error: "File must be a valid PDF document.",
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const outputDir = path.join(os.tmpdir(), `images_${Date.now()}`);

    try {
      // Create output directory
      await mkdir(outputDir, { recursive: true });

      // Render PDF pages inside a headless browser (Puppeteer) using PDF.js in-browser
      // This avoids node-canvas native bindings by doing the rasterization in Chromium's canvas
      let puppeteer;
      try {
        puppeteer = await import('puppeteer');
      } catch (e) {
        throw new Error("Puppeteer is required for PDF rendering in this environment. Please install it: pnpm add puppeteer");
      }

      const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();

      // Convert PDF buffer to base64 to send into the browser context
      const pdfBase64 = buffer.toString('base64');
  const mime = format.toLowerCase() === 'png' ? 'image/png' : 'image/jpeg';
  const jpegQualityDecimal = Math.max(0, Math.min(1, quality / 100));
  const scale = Math.max(0.1, dpi / 72);

      // Build an HTML page that loads PDF.js from CDN and renders all pages to data URLs
      const pdfjsCdnVersion = '3.11.174';
      const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
</head>
<body>
<script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsCdnVersion}/build/pdf.min.js"></script>
<script>
  (async () => {
    try {
      const pdfData = '${pdfBase64}';
      const binary = atob(pdfData);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);

      const pdfjsLib = window['pdfjs-dist/build/pdf'];
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsCdnVersion}/build/pdf.worker.min.js';
      const loadingTask = pdfjsLib.getDocument({ data: bytes });
      const pdf = await loadingTask.promise;
      const results = [];
  for (let i = 1; i <= pdf.numPages; i++) {
  const p = await pdf.getPage(i);
  // Use server-provided scale (based on DPI) to preserve PDF quality
  const viewport = p.getViewport({ scale: ${scale} });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d');
        await p.render({ canvasContext: ctx, viewport }).promise;
        if ('${mime}' === 'image/jpeg') {
          results.push(canvas.toDataURL('image/jpeg', ${jpegQualityDecimal}));
        } else {
          results.push(canvas.toDataURL('image/png'));
        }
      }
      window._PDF_IMAGES = results;
    } catch (err) {
      window._PDF_ERROR = err && err.message ? err.message : String(err);
    }
  })();
</script>
</body>
</html>`;

  // Set content and wait for PDF rendering to complete or error
  await page.setContent(html, { waitUntil: 'networkidle0' });

  // Wait until window._PDF_IMAGES is defined or window._PDF_ERROR
  // Use a longer timeout since very high DPI renders can be slow
  await page.waitForFunction('window._PDF_IMAGES || window._PDF_ERROR', { timeout: 180_000 });

      const result = await page.evaluate(() => {
        return { images: window._PDF_IMAGES || null, error: window._PDF_ERROR || null };
      });

      await browser.close();

      if (result.error) {
        throw new Error(`PDF rendering failed in headless browser: ${result.error}`);
      }

  const renderedDataUrls = result.images || [];
      if (renderedDataUrls.length === 0) {
        throw new Error('No pages were rendered by the headless browser');
      }

      const imagePaths = [];
      // Convert data URLs to buffers and save files
      for (let i = 0; i < renderedDataUrls.length; i++) {
        try {
          const dataUrl = renderedDataUrls[i];
          const commaIndex = dataUrl.indexOf(',');
          const base64 = dataUrl.slice(commaIndex + 1);
          // Save the image buffer generated by Chromium directly to avoid additional compression
          const imageBuffer = Buffer.from(base64, 'base64');

          const fileName = `page-${i + 1}.${format}`;
          const imagePath = path.join(outputDir, fileName);
          await writeFile(imagePath, imageBuffer);
          imagePaths.push(imagePath);
        } catch (pageError) {
          console.warn(`Failed to save rendered page ${i + 1}:`, pageError);
        }
      }

      if (imagePaths.length === 0) {
        throw new Error("No pages could be converted to images");
      }

      // If only one image, return it directly
      if (imagePaths.length === 1) {
        const imageBuffer = await readFile(imagePaths[0]);

        // Clean up
        await unlink(imagePaths[0]);
        await rmdir(outputDir);

        return new Response(imageBuffer, {
          headers: {
            "Content-Type": `image/${format}`,
            "Content-Disposition": `attachment; filename="page-1.${format}"`,
            "Content-Length": imageBuffer.length.toString(),
          },
        });
      }

      // Multiple images - create ZIP
      const zipPath = path.join(os.tmpdir(), `pdf-images_${Date.now()}.zip`);
      const output = require("fs").createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      archive.pipe(output);

      // Add each image to the ZIP with proper naming
      for (let i = 0; i < imagePaths.length; i++) {
        const imagePath = imagePaths[i];
        const fileName = `page-${i + 1}.${format}`;
        archive.file(imagePath, { name: fileName });
      }

      await archive.finalize();

      // Wait for ZIP creation to complete
      await new Promise((resolve, reject) => {
        output.on("close", resolve);
        output.on("error", reject);
      });

      // Read ZIP file and return it
      const zipBuffer = await readFile(zipPath);

      // Clean up temp files
      for (const imagePath of imagePaths) {
        try {
          await unlink(imagePath);
        } catch (unlinkError) {
          console.warn("Failed to delete image file:", imagePath, unlinkError);
        }
      }
      try {
        await unlink(zipPath);
      } catch (unlinkError) {
        console.warn("Failed to delete zip file:", zipPath, unlinkError);
      }

      // Try to clean up output directory
      try {
        await rmdir(outputDir);
      } catch (unlinkError) {
        console.warn(
          "Failed to delete output directory:",
          outputDir,
          unlinkError
        );
      }

      return new Response(zipBuffer, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": 'attachment; filename="pdf-images.zip"',
          "Content-Length": zipBuffer.length.toString(),
        },
      });
    } catch (processingError) {
      // Clean up temp files in case of error
      if (existsSync(outputDir)) {
        try {
          // Try to clean up any created files
          const files = require("fs").readdirSync(outputDir);
          for (const file of files) {
            try {
              await unlink(path.join(outputDir, file));
            } catch (e) {
              console.warn("Failed to cleanup file:", file);
            }
          }
          await rmdir(outputDir);
        } catch (cleanupError) {
          console.warn(
            "Failed to cleanup output directory:",
            outputDir,
            cleanupError
          );
        }
      }
      throw processingError;
    }
  } catch (error) {
    console.error("PDF to image conversion error:", error);

    if (error.message && error.message.includes("Invalid PDF")) {
      return NextResponse.json(
        {
          error: "The uploaded file is corrupted or not a valid PDF document.",
        },
        { status: 400 }
      );
    }

    if (
      error.message &&
      (error.message.includes("GraphicsMagick") ||
        error.message.includes("ImageMagick"))
    ) {
      return NextResponse.json(
        {
          error:
            "PDF conversion service is temporarily unavailable. Please try again later.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to convert PDF to images. Please try again.",
      },
      { status: 500 }
    );
  }
}
