"use client";

import React, { useState } from "react";

export default function InContextEditor({ 
  question, 
  onClose, 
  onSave, 
  onDelete 
}: { 
  question: any; 
  onClose: () => void; 
  onSave: (updated: any) => Promise<void>; 
  onDelete: () => Promise<void>; 
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // State for all editable fields
  const [questionText, setQuestionText] = useState(question.question || question.questionText || "");
  const [instruction, setInstruction] = useState(question.instruction || "");
  const [type, setType] = useState(question.mode || question.type || "multiple-choice");
  const [correctAnswer, setCorrectAnswer] = useState(question.correctAnswer || "");
  const [options, setOptions] = useState<any[]>(question.options || []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        id: question.id,
        questionText,
        instruction,
        type,
        correctAnswer,
        options
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this question?")) return;
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  const updateOption = (idx: number, field: string, val: any) => {
    const newOptions = [...options];
    newOptions[idx] = { ...newOptions[idx], [field]: val };
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, { id: `temp-${Date.now()}-${Math.random()}`, text: "", isCorrect: false, blankIndex: 1 }]);
  };

  const removeOption = (idx: number) => {
    const newOptions = [...options];
    newOptions.splice(idx, 1);
    setOptions(newOptions);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">edit_note</span>
            In-Context Editor
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Practice Type</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="cloze">Cloze (Inline)</option>
                <option value="gap-fill">Gap Fill (Typing)</option>
                <option value="word-bank">Word Bank</option>
                <option value="paragraph-cloze">Paragraph Cloze</option>
                <option value="word-form">Word Form</option>
                <option value="rewriting">Rewriting</option>
                <option value="matching">Matching</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Instruction</label>
              <input 
                type="text" 
                value={instruction} 
                onChange={(e) => setInstruction(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. Choose the correct word"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Question Text</label>
            <textarea 
              value={questionText} 
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg min-h-[100px] focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
              placeholder="Enter question text here... Use ______ for blanks in cloze."
            />
          </div>

          {(type === "gap-fill" || type === "word-form" || type === "rewriting") && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Correct Answer (Exact Match)</label>
              <input 
                type="text" 
                value={correctAnswer} 
                onChange={(e) => setCorrectAnswer(e.target.value)}
                className="w-full p-2.5 border border-green-300 bg-green-50 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-bold text-green-900"
                placeholder="The exact word they need to type"
              />
            </div>
          )}

          {(type === "multiple-choice" || type === "cloze" || type === "word-bank" || type === "paragraph-cloze" || type === "matching") && (
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-gray-700">Options</label>
                <button onClick={addOption} className="text-sm text-blue-600 font-bold hover:underline">+ Add Option</button>
              </div>
              
              <div className="space-y-3">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex gap-3 items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    {type === "matching" ? (
                      <div className="flex-1 flex gap-2">
                        <input 
                          type="text" 
                          value={(opt.text || "").split("|||")[0] || ""} 
                          onChange={(e) => {
                            const def = (opt.text || "").split("|||")[1] || "";
                            updateOption(idx, "text", `${e.target.value}|||${def}`);
                          }}
                          className="flex-1 p-2 border border-gray-200 rounded outline-none focus:border-blue-500 font-bold"
                          placeholder="Word (e.g. anonymous)"
                        />
                        <input 
                          type="text" 
                          value={(opt.text || "").split("|||")[1] || ""} 
                          onChange={(e) => {
                            const word = (opt.text || "").split("|||")[0] || "";
                            updateOption(idx, "text", `${word}|||${e.target.value}`);
                          }}
                          className="flex-1 p-2 border border-gray-200 rounded outline-none focus:border-blue-500"
                          placeholder="Definition"
                        />
                      </div>
                    ) : (
                      <input 
                        type="text" 
                        value={opt.text} 
                        onChange={(e) => updateOption(idx, "text", e.target.value)}
                        className="flex-1 p-2 border border-gray-200 rounded outline-none focus:border-blue-500"
                        placeholder="Option text..."
                      />
                    )}
                    
                    {type !== "matching" && (
                      <label className="flex items-center gap-1 text-sm font-medium cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={opt.isCorrect} 
                          onChange={(e) => updateOption(idx, "isCorrect", e.target.checked)}
                          className="w-4 h-4 text-green-600 rounded"
                        />
                        <span className={opt.isCorrect ? "text-green-700" : "text-gray-500"}>Correct</span>
                      </label>
                    )}

                    {(type === "paragraph-cloze" || type === "word-bank") && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Blank #</span>
                        <input 
                          type="number" 
                          value={opt.blankIndex || 1} 
                          onChange={(e) => updateOption(idx, "blankIndex", parseInt(e.target.value))}
                          className="w-12 p-1 border border-gray-200 rounded text-center text-sm"
                          min={1}
                        />
                      </div>
                    )}

                    <button onClick={() => removeOption(idx)} className="text-red-500 hover:text-red-700 p-1">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                ))}
                {options.length === 0 && <p className="text-sm text-gray-500 italic text-center py-2">No options added yet.</p>}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center rounded-b-2xl">
          <button 
            onClick={handleDelete}
            disabled={isDeleting || isSaving}
            className="flex items-center gap-1 text-red-600 font-bold hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-sm">delete_forever</span>
            {isDeleting ? "Deleting..." : "Delete Question"}
          </button>

          <div className="flex gap-3">
            <button onClick={onClose} disabled={isSaving} className="px-5 py-2 font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
