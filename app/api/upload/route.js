import { NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";
import { getSession } from "../../../lib/session";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json();

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic"],
          addRandomSuffix: true,
          maximumSizeInBytes: 15 * 1024 * 1024, // 15 MB
          tokenPayload: JSON.stringify({ userId: session.userId }),
        };
      },
      onUploadCompleted: async () => {
        // No-op: the client saves the returned URL onto the post itself.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message || "Upload failed." }, { status: 400 });
  }
}
