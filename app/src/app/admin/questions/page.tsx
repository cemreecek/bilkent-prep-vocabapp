"use client";

import React, { useState } from "react";
import Link from "next/link";

type Opt = { id?: string; text: string; isCorrect: boolean; blankIndex: number | null };
type Q = {
  id: string;
  week: number;
  questionText: string;
  instruction: string;
  type: string;
  correctAnswer: string | null;
  options: Opt[];
  issues: string[];
  list: { level: string; unit: string };
};

export default function QuestionEditorPage() {
  const [level, setLevel] = useState("");
  const [unit, setUnit] = useState("");
  const [week, setWeek] = useState("");
  const [onlyIssues, setOnlyIssues] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (level) params.set("level", level);
      if (unit) params.set("unit", unit);
      if (week) params.set("week", week);
      if (onlyIssues) params.set("issues", "1");
      const res = await fetch(`/api/admin/questions?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load questions");
      setQuestions(json.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const patch = (id: string, changes: Partial<Q>) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...changes } : q)));

  const setOption = (q: Q, idx: number, changes: Partial<Opt>) =>
    patch(q.id, { options: q.options.map((o, i) => (i === idx ? { ...o, ...changes } : o)) });

  const addOption = (q: Q, blankIndex: number | null) =>
    patch(q.id, { options: [...q.options, { text: "", isCorrect: false, blankIndex }] });

  const removeOption = (q: Q, idx: number) =>
    patch(q.id, { options: q.options.filter((_, i) => i !== idx) });

  const hasBlanks = (q: Q) => q.type === "paragraph-cloze" || q.options.some((o) => (o.blankIndex ?? 1) !== 1);
  const nextBlank = (q: Q) => Math.max(0, ...q.options.map((o) => o.blankIndex ?? 1)) + 1;

  const save = async (q: Q) => {
    setSavingId(q.id);
    setError(null);
    try {
      const res = await fetch("/api/admin/edit-question", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: q.id,
          questionText: q.questionText,
          instruction: q.instruction,
          type: q.type,
          correctAnswer: q.correctAnswer,
          options: q.options.map(({ text, isCorrect, blankIndex }) => ({ text, isCorrect, blankIndex })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save");
      setSavedId(q.id);
      setTimeout(() => setSavedId((s) => (s === q.id ? null : s)), 2500);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (q: Q) => {
    if (!confirm("Delete this question permanently?")) return;
    const res = await fetch(`/api/admin/edit-question?id=${q.id}`, { method: "DELETE" });
    if (res.ok) setQuestions((qs) => qs.filter((x) => x.id !== q.id));
    else setError("Failed to delete question");
  };

  const input = "w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500";

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Question Editor</h1>
          <p className="mt-1 text-gray-600">Find and fix saved questions. Wrong answer keys are flagged automatically.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Link href="/admin" className="text-sm font-semibold text-blue-600 hover:underline">← Admin Dashboard</Link>
          <Link href="/admin/content-manager" className="text-sm font-semibold text-blue-600 hover:underline">Content Manager</Link>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <label className="text-sm font-medium text-gray-700">
          Level
          <select className={input} value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">All</option>
            <option value="Elementary">Elementary</option>
            <option value="PreIntermediate">PreIntermediate</option>
            <option value="Intermediate">Intermediate</option>
            <option value="UpperIntermediate">UpperIntermediate</option>
            <option value="PreFac">Pre-Faculty</option>
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700">
          Unit
          <input className={input} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. Set 1" />
        </label>
        <label className="text-sm font-medium text-gray-700">
          Week
          <input className={input} type="number" min={1} value={week} onChange={(e) => setWeek(e.target.value)} />
        </label>
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2 pb-2">
          <input type="checkbox" checked={onlyIssues} onChange={(e) => setOnlyIssues(e.target.checked)} />
          Only suspicious answer keys
        </label>
        <button onClick={load} disabled={loading} className="bg-blue-600 text-white rounded-lg py-2 font-semibold hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Loading..." : "Load questions"}
        </button>
      </div>

      {error && <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 text-sm text-red-700 rounded">{error}</div>}

      <div className="space-y-4">
        {questions.map((q) => (
          <div key={q.id} className={`bg-white rounded-xl border shadow-sm p-4 ${q.issues.length ? "border-amber-400" : "border-gray-200"}`}>
            <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">{q.type}</span>
              <span className="text-gray-500">{q.list.level} · {q.list.unit} · Week {q.week}</span>
              {q.issues.map((i) => (
                <span key={i} className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">⚠ {i}</span>
              ))}
            </div>

            <label className="block text-xs font-semibold text-gray-600 mb-1">Instruction</label>
            <input className={`${input} mb-3`} value={q.instruction} onChange={(e) => patch(q.id, { instruction: e.target.value })} />

            <label className="block text-xs font-semibold text-gray-600 mb-1">Question</label>
            <textarea className={`${input} mb-3`} rows={3} value={q.questionText} onChange={(e) => patch(q.id, { questionText: e.target.value })} />

            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Correct answer text (gap-fill). Separate accepted alternatives with | e.g. color | colour
            </label>
            <input className={`${input} mb-3`} value={q.correctAnswer ?? ""} onChange={(e) => patch(q.id, { correctAnswer: e.target.value })} />

            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-600">
                  Options {hasBlanks(q) ? "(blank number + correct tick)" : "(tick every option that is correct)"}
                </label>
              </div>
              {q.options.length > 0 && (
                <div className="hidden md:flex gap-2 text-[11px] font-semibold text-gray-500 px-1 mb-1">
                  <span className="w-16">Blank #</span>
                  <span className="w-16">Correct?</span>
                  <span className="flex-1">Text</span>
                  <span className="w-8" />
                </div>
              )}
              <div className="space-y-2">
                {q.options.map((o, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      title="Blank number"
                      className="w-16 border border-gray-300 rounded-lg p-2 text-sm"
                      value={o.blankIndex ?? 1}
                      onChange={(e) => setOption(q, idx, { blankIndex: Math.max(1, parseInt(e.target.value) || 1) })}
                    />
                    <label className="w-16 flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-green-600"
                        checked={o.isCorrect}
                        onChange={(e) => setOption(q, idx, { isCorrect: e.target.checked })}
                      />
                      <span className={o.isCorrect ? "text-green-700 font-semibold" : "text-gray-400"}>{o.isCorrect ? "Yes" : "No"}</span>
                    </label>
                    <input className={input} value={o.text} onChange={(e) => setOption(q, idx, { text: e.target.value })} />
                    <button onClick={() => removeOption(q, idx)} title="Remove option" className="w-8 text-red-500 hover:text-red-700 font-bold">✕</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => addOption(q, hasBlanks(q) ? Math.max(1, nextBlank(q) - 1) : 1)} className="text-sm text-blue-600 font-semibold hover:underline">+ Add option</button>
                {q.type === "paragraph-cloze" && (
                  <button onClick={() => addOption(q, nextBlank(q))} className="text-sm text-blue-600 font-semibold hover:underline">+ Add new blank</button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              {savedId === q.id && <span className="text-sm text-green-600 font-semibold">Saved ✓</span>}
              <button onClick={() => remove(q)} className="text-sm text-red-600 hover:text-red-800 font-medium">Delete</button>
              <button onClick={() => save(q)} disabled={savingId === q.id} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
                {savingId === q.id ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        ))}
        {!loading && questions.length === 0 && <p className="text-center text-gray-500 py-10">Pick filters and press “Load questions”.</p>}
      </div>
    </div>
  );
}
