"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/gov/client";
import type { GeographicUnitOut, DirectoryUserOut } from "@/lib/gov/types";
import { RESEARCH_AREAS, RESEARCH_TYPES, VISIBILITY_OPTIONS } from "./constants";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateWorkspaceModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [researchArea, setResearchArea] = useState(RESEARCH_AREAS[0]);
  const [researchType, setResearchType] = useState(RESEARCH_TYPES[0]);
  const [states, setStates] = useState<GeographicUnitOut[]>([]);
  const [districts, setDistricts] = useState<GeographicUnitOut[]>([]);
  const [geoLevel, setGeoLevel] = useState<"state" | "district">("district");
  const [geoId, setGeoId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [visibility, setVisibility] = useState<"Private" | "Team" | "Public">("Team");
  const [users, setUsers] = useState<DirectoryUserOut[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listGeographies("state").then(setStates);
    api.listGeographies("district").then(setDistricts);
    api.listDirectoryUsers().then(setUsers).catch(() => {});
  }, []);

  const geoOptions = geoLevel === "state" ? states : districts;
  const stateNameById = new Map(states.map((s) => [s.id, s.name]));

  function toggleUser(id: string) {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addEmail() {
    const e = emailInput.trim().toLowerCase();
    if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || emails.includes(e)) return;
    setEmails((prev) => [...prev, e]);
    setEmailInput("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const geo = geoOptions.find((g) => g.id === geoId);
      const geography_name = geo ? (geoLevel === "district" ? `${geo.name}, ${stateNameById.get(geo.parent_id ?? "") ?? ""}` : geo.name) : undefined;
      await api.createWorkspace({
        name: name.trim(),
        description: description.trim() || undefined,
        geographic_unit_id: geoId || undefined,
        geography_name,
        research_area: researchArea,
        research_type: researchType,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        visibility,
        collaborator_user_ids: Array.from(selectedUserIds),
        collaborator_emails: emails,
      });
      onCreated();
    } catch (err: any) {
      setError(err?.message ?? "Could not create the workspace.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-register-ink/40 px-4 py-8 backdrop-blur-[1px]">
      <div className="w-full max-w-2xl rounded-sm border border-register-line bg-register-panel shadow-raised">
        <div className="flex items-center justify-between border-b border-register-line px-6 py-4">
          <h3 className="font-serif-display text-lg font-semibold text-register-navy">Create workspace</h3>
          <button onClick={onClose} className="text-register-ink/40 hover:text-register-ink" aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[75vh] space-y-5 overflow-y-auto px-6 py-5">
          {error && <p className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-register-ink/80">Workspace name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Gurugram peri-urban land conversion study"
              className="w-full rounded-sm border border-register-line bg-white px-3 py-2.5 text-sm focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-register-ink/80">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What is this workspace researching, and why?"
              className="w-full rounded-sm border border-register-line bg-white px-3 py-2.5 text-sm focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-register-ink/80">Research area</label>
              <select
                value={researchArea}
                onChange={(e) => setResearchArea(e.target.value)}
                className="w-full rounded-sm border border-register-line bg-white px-3 py-2.5 text-sm focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
              >
                {RESEARCH_AREAS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-register-ink/80">Research type</label>
              <select
                value={researchType}
                onChange={(e) => setResearchType(e.target.value)}
                className="w-full rounded-sm border border-register-line bg-white px-3 py-2.5 text-sm focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
              >
                {RESEARCH_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-register-ink/80">
              Geography <span className="font-normal text-register-ink/50">(from this platform's real state/district list)</span>
            </label>
            <div className="flex gap-2">
              <select
                value={geoLevel}
                onChange={(e) => {
                  setGeoLevel(e.target.value as "state" | "district");
                  setGeoId("");
                }}
                className="w-28 shrink-0 rounded-sm border border-register-line bg-white px-2 py-2.5 text-sm focus:border-register-navy focus:outline-none"
              >
                <option value="district">District</option>
                <option value="state">State</option>
              </select>
              <select
                value={geoId}
                onChange={(e) => setGeoId(e.target.value)}
                className="flex-1 rounded-sm border border-register-line bg-white px-3 py-2.5 text-sm focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
              >
                <option value="">No specific geography</option>
                {geoOptions.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                    {geoLevel === "district" ? ` — ${stateNameById.get(g.parent_id ?? "") ?? ""}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-register-ink/80">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-sm border border-register-line bg-white px-3 py-2.5 text-sm focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-register-ink/80">Target end date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-sm border border-register-line bg-white px-3 py-2.5 text-sm focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-register-ink/80">Visibility</label>
            <div className="grid grid-cols-3 gap-2">
              {VISIBILITY_OPTIONS.map((v) => (
                <button
                  type="button"
                  key={v.value}
                  onClick={() => setVisibility(v.value)}
                  title={v.helper}
                  className={`rounded-sm border px-3 py-2 text-left text-xs transition-colors ${
                    visibility === v.value
                      ? "border-register-navy bg-register-navy text-white"
                      : "border-register-line text-register-ink/70 hover:border-register-navy/40"
                  }`}
                >
                  <span className="block font-medium">{v.label}</span>
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-register-ink/50">{VISIBILITY_OPTIONS.find((v) => v.value === visibility)?.helper}</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-register-ink/80">Invite collaborators from this platform</label>
            {users.length === 0 ? (
              <p className="text-xs text-register-ink/50">No other users found in the directory.</p>
            ) : (
              <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto rounded-sm border border-register-line bg-white p-2.5">
                {users.map((u) => (
                  <label
                    key={u.id}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs transition-colors ${
                      selectedUserIds.has(u.id)
                        ? "border-register-navy bg-register-navy text-white"
                        : "border-register-line text-register-ink/70 hover:border-register-navy/40"
                    }`}
                  >
                    <input type="checkbox" checked={selectedUserIds.has(u.id)} onChange={() => toggleUser(u.id)} className="hidden" />
                    {u.full_name ?? u.email}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-register-ink/80">Or invite by email</label>
            <div className="flex gap-2">
              <input
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addEmail();
                  }
                }}
                placeholder="name@department.gov.in"
                className="flex-1 rounded-sm border border-register-line bg-white px-3 py-2 text-sm focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
              />
              <button type="button" onClick={addEmail} className="rounded-sm border border-register-navy/30 px-3 py-2 text-sm font-medium text-register-navy hover:bg-register-navy hover:text-white">
                Add
              </button>
            </div>
            {emails.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {emails.map((e) => (
                  <span key={e} className="flex items-center gap-1 rounded-sm border border-register-line bg-register-bg px-2 py-0.5 text-xs text-register-ink/70">
                    {e}
                    <button type="button" onClick={() => setEmails((prev) => prev.filter((x) => x !== e))} className="text-register-ink/40 hover:text-red-600">
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="mt-1 text-[11px] text-register-ink/50">
              Only emails already registered on this platform's demo directory are added as members immediately.
            </p>
          </div>
        </form>

        <div className="flex justify-end gap-2 border-t border-register-line px-6 py-4">
          <button onClick={onClose} className="rounded-sm border border-register-line px-4 py-2 text-sm font-medium text-register-ink/70 hover:bg-register-bg">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={creating || !name.trim()}
            className="rounded-sm bg-register-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-register-navy2 disabled:cursor-not-allowed disabled:bg-register-ink/20"
          >
            {creating ? "Creating…" : "Create workspace"}
          </button>
        </div>
      </div>
    </div>
  );
}
