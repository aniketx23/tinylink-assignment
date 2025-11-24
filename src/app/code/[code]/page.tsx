"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Link = {
  code: string;
  targetUrl: string;
  clickCount: number;
  lastClickedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function CodeStatsPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [link, setLink] = useState<Link | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/links/${code}`);
        if (res.status === 404) {
          setError("Short link not found.");
          setLink(null);
          return;
        }
        if (!res.ok) {
          throw new Error(`Failed to load stats (${res.status})`);
        }
        const data = (await res.json()) as Link;
        setLink(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? "Failed to load stats");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [code]);

  const shortUrl = link ? `${baseUrl}/${link.code}` : "";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Stats for <span className="font-mono text-sky-400">{code}</span>
            </h1>
            <p className="text-sm text-slate-400">
              Detailed statistics for this short link.
            </p>
          </div>
          <button
            className="text-xs text-sky-400 hover:text-sky-300 underline"
            onClick={() => router.push("/")}
          >
            Back to dashboard
          </button>
        </header>

        {loading && (
          <p className="text-sm text-slate-400">Loading stats...</p>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && link && (
          <div className="space-y-4">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6 space-y-3">
              <div className="space-y-1">
                <h2 className="text-lg font-medium">Link details</h2>
                <p className="text-xs text-slate-400">
                  Created at{" "}
                  {new Date(link.createdAt).toLocaleString()} • Last updated{" "}
                  {new Date(link.updatedAt).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-400">Short URL:</span>{" "}
                  <span className="font-mono">{shortUrl}</span>
                </div>
                <div>
                  <span className="text-slate-400">Target URL:</span>{" "}
                  <span className="break-all">{link.targetUrl}</span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-xs text-slate-400 uppercase tracking-wide">
                  Total clicks
                </p>
                <p className="text-2xl font-semibold tabular-nums">
                  {link.clickCount}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-400 uppercase tracking-wide">
                  Last clicked
                </p>
                <p className="text-sm text-slate-100">
                  {link.lastClickedAt
                    ? new Date(link.lastClickedAt).toLocaleString()
                    : "Never"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-400 uppercase tracking-wide">
                  Code
                </p>
                <p className="font-mono text-sky-300">{link.code}</p>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
