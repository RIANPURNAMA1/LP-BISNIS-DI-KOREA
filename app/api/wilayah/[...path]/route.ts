const UPSTREAM = "https://wilayah.id/api";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;

  if (!path.every((segment) => /^[\w.-]+$/.test(segment))) {
    return new Response("Bad request", { status: 400 });
  }

  try {
    const res = await fetch(`${UPSTREAM}/${path.join("/")}`, {
      next: { revalidate: 86400 },
    });

    return new Response(res.body, {
      status: res.status,
      headers: {
        "content-type": "application/json",
        "cache-control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Sumber data wilayah tidak dapat dihubungi." }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}
