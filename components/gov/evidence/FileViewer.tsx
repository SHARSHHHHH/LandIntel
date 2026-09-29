"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/gov/client";

/**
 * Inline viewer for the ORIGINAL uploaded file behind an Evidence & Research
 * item -- a PDF viewer, image viewer or plain-text viewer, not just the
 * auto-extracted summary text. Falls back to a download link for formats
 * browsers cannot render inline (e.g. .docx).
 */
export function FileViewer({ documentId, filename, mimeType }: { documentId: string; filename: string; mimeType: string | null }) {
  const [state, setState] = useState<{ url: string; contentType: string } | "loading" | "error">("loading");
  const [textContent, setTextContent] = useState<string | null>(null);

  useEffect(() => {
    let revoke: string | null = null;
    setState("loading");
    api
      .getEvidenceFileBlob(documentId)
      .then(async (res) => {
        revoke = res.url;
        setState(res);
        if (res.contentType.startsWith("text/")) {
          try {
            const r = await fetch(res.url);
            setTextContent(await r.text());
          } catch {
            setTextContent(null);
          }
        }
      })
      .catch(() => setState("error"));
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [documentId]);

  if (state === "loading") {
    return <div className="h-[480px] animate-shimmer rounded-sm bg-register-line/40" />;
  }
  if (state === "error") {
    return (
      <p className="rounded-sm border border-dashed border-register-line px-4 py-6 text-center text-sm text-register-ink/50">
        Could not load the original file.
      </p>
    );
  }

  const isPdf = state.contentType.includes("pdf");
  const isImage = state.contentType.startsWith("image/");
  const isText = state.contentType.startsWith("text/");

  if (isPdf) {
    return (
      <div className="overflow-hidden rounded-sm border border-register-line bg-white">
        <embed src={state.url} type="application/pdf" className="h-[640px] w-full" title={filename} />
        <div className="border-t border-register-line px-4 py-2 text-right">
          <a href={state.url} download={filename} className="text-xs font-medium text-register-navy underline">
            Download original PDF
          </a>
        </div>
      </div>
    );
  }

  if (isImage) {
    return (
      <div className="rounded-sm border border-register-line bg-white p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={state.url} alt={filename} className="mx-auto max-h-[640px] w-auto" />
      </div>
    );
  }

  if (isText) {
    return (
      <pre className="max-h-[640px] overflow-auto whitespace-pre-wrap rounded-sm border border-register-line bg-white p-4 font-mono text-xs leading-relaxed text-register-ink/80">
        {textContent ?? "Loading…"}
      </pre>
    );
  }

  return (
    <div className="rounded-sm border border-dashed border-register-line px-4 py-6 text-center text-sm text-register-ink/60">
      <p>
        Inline preview isn&apos;t available in-browser for this file type ({mimeType || "unknown"}).
      </p>
      <a href={state.url} download={filename} className="mt-2 inline-block text-xs font-medium text-register-navy underline">
        Download the original file
      </a>
    </div>
  );
}
