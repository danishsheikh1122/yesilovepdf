import { NextResponse } from "next/server";
import { promisify } from "util";
import { execFile as execFileCb } from "child_process";
import fsPromises from "fs/promises";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import { Document, Packer, Paragraph, ImageRun } from "docx";
import fse from "fs-extra";
import sizeOf from "image-size";

const execFile = promisify(execFileCb);

// Ensure this route runs on Node (not edge)
export const runtime = "nodejs";

/**
 * Calculate scaled dimensions while maintaining aspect ratio
 * @param {number} originalWidth - Original image width in pixels
 * @param {number} originalHeight - Original image height in pixels
 * @param {number} maxWidth - Maximum allowed width in points
 * @param {number} maxHeight - Maximum allowed height in points
 * @param {number} dpi - DPI used for conversion (default 600)
 * @returns {Object} - Scaled width and height in points
 */
function calculateScaledDimensions(
  originalWidth,
  originalHeight,
  maxWidth,
  maxHeight,
  dpi = 600
) {
  // Convert pixels to points (72 points = 1 inch)
  const pixelToPoints = 72 / dpi;
  const originalWidthPoints = originalWidth * pixelToPoints;
  const originalHeightPoints = originalHeight * pixelToPoints;

  // Calculate aspect ratio
  const aspectRatio = originalWidth / originalHeight;

  // Calculate scale factors for both dimensions
  const scaleX = maxWidth / originalWidthPoints;
  const scaleY = maxHeight / originalHeightPoints;

  // Use the smaller scale factor to ensure the image fits within bounds
  // Much more aggressive upscaling for maximum content visibility
  const maxScale =
    originalWidthPoints < 400 || originalHeightPoints < 400 ? 2.0 : 1.8;
  const scale = Math.min(scaleX, scaleY, maxScale);

  // Ensure minimum readable size - much more aggressive
  const minWidth = 300; // Significantly increased minimum width for better visibility
  const minHeight = 300; // Significantly increased minimum height for better visibility

  let finalWidth = Math.max(originalWidthPoints * scale, minWidth);
  let finalHeight = Math.max(originalHeightPoints * scale, minHeight);

  // Re-check aspect ratio after applying minimum sizes
  if (Math.abs(finalWidth / finalHeight - aspectRatio) > 0.01) {
    if (originalWidthPoints * scale < minWidth) {
      finalWidth = minWidth;
      finalHeight = finalWidth / aspectRatio;
    }
    if (originalHeightPoints * scale < minHeight) {
      finalHeight = minHeight;
      finalWidth = finalHeight * aspectRatio;
    }
  }

  // Final bounds check - ensure it still fits in the page
  if (finalWidth > maxWidth) {
    finalWidth = maxWidth;
    finalHeight = finalWidth / aspectRatio;
  }
  if (finalHeight > maxHeight) {
    finalHeight = maxHeight;
    finalWidth = finalHeight * aspectRatio;
  }

  // Try to maximize space usage - if there's still room, scale up proportionally
  const remainingWidthRatio = maxWidth / finalWidth;
  const remainingHeightRatio = maxHeight / finalHeight;
  const additionalScale = Math.min(remainingWidthRatio, remainingHeightRatio);

  // Apply additional scaling if it would improve size (more than 1% increase) - maximum aggressive scaling
  if (additionalScale > 1.01) {
    finalWidth *= additionalScale;
    finalHeight *= additionalScale;
  }

  return {
    width: Math.round(finalWidth),
    height: Math.round(finalHeight),
    scale: Math.round((finalWidth / originalWidthPoints) * 1000) / 1000,
  };
}

