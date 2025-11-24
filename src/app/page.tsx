"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Link = {
  code: string;
  targetUrl: string;
  clickCount: number;
  lastClickedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const CODE_REGEX = /^[A-Za-z0-9]{6,8}$/;

export default function DashboardPage() {
  const router = useRouter();
  const [links, setLinks] = useState<Link[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [linksError, setLinksError] = useState<string | null>(null);

  const [url, setUrl] = useState("");
  const [code, setCode] = useState("");
 
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "clickCount">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  
  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  // Fetch links
  
  async function fetchLinks() {
    setLoadingLinks(true);
    setLinksError(null);
    try {
      const res = await fetch("/api/links");
      if (!res.ok) {
        throw new Error(`Failed to load links (${res.status})`);
      }
      const data = (await res.json()) as Link[];
      setLinks(data);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      setLinksError(msg ?? "Failed to load links");
    } finally {
      setLoadingLinks(false);
    }
  }

  useEffect(() => {
    fetchLinks();
  }, []);

  // Filter + sort
  const filteredLinks = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = links;
    if (q) {
      list = list.filter(
        (l) =>
          l.code.toLowerCase().includes(q) ||
          l.targetUrl.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "createdAt") {
        cmp =
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime();
      } else {
        cmp = a.clickCount - b.clickCount;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [links, search, sortBy, sortDir]);

  function toggleSort(field: "createdAt" | "clickCount") {
    if (sortBy === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  }

  // Form submit
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setFormSuccess(null);

    const trimmedUrl = url.trim();
    const trimmedCode = code.trim();

    if (!trimmedUrl) {
      setErrorMessage("URL is required");
      return;
    }
    try {
      new URL(trimmedUrl);
    } catch {
      setErrorMessage("Please enter a valid http(s) URL");
      return;
    }

    if (trimmedCode && !CODE_REGEX.test(trimmedCode)) {
      setErrorMessage("Code must be 6–8 characters [A–Z a–z 0–9]");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: trimmedUrl,
          code: trimmedCode || undefined,
        }),
      });

      if (res.status === 409) {
        setErrorMessage("That code is already taken. Try another one.");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data.error ?? `Failed to create link (${res.status})`);
        return;
      }

      const created = (await res.json()) as Link;

      setLinks((prev) => [created, ...prev]);
      setUrl("");
      setCode("");
      setFormSuccess("Short link created!");
    } catch (err: unknown) {
      console.error(err);

      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    
      setTimeout(() => setFormSuccess(null), 2000);
    }
  }
