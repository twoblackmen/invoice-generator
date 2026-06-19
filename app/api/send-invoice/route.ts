import { NextRequest, NextResponse } from "next/server";

// Increase body size limit to 10MB to accommodate base64-encoded PDF payloads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export async function POST(req: NextRequest) {
  const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json(
      { error: "Webhook URL is not configured. Check your .env.local file." },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return NextResponse.json(
        {
          error: `Webhook returned ${response.status} ${response.statusText}.${
            response.status === 404
              ? " Make sure your n8n workflow is active and listening (open the workflow and click 'Test workflow')."
              : ""
          }`,
          details: text,
        },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to reach webhook: ${message}` },
      { status: 502 }
    );
  }
}
