import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { R2_BUCKET_NAME, r2Client } from "@/lib/r2";
import type { Song } from "@/types/music";

/**
 * Helper function to convert stream to string
 * AWS SDK v3 returns Body as a ReadableStream, Blob, or Node.js Readable stream
 */
async function streamToString(body: any): Promise<string> {
  if (!body) {
    return "";
  }

  // If it's a string, return it
  if (typeof body === "string") {
    return body;
  }

  // If it's a Blob, convert to text
  if (body instanceof Blob) {
    return await body.text();
  }

  // If it's a ReadableStream (Web API), convert it
  if (body instanceof ReadableStream) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let result = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
      }
    } finally {
      reader.releaseLock();
    }

    return result;
  }

  // If it's a Node.js Readable stream (has pipe/on methods)
  if (
    body &&
    typeof body === "object" &&
    (typeof body.pipe === "function" || typeof body.on === "function")
  ) {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      body.on("data", (chunk: Buffer) => chunks.push(chunk));
      body.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      body.on("error", reject);
    });
  }

  // Fallback: try to convert to string
  try {
    return String(body);
  } catch {
    return JSON.stringify(body);
  }
}

/**
 * GET /api/playlist
 * Public endpoint to fetch the playlist.json from R2
 * Falls back to external URL if R2 is not configured
 */
export async function GET() {
  try {
    // Try to fetch from R2 first if configured
    if (R2_BUCKET_NAME) {
      try {
        const command = new GetObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: "playlist.json",
        });

        const response = await r2Client.send(command);

        if (response.Body) {
          const bodyString = await streamToString(
            response.Body as ReadableStream,
          );
          const playlist: Song[] = JSON.parse(bodyString);

          return NextResponse.json(playlist, {
            headers: {
              "Cache-Control":
                "public, s-maxage=60, stale-while-revalidate=300",
            },
          });
        }
      } catch (r2Error) {
        // If R2 fetch fails, fall through to external URL
        console.warn("R2 fetch failed, falling back to external URL:", r2Error);
      }
    }

    // Fallback: fetch from external public URL
    const externalResponse = await fetch(
      "https://files.th1nkmore.space/playlist.json",
      {
        next: { revalidate: 60 }, // Cache for 60 seconds
      },
    );

    if (!externalResponse.ok) {
      throw new Error(
        `Failed to fetch playlist: ${externalResponse.statusText}`,
      );
    }

    const playlist: Song[] = await externalResponse.json();

    return NextResponse.json(playlist, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    // If file doesn't exist, return empty array
    if ((error as { name?: string }).name === "NoSuchKey") {
      return NextResponse.json([]);
    }

    console.error("Error fetching playlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlist" },
      { status: 500 },
    );
  }
}
