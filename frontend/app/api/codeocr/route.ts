import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const imageFile = formData.get("file");
    if (!imageFile || typeof imageFile === "string") {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Please upload PNG, JPG, JPEG, or WebP images.",
        },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit." },
        { status: 400 }
      );
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = imageFile.type;
    const base64DataUrl = `data:${mimeType};base64,${base64}`;

    const userApiKey = formData.get("api_key") as string | null;
    const userApiBase = formData.get("api_base") as string | null;
    const userModelName = formData.get("model_name") as string | null;

    const apiKey = userApiKey || process.env.OPENAI_API_KEY;
    const apiBase = userApiBase || process.env.OPENAI_API_BASE;
    const modelName = userModelName || process.env.MODEL_NAME;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required. Please configure your API settings." },
        { status: 400 }
      );
    }

    if (!modelName) {
      return NextResponse.json(
        {
          error: "Model name is required. Please configure your API settings.",
        },
        { status: 400 }
      );
    }

    const payload = {
      image_source: base64DataUrl,
      api_key: apiKey,
      api_base: apiBase,
      model_name: modelName,
    };

    const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";

    const response = await fetch(`${backendUrl}/api/codeocr`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || "Backend processing failed" },
        { status: response.status }
      );
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
      },
    });
  } catch (error) {
    console.error("Error in CodeOCR API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