export const POST = async (request) => {
  try {
    const formData = await request.formData();
    const file = formData.get("files");

    if (!file) {
      return NextResponse.json(
        { error: "Please upload a PDF file to convert." },
        { status: 400 }
      );
    }

    // If file is a File/Blob
    const filename = file.name || `upload-${Date.now()}.pdf`;
    const contentType = file.type || "";

    if (
      !contentType.includes("pdf") &&
      path.extname(filename).toLowerCase() !== ".pdf"
    ) {
      return NextResponse.json(
        { error: "File must be a valid PDF document." },
        { status: 400 }
      );
    }

    // Create temp working directory
    const workId = uuidv4();
    const tmpDir = path.join(os.tmpdir(), `pdf2word-${workId}`);
    await fse.ensureDir(tmpDir);

    const inPdfPath = path.join(tmpDir, filename);

    // Save uploaded PDF to disk
    const arrayBuffer = await file.arrayBuffer();
    await fsPromises.writeFile(inPdfPath, Buffer.from(arrayBuffer));

    // Use pdftoppm to convert PDF pages to PNGs with better quality
    const outPrefix = path.join(tmpDir, "page");
    try {
      // -png ensures PNG output. -r 300 sets higher resolution for better quality
      // Higher DPI ensures better image quality in the final Word document
      console.log(
        `Converting PDF to images: ${inPdfPath} -> ${outPrefix}-*.png`
      );
      await execFile("pdftoppm", ["-png", "-r", "600", inPdfPath, outPrefix]);
    } catch (err) {
      // Clean up and respond with error explaining poppler dependency if binary not found
      await fse.remove(tmpDir);
      const message =
        err.code === "ENOENT"
          ? "pdftoppm not found. Please install Poppler (poppler-utils). On Debian/Ubuntu: sudo apt-get install poppler-utils; on macOS: brew install poppler"
          : `Error converting PDF to images: ${err.message || err}`;
      return NextResponse.json({ error: message }, { status: 500 });
    }

    // Collect generated images (pdftoppm generates files like page-1.png, page-2.png, ...)
    const files = await fsPromises.readdir(tmpDir);
    console.log(`Files in temp directory: ${files.join(", ")}`);

    const imageFiles = files
      .filter((f) => /\.png$/i.test(f) && f.startsWith("page"))
      .sort((a, b) => {
        // sort numerically by trailing number
        const na = a.match(/(\d+)\.png$/);
        const nb = b.match(/(\d+)\.png$/);
        const ia = na ? parseInt(na[1], 10) : 0;
        const ib = nb ? parseInt(nb[1], 10) : 0;
        return ia - ib;
      })
      .map((f) => path.join(tmpDir, f));

    console.log(
      `Found ${imageFiles.length} image files: ${imageFiles
        .map((f) => path.basename(f))
        .join(", ")}`
    );

    if (imageFiles.length === 0) {
      await fse.remove(tmpDir);
      return NextResponse.json(
        { error: "No images were produced from the PDF. Is the PDF valid?" },
        { status: 500 }
      );
    }

    // Create Word document
    const doc = new Document({
      sections: [],
    });

    let processedPages = 0;

    // Add each image as a page in the Word document
    for (let i = 0; i < imageFiles.length; i++) {
      const imgPath = imageFiles[i];

      try {
        const imageBuffer = await fsPromises.readFile(imgPath);

        // Get actual image dimensions using the buffer
        const imageDimensions = sizeOf(imageBuffer);

        if (
          !imageDimensions ||
          !imageDimensions.width ||
          !imageDimensions.height
        ) {
          console.error(`Failed to get dimensions for image: ${imgPath}`);
          continue; // Skip this image and continue with the next one
        }

        // Determine if the page is landscape or portrait
        const isLandscape = imageDimensions.width > imageDimensions.height;

        // Define page constraints based on orientation
        // Letter size: 8.5" x 11" with smaller margins for better space utilization
        let pageWidth, pageHeight, maxImageWidth, maxImageHeight;

        if (isLandscape) {
          // For landscape content, use landscape orientation
          pageWidth = 11 * 72; // 792 points (landscape)
          pageHeight = 8.5 * 72; // 612 points (landscape)
          const marginSize = 0.1 * 72; // 7.2 points (0.1 inch margins - minimal for maximum space)
          maxImageWidth = pageWidth - 2 * marginSize; // 777.6 points
          maxImageHeight = pageHeight - 2 * marginSize; // 597.6 points
        } else {
          // For portrait content, use standard portrait orientation
          pageWidth = 8.5 * 72; // 612 points
          pageHeight = 11 * 72; // 792 points
          const marginSize = 0.1 * 72; // 7.2 points (0.1 inch margins - minimal for maximum space)
          maxImageWidth = pageWidth - 2 * marginSize; // 597.6 points
          maxImageHeight = pageHeight - 2 * marginSize; // 777.6 points
        }

        // Calculate scaled dimensions maintaining aspect ratio
        const scaledDimensions = calculateScaledDimensions(
          imageDimensions.width,
          imageDimensions.height,
          maxImageWidth,
          maxImageHeight,
          600 // DPI used in pdftoppm (updated to match the highest resolution)
        );

        // Log scaling information for debugging
        console.log(
          `Page ${i + 1}: Original ${imageDimensions.width}x${
            imageDimensions.height
          }px -> Scaled ${scaledDimensions.width}x${
            scaledDimensions.height
          }pts (scale: ${scaledDimensions.scale.toFixed(3)})`
        );

        // Calculate vertical centering - distribute remaining space as top/bottom margins
        const usedHeight = scaledDimensions.height;
        const availableHeight = pageHeight - 2 * 0.1 * 72; // Page height minus minimal margins
        const extraSpace = Math.max(0, availableHeight - usedHeight);
        const verticalPadding = Math.floor(extraSpace / 2);

        console.log(
          `Page ${
            i + 1
          }: Vertical centering - Available: ${availableHeight}pts, Used: ${usedHeight}pts, Padding: ${verticalPadding}pts`
        );

        // Create a section for each page with appropriate orientation and centering
        const section = {
          properties: {
            page: {
              size: {
                orientation: isLandscape ? "landscape" : "portrait",
                width: pageWidth * 20, // Convert points to twips (1 point = 20 twips)
                height: pageHeight * 20,
              },
              margin: {
                top: 144, // 0.1 inch in twips (1440 twips = 1 inch, so 144 = 0.1 inch)
                right: 144,
                bottom: 144,
                left: 144,
              },
              verticalAlign: "center", // Center content vertically on the page
            },
          },
          children: [
            new Paragraph({
              alignment: "center", // Center the image horizontally
              spacing: {
                before: verticalPadding * 20, // Convert points to twips for vertical centering
                after: verticalPadding * 20, // Convert points to twips for vertical centering
                line: 240, // Single line spacing
              },
              children: [
                new ImageRun({
                  data: imageBuffer,
                  transformation: {
                    width: scaledDimensions.width,
                    height: scaledDimensions.height,
                  },
                }),
              ],
            }),
          ],
        };

        // Add page break between pages (except for the last page)
        if (i < imageFiles.length - 1) {
          section.children.push(
            new Paragraph({
              children: [],
              pageBreakBefore: true,
            })
          );
        }

        doc.addSection(section);
        processedPages++;
      } catch (imageError) {
        console.error(`Error processing image ${imgPath}:`, imageError);
        // Continue with next image instead of failing the entire conversion
        continue;
      }
    }

    // Check if we processed any pages successfully
    if (processedPages === 0) {
      await fse.remove(tmpDir);
      return NextResponse.json(
        {
          error:
            "Failed to process any images from the PDF. Please ensure the PDF contains valid content.",
        },
        { status: 500 }
      );
    }

    // Write Word document to a temp file
    const outDocxPath = path.join(
      tmpDir,
      `${path.parse(filename).name || "document"}.docx`
    );
    const buffer = await Packer.toBuffer(doc);
    await fsPromises.writeFile(outDocxPath, buffer);

    // Read Word document bytes and return as response
    const docxBuffer = await fsPromises.readFile(outDocxPath);

    const response = new NextResponse(docxBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${path.basename(
          outDocxPath
        )}"`,
        "Content-Length": String(docxBuffer.length),
      },
    });

    // remove temp files (best-effort)
    fse.remove(tmpDir).catch((err) => {
      console.warn("Failed to remove temp dir", tmpDir, err?.message || err);
    });

    return response;
  } catch (error) {
    console.error("PDF to Word conversion error:", error);
    return NextResponse.json(
      { error: "Failed to process PDF to Word conversion. Please try again." },
      { status: 500 }
    );
  }
};