//Calls DELETE
  async function handleDelete(code: string) {
    if (!confirm(`Delete link "${code}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/links/${code}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        alert("Failed to delete link");
        return;
      }
      setLinks((prev) => prev.filter((l) => l.code !== code));
    } catch (err) {
      console.error(err);
      alert("Failed to delete link");
    }
  }

  async function handleCopy(shortUrl: string) {
    try {
      await navigator.clipboard.writeText(shortUrl);
      alert("Copied!");
    } catch {
      alert("Could not copy to clipboard");
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              TinyLink Dashboard
            </h1>
            <p className="text-sm text-slate-400">
              Create, manage, and inspect your short links.
            </p>
          </div>
          <button
            className="text-xs text-sky-400 hover:text-sky-300 underline"
            onClick={() => fetchLinks()}
          >
            Refresh
          </button>
        </header>

        {/* Create form */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-medium">Create a short link</h2>

          <form
            onSubmit={handleSubmit}
            className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-end sm:gap-3"
          >
            <div className="flex-1 min-w-[220px] space-y-1">
              <label className="block text-xs uppercase tracking-wide text-slate-400">
                Long URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/docs"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="w-full sm:w-56 space-y-1">
              <label className="block text-xs uppercase tracking-wide text-slate-400">
                Custom code (optional)
              </label>
              <div className="flex items-center gap-1 text-sm">
                <span className="hidden sm:inline text-slate-500">
                  {baseUrl}/
                </span>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="docs01"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                6–8 letters or digits, globally unique.
              </p>
              {errorMessage && (
                <p className="mt-1 text-sm text-red-400">{errorMessage}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating..." : "Create"}
            </button>
          </form>

          {/* Form messages (success shown below) */}
          {formSuccess && (
            <p className="text-sm text-emerald-400 bg-emerald-950/40 border border-emerald-900 rounded-xl px-3 py-2">
              {formSuccess}
            </p>
          )}
        </section>

        {/* Links table */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-medium">Your links</h2>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by code or URL..."
                className="w-full sm:w-64 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
              <div className="flex gap-2 text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => toggleSort("createdAt")}
                  className={`px-2 py-1 rounded-lg border ${
                    sortBy === "createdAt"
                      ? "border-sky-500 text-sky-300"
                      : "border-slate-700"
                  }`}
                >
                  Date {sortBy === "createdAt" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </button>
                <button
                  type="button"
                  onClick={() => toggleSort("clickCount")}
                  className={`px-2 py-1 rounded-lg border ${
                    sortBy === "clickCount"
                      ? "border-sky-500 text-sky-300"
                      : "border-slate-700"
                  }`}
                >
                  Clicks{" "}
                  {sortBy === "clickCount" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </button>
              </div>
            </div>
          </div>

          {loadingLinks && (
            <p className="text-sm text-slate-400">Loading links...</p>
          )}
          {linksError && (
            <p className="text-sm text-red-400">
              Failed to load links: {linksError}
            </p>
          )}

          {!loadingLinks && !linksError && filteredLinks.length === 0 && (
            <div className="w-full py-12 flex items-center justify-center">
              <p className="text-sm text-slate-400">No links created yet</p>
            </div>
          )}

          {!loadingLinks && filteredLinks.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase text-slate-400">
                    <th className="py-2 pr-4 text-left">Code</th>
                    <th className="py-2 pr-4 text-left">Short URL</th>
                    <th className="py-2 pr-4 text-left">Target URL</th>
                    <th className="py-2 pr-4 text-right">Clicks</th>
                    <th className="py-2 pr-4 text-left">Last clicked</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLinks.map((link) => {
                    const shortUrl = `${baseUrl}/${link.code}`;
                    return (
                      <tr
                        key={link.code}
                        className="border-b border-slate-800/60 hover:bg-slate-900/60"
                      >
                        <td className="py-2 pr-4 font-mono text-xs">
                          <button
                            className="text-sky-400 hover:underline"
                            onClick={() => router.push(`/code/${link.code}`)}
                          >
                            {link.code}
                          </button>
                        </td>
                        <td className="py-2 pr-4 max-w-[200px]">
                          <div className="flex items-center gap-2">
                            <div className="block truncate max-w-[200px]">
                              <span className="text-gray-500 mr-1">{baseUrl}/</span>
                              <span className="font-bold text-white">{link.code}</span>
                            </div>
                            <button
                              type="button"
                              className="text-[11px] px-2 py-1 rounded-lg border border-slate-700 hover:border-sky-500"
                              onClick={() => handleCopy(shortUrl)}
                            >
                              Copy
                            </button>
                          </div>
                        </td>
                        <td className="py-2 pr-4 max-w-[200px]">
                          <span className="block truncate max-w-[200px]">
                            {link.targetUrl}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums">
                          {link.clickCount}
                        </td>
                        <td className="py-2 pr-4 text-xs text-slate-400">
                          {link.lastClickedAt
                            ? new Date(link.lastClickedAt).toLocaleString()
                            : "—"}
                        </td>
                        <td className="py-2 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              className="text-[11px] px-2 py-1 rounded-lg border border-slate-700 hover:border-sky-500"
                              onClick={() => router.push(`/code/${link.code}`)}
                            >
                              Stats
                            </button>
                            <button
                              type="button"
                              className="text-[11px] px-2 py-1 rounded-lg border border-red-700 text-red-300 hover:bg-red-900/40"
                              onClick={() => handleDelete(link.code)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
