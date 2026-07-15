"use client";

import React, { useState } from "react";
import QuestionReviewCard from "@/components/admin/QuestionReviewCard";

export default function ContentManagerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState("PreFac");
  const [unit, setUnit] = useState("Set 1");
  const [week, setWeek] = useState<number>(1);
  
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [sections, setSections] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleParse = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setIsParsing(true);
    setError(null);
    setSuccess(null);
    setSections([]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/parse-document", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to parse document");
      }

      setSections(json.data);
      setSuccess(`Successfully parsed ${json.data.length} sections!`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleUpdateSection = (index: number, updatedSection: any) => {
    const newSections = [...sections];
    newSections[index] = updatedSection;
    setSections(newSections);
  };

  const handleDeleteSection = (index: number) => {
    const newSections = [...sections];
    newSections.splice(index, 1);
    setSections(newSections);
  };

  const handleSave = async () => {
    if (sections.length === 0) return;
    
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/save-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          unit,
          week,
          data: sections
        })
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to save to database");
      }

      setSuccess(json.message || "Successfully saved to database!");
      setSections([]);
      setFile(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">AI Content Manager</h1>
        <p className="mt-2 text-gray-600">Upload Word documents, let Gemini parse them into structure, review visually, and instantly inject them into your database.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700 font-medium">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Box */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-5">1. Upload & Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Level</label>
            <select 
              value={level} 
              onChange={(e) => setLevel(e.target.value)}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
            >
              <option value="Elementary">Elementary</option>
              <option value="PreIntermediate">PreIntermediate</option>
              <option value="Intermediate">Intermediate</option>
              <option value="UpperIntermediate">UpperIntermediate</option>
              <option value="PreFac">Pre-Faculty</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Unit</label>
            <input 
              type="text" 
              value={unit} 
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. Set 1"
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Week</label>
            <input 
              type="number" 
              value={week} 
              onChange={(e) => setWeek(parseInt(e.target.value))}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
              min={1}
            />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gray-50 hover:bg-gray-100 transition-colors">
          <input 
            type="file" 
            accept=".docx,.md,.txt" 
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer mb-4"
          />
          <p className="text-xs text-gray-500">Supports .docx (Word), .md (Markdown), and .txt</p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleParse}
            disabled={isParsing || !file}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isParsing ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                AI is Reading Document...
              </>
            ) : (
              'Parse Document with AI'
            )}
          </button>
        </div>
      </div>

      {/* Review Box */}
      {sections.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">2. Review & Edit</h2>
            <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-sm font-semibold">{sections.length} Sections Found</span>
          </div>
          
          <div className="space-y-6">
            {sections.map((section, idx) => (
              <QuestionReviewCard 
                key={idx}
                index={idx}
                section={section}
                onUpdate={(newSec) => handleUpdateSection(idx, newSec)}
                onDelete={() => handleDeleteSection(idx)}
              />
            ))}
          </div>

          <div className="mt-10 border-t border-gray-200 pt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-bold rounded-xl shadow-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all transform hover:-translate-y-1"
            >
              {isSaving ? 'Injecting into Database...' : '✅ Approve & Inject into Database'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
