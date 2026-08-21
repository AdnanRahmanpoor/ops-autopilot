"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Upload,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Download,
  Clock,
  BarChart3,
  Moon,
  Sun,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const [step, setStep] = useState<"upload" | "profile" | "approve" | "report">(
    "upload"
  );
  const [file, setFile] = useState<File | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [darkMode, setDarkMode] = useState(false);

  // Load saved theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    setDarkMode(savedTheme === "dark");
  }, []);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        `${API_URL}/api/upload-and-profile`,
        formData
      );

      setStats(res.data.stats);
      setStep("profile");
    } catch (err) {
      alert("Upload failed");
    }

    setLoading(false);
  };

  const handleAIAnalysis = async () => {
    setLoading(true);

    try {
      const res = await axios.post(
        `${API_URL}/api/generate-recommendations`
      );

      setRecommendations(res.data.recommendations || []);
      setSelectedIds(
        res.data.recommendations?.map((r: any) => r.ticket_id) || []
      );
      setStep("approve");
    } catch (err) {
      alert("AI Analysis failed");
    }

    setLoading(false);
  };

  const handleExecute = async () => {
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/execute-automation`, { approved_ids: selectedIds });

      setMetrics(res.data.metrics);
      setStep("report");
    } catch (err) {
      alert("Execution failed");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-gray-100">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <header className="mb-8 relative text-center">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="
              absolute right-0 top-0
              inline-flex items-center gap-2
              rounded-lg border px-3 py-2 text-sm font-medium
              transition-colors
              border-gray-200 bg-white text-gray-700 hover:bg-gray-100
              dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200
              dark:hover:bg-gray-800
            "
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <>
                <Sun className="h-4 w-4" />
                Light
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" />
                Dark
              </>
            )}
          </button>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Ops Autopilot
          </h1>

          <p className="mt-2 text-gray-500 dark:text-gray-400">
            AI-assisted workflow automation for repetitive operations.
          </p>
        </header>

        {/* STEP 1: UPLOAD */}
        {step === "upload" && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900">
            <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Upload Operations CSV</h2>
            
            {/* NEW: Mock Data Download Link */}
            <p className="text-sm text-gray-500 mb-6">
              Don't have a dataset?{" "}
              <a 
                href="/mock_ops_data.csv" 
                download 
                className="text-blue-600 hover:text-blue-800 font-semibold underline"
              >
                Download our Mock Messy CSV
              </a>
            </p>

            <div className="flex flex-col items-center">
              <input 
                type="file" 
                accept=".csv" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mb-6 block w-full max-w-sm text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <button 
                onClick={handleUpload} 
                disabled={!file || loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors w-full max-w-sm"
              >
                {loading ? "Profiling..." : "Upload & Profile Data"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PROFILING */}
        {step === "profile" && stats && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-6 flex items-center text-2xl font-bold text-gray-900 dark:text-white">
              <BarChart3 className="mr-2" />
              Deterministic Profiling Complete
            </h2>

            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Records
                </p>

                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.total_tickets}
                </p>
              </div>

              <div className="rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/40">
                <p className="flex items-center text-sm text-red-600 dark:text-red-400">
                  <AlertTriangle className="mr-1 h-4 w-4" />
                  Stale Tickets (72h+)
                </p>

                <p className="text-3xl font-bold text-red-700 dark:text-red-400">
                  {stats.overdue_count}
                </p>
              </div>

              <div className="rounded-lg border border-yellow-100 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-950/40">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Missing Priorities
                </p>

                <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">
                  {stats.missing_priority_count}
                </p>
              </div>
            </div>

            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Found{" "}
              <b>
                {stats.overdue_count + stats.missing_priority_count}
              </b>{" "}
              messy records requiring attention. Use DeepSeek AI to classify,
              assign, and draft responses for these anomalies?
            </p>

            <button
              onClick={handleAIAnalysis}
              disabled={loading}
              className="
                flex items-center rounded-lg
                bg-purple-600 px-6 py-3 text-white
                hover:bg-purple-700
                disabled:cursor-not-allowed disabled:opacity-50
                dark:bg-purple-500 dark:hover:bg-purple-600
              "
            >
              <Sparkles className="mr-2 h-5 w-5" />
              {loading ? "DeepSeek is thinking..." : "Run AI Analysis"}
            </button>
          </div>
        )}

        {/* STEP 3: HUMAN IN THE LOOP */}
        {step === "approve" && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              Review AI Recommendations
            </h2>

            <p className="mb-6 text-gray-500 dark:text-gray-400">
              AI has drafted actions. Approve them to execute the automation.
            </p>

            <div className="mb-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Ticket
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Issue
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      AI Priority
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Assigned To
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                  {recommendations.map((rec) => (
                    <tr
                      key={rec.ticket_id}
                      className={
                        selectedIds.includes(rec.ticket_id)
                          ? "bg-green-50 dark:bg-green-950/30"
                          : ""
                      }
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {rec.ticket_id}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {rec.category}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5
                            ${
                              rec.priority === "High"
                                ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                                : rec.priority === "Medium"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
                                : "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                            }`}
                        >
                          {rec.priority}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {rec.assigned_to}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(rec.ticket_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds([
                                ...selectedIds,
                                rec.ticket_id,
                              ]);
                            } else {
                              setSelectedIds(
                                selectedIds.filter(
                                  (id) => id !== rec.ticket_id
                                )
                              );
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={handleExecute}
              disabled={selectedIds.length === 0 || loading}
              className="
                flex items-center rounded-lg
                bg-green-600 px-6 py-3 text-white
                hover:bg-green-700
                disabled:cursor-not-allowed disabled:opacity-50
                dark:bg-green-500 dark:hover:bg-green-600
              "
            >
              <CheckCircle2 className="mr-2 h-5 w-5" />
              {loading
                ? "Executing..."
                : `Approve & Execute (${selectedIds.length} Tasks)`}
            </button>
          </div>
        )}

        {/* STEP 4: REPORT */}
        {step === "report" && metrics && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>

            <h2 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
              Automation Complete
            </h2>

            <p className="mb-8 text-gray-500 dark:text-gray-400">
              Process optimized and executed.
            </p>

            <div className="mb-8 grid grid-cols-1 gap-4 text-left md:grid-cols-3">
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-6 dark:border-blue-900/50 dark:bg-blue-950/40">
                <p className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Tasks Automated
                </p>

                <p className="mt-2 text-4xl font-bold text-blue-700 dark:text-blue-400">
                  {metrics.tasks_automated}
                </p>
              </div>

              <div className="rounded-lg border border-purple-100 bg-purple-50 p-6 dark:border-purple-900/50 dark:bg-purple-950/40">
                <p className="flex items-center text-sm text-purple-600 dark:text-purple-400">
                  <Clock className="mr-1 h-4 w-4" />
                  Manual Work Eliminated
                </p>

                <p className="mt-2 text-4xl font-bold text-purple-700 dark:text-purple-400">
                  {metrics.hours_saved} hrs
                </p>
              </div>

              <div className="rounded-lg border border-orange-100 bg-orange-50 p-6 dark:border-orange-900/50 dark:bg-orange-950/40">
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  Steps Removed
                </p>

                <p className="mt-2 text-4xl font-bold text-orange-700 dark:text-orange-400">
                  {metrics.manual_steps_removed}
                </p>
              </div>
            </div>

            <a 
              href={`${API_URL}/api/download-csv`} 
              download="automated_ops_report.csv"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="mr-2 w-5 h-5" /> Download Updated CSV
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
