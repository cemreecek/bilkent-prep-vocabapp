"use client";

import { useState, useEffect } from "react";
import data from "@public/data/vocabulary.json";
import InContextEditor from '@/components/admin/InContextEditor';

export default function PracticeSession({ isAdmin }: { isAdmin?: boolean }) {
  const [practices, setPractices] = useState<any[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);

  useEffect(() => {
    if (data.sets && data.sets.length > 0) {
      setPractices(data.sets[0].practices || []);
    }
  }, []);

  const handleSaveEdit = async (updated: any) => {
    try {
      const res = await fetch('/api/admin/edit-question', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        setEditingQuestion(null);
      } else {
        const data = await res.json();
        alert("Error saving: " + data.error);
      }
    } catch (e: any) {
      alert("Failed to save: " + e.message);
    }
  };

  const handleDeleteEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/edit-question?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setEditingQuestion(null);
      } else {
        const data = await res.json();
        alert("Error deleting: " + data.error);
      }
    } catch (e: any) {
      alert("Failed to delete: " + e.message);
    }
  };

  if (practices.length === 0) {
    return <div className="p-8 text-center text-gray-500">Loading practice sets...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-3xl font-black mb-8 text-indigo-900 border-b-2 border-indigo-100 pb-4">Practice Session (Offline Mode)</h2>
      
      {practices.map((practice, idx) => (
        <div key={practice.id} className="mb-12 bg-white rounded-2xl shadow-md p-8 border border-gray-100 relative">
          <h3 className="text-xl font-bold text-gray-800 mb-6">{practice.title}</h3>
          
          <div className="space-y-8">
            {practice.questions?.map((q: any, qIdx: number) => (
              <div key={q.id} className="p-6 bg-gray-50 rounded-xl border border-gray-200 relative">
                {isAdmin && (
                  <button 
                    onClick={() => setEditingQuestion(q)}
                    className="absolute top-4 right-4 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                  >
                    Edit
                  </button>
                )}
                <p className="text-lg font-medium text-gray-900 mb-4">{qIdx + 1}. {q.prompt}</p>
                
                {practice.type === "multiple-choice" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt: string) => (
                      <button 
                        key={opt}
                        className="p-3 text-left border border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {practice.type === "gap-fill" && (
                  <div className="mt-4">
                    <span className="text-sm font-semibold text-gray-500 block mb-2">Base Word: <span className="text-indigo-600 uppercase tracking-widest">{q.baseWord}</span></span>
                    <input 
                      type="text" 
                      placeholder="Type your answer here..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>
            ))}
            
            {(!practice.questions || practice.questions.length === 0) && (
              <p className="text-orange-500 font-medium bg-orange-50 p-4 rounded-lg border border-orange-100">{practice.content || "Questions require manual formatting in the JSON file."}</p>
            )}
          </div>

          {editingQuestion && (
            <InContextEditor 
              question={editingQuestion}
              onClose={() => setEditingQuestion(null)}
              onSave={handleSaveEdit}
              onDelete={() => handleDeleteEdit(editingQuestion.id)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
