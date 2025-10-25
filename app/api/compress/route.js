import { NextResponse } from "next/server";
const { compress } = require("compress-pdf");
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";
import { uploadToSupabaseIfEligible } from '@/lib/supabaseFileUpload';

export const config = {
  api: {
    bodyParser: false, // required for file uploads
  },
};

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("files");
    const compressionLevel = formData.get("compressionLevel") || "screen";

    if (!file) {
      return NextResponse.json(
        {
          error: "Please upload a PDF file to compress.",
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

    // Create temporary file for compress-pdf
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `temp-${Date.now()}.pdf`);

    try {
      // Write buffer to temporary file
      await writeFile(tempFilePath, buffer);

      // Set compression options based on level with conservative, readable quality
      let compressOptions = {};

      switch (compressionLevel) {
        case "basic": // Light compression, preserve original image quality
          compressOptions = {
            resolution: "prepress",
            compatibilityLevel: 2.0,
            gsCompression: "lzw", // Lossless compression instead of JPEG
            imageQuality: 100, // Maximum quality (no loss)
            colorImageResolution: 600, // Very high resolution
            grayImageResolution: 600,
            embedAllFonts: true,
            downsampleColorImages: false, // Don't downsample any images
            downsampleGrayImages: false,
            downsampleMonoImages: false,
            compressColorImages: false, // Don't compress color images
            compressGrayImages: false, // Don't compress grayscale images
            compressMonoImages: true, // Only compress monochrome (text) lightly
            optimizeForSpeed: false, // Optimize for quality, not speed
          };
          break;

        case "strong": // Moderate compression
          compressOptions = {
            resolution: "printer",
            compatibilityLevel: 1.6,
            gsCompression: "jpeg",
            imageQuality: 85,
            colorImageResolution: 300,
            grayImageResolution: 300,
            downsampleColorImages: true,
            downsampleGrayImages: true,
          };
          break;

        case "extreme": // High compression
          compressOptions = {
            resolution: "ebook",
            compatibilityLevel: 1.4,
            gsCompression: "jpeg",
            imageQuality: 70,
            colorImageResolution: 150,
            grayImageResolution: 150,
            downsampleColorImages: true,
            downsampleGrayImages: true,
          };
          break;

        default: // Default to light compression if not specified
          compressOptions = {
            resolution: "prepress",
            compatibilityLevel: 1.7,
            gsCompression: "jpeg",
            imageQuality: 95,
            colorImageResolution: 400,
            grayImageResolution: 400,
            embedAllFonts: true,
            downsampleColorImages: false,
          };
      }

      // Compress PDF using compress-pdf
      const compressedBuffer = await compress(tempFilePath, compressOptions);

      // Clean up temporary file
      await unlink(tempFilePath);

      const originalSize = buffer.length;
      const compressedSize = compressedBuffer.length;
      const compressionRatio = (
        ((originalSize - compressedSize) / originalSize) *
        100
      ).toFixed(1);

      // Try uploading to Supabase
      const uploadResult = await uploadToSupabaseIfEligible(
        compressedBuffer,
        `compressed-${file.name}`,
        file.name
      );

      const response = new Response(compressedBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="compressed-${file.name}"`,
          "Content-Length": compressedBuffer.length.toString(),
          "X-Original-Size": originalSize.toString(),
          "X-Compressed-Size": compressedBuffer.length.toString(),
          "X-Compression-Ratio": compressionRatio,
        },
      });

      // Add Supabase upload info to response headers if successful
      if (uploadResult.uploaded && uploadResult.publicUrl) {
        response.headers.set('X-Supabase-Url', uploadResult.publicUrl);
        response.headers.set('X-File-Size', uploadResult.fileSize.toString());
      } else if (uploadResult.error) {
        response.headers.set('X-Upload-Warning', uploadResult.error);
      }

      return response;
    } catch (processingError) {
      // Clean up temporary file in case of error
      try {
        await unlink(tempFilePath);
      } catch (unlinkError) {
        // Ignore unlink errors
      }
      throw processingError;
    }
  } catch (error) {
    console.error("PDF compression error:", error);

    if (error.message && error.message.includes("Invalid PDF")) {
      return NextResponse.json(
        {
          error: "The uploaded file is corrupted or not a valid PDF document.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Failed to compress PDF. Please try again with a different compression level.",
      },
      { status: 500 }
    );
  }
}
