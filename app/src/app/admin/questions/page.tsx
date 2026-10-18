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

  // Mark one option as the single correct one within its blank group.
  const markCorrect = (q: Q, idx: number) => {
    const group = q.options[idx].blankIndex ?? 1;
    patch(q.id, {
      options: q.options.map((o, i) =>
        (o.blankIndex ?? 1) === group ? { ...o, isCorrect: i === idx } : o
      ),
    });
  };

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
        <Link href="/admin/content-manager" className="text-sm font-semibold text-blue-600 hover:underline">
          ← Content Manager
        </Link>
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

            {q.options.length === 0 ? (
              <>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Correct answer</label>
                <input className={`${input} mb-3`} value={q.correctAnswer ?? ""} onChange={(e) => patch(q.id, { correctAnswer: e.target.value })} />
              </>
            ) : (
              <div className="mb-3 space-y-2">
                <label className="block text-xs font-semibold text-gray-600">Options (select the correct one)</label>
                {q.options.map((o, idx) => (
                  <div key={o.id ?? idx} className="flex items-center gap-2">
                    {q.options.some((x) => (x.blankIndex ?? 1) !== 1) && (
                      <span className="text-xs text-gray-500 w-14">Blank {o.blankIndex ?? 1}</span>
                    )}
                    <input type="radio" checked={o.isCorrect} onChange={() => markCorrect(q, idx)} className="accent-green-600" />
                    <input className={input} value={o.text} onChange={(e) => setOption(q, idx, { text: e.target.value })} />
                  </div>
                ))}
              </div>
            )}

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
