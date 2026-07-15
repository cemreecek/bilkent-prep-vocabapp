"use client";

import React, { useState } from "react";

interface QuestionReviewCardProps {
  section: any;
  index: number;
  onUpdate: (updatedSection: any) => void;
  onDelete: () => void;
}

export default function QuestionReviewCard({ section, index, onUpdate, onDelete }: QuestionReviewCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [jsonText, setJsonText] = useState(JSON.stringify(section, null, 2));
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonText);
      onUpdate(parsed);
      setIsEditing(false);
      setError(null);
    } catch (e: any) {
      setError("Invalid JSON: " + e.message);
    }
  };

  const cancelEdit = () => {
    setJsonText(JSON.stringify(section, null, 2));
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <div>
          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-medium mr-2">
            Section {index + 1}
          </span>
          <span className="text-sm font-medium text-gray-700">{section.type}</span>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <button 
                onClick={() => setIsEditing(true)}
                className="text-sm text-gray-600 hover:text-blue-600 font-medium"
              >
                Edit Raw
              </button>
              <button 
                onClick={onDelete}
                className="text-sm text-red-600 hover:text-red-800 font-medium ml-2"
              >
                Delete
              </button>
            </>
          ) : (
            <>
              <button onClick={cancelEdit} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              <button onClick={handleSave} className="text-sm text-green-600 hover:text-green-700 font-bold">Save</button>
            </>
          )}
        </div>
      </div>

      <div className="p-4">
        {isEditing ? (
          <div>
            <textarea
              className="w-full h-64 font-mono text-sm p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              spellCheck={false}
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <span className="font-semibold text-blue-900 text-sm">Instruction:</span>
              <p className="text-blue-800 mt-1">{section.instruction || "None"}</p>
            </div>
            
            <div className="space-y-4">
              {section.items && section.items.map((item: any, i: number) => (
                <div key={i} className="pl-4 border-l-4 border-gray-200">
                  <p className="font-medium text-gray-800 whitespace-pre-wrap">{item.questionText}</p>
                  
                  {/* Handle normal options */}
                  {item.options && Array.isArray(item.options) && item.options.length > 0 && !Array.isArray(item.options[0]) && (
                    <ul className="mt-2 space-y-1">
                      {item.options.map((opt: any, j: number) => (
                        <li key={j} className={`text-sm px-2 py-1 rounded ${opt.isCorrect ? 'bg-green-100 text-green-800 font-medium' : 'text-gray-600'}`}>
                          {opt.isCorrect && '✅ '}
                          {opt.text}
                          {opt.blankIndex && <span className="ml-2 text-xs text-gray-400">(Blank {opt.blankIndex})</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  {/* Handle nested options for paragraph-cloze */}
                  {item.options && Array.isArray(item.options) && item.options.length > 0 && Array.isArray(item.options[0]) && (
                    <div className="mt-3 space-y-3">
                      {item.options.map((subArr: any[], j: number) => (
                        <div key={j} className="bg-gray-50 p-2 rounded border border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Blank {j + 1}</p>
                          <ul className="flex flex-wrap gap-2">
                            {subArr.map((opt: any, k: number) => (
                              <li key={k} className={`text-sm px-2 py-1 rounded ${opt.isCorrect ? 'bg-green-100 text-green-800 font-medium border border-green-200' : 'bg-white text-gray-600 border border-gray-200'}`}>
                                {opt.text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Handle direct correctAnswer */}
                  {item.correctAnswer && item.correctAnswer !== 'multiple' && (
                    <p className="mt-2 text-sm text-green-700 bg-green-50 inline-block px-2 py-1 rounded border border-green-100">
                      <span className="font-medium mr-1">Answer:</span> {item.correctAnswer}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
