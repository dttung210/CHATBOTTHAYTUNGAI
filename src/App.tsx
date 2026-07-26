import React, { useState, useEffect } from "react";
import { Student, SupportMode, ChatMessage, HistoryRecord } from "./types";
import { Header } from "./components/Header";
import { ModeSelector } from "./components/ModeSelector";
import { ChatArea } from "./components/ChatArea";
import { InputToolbar } from "./components/InputToolbar";
import { GeoGebraWorkspace } from "./components/GeoGebraWorkspace";
import { LoginModal } from "./components/LoginModal";
import { HistoryDrawer } from "./components/HistoryDrawer";
import { GasExportModal } from "./components/GasExportModal";
import { CODE_GS_FULL, INDEX_HTML_FULL } from "./gasCode";

const DEFAULT_GAS_URL = "https://script.google.com/macros/s/AKfycbzMauX8KA8eIYgBIuHKmA6xJ3PB6NK2zrPPnYetEhJibBIKEhEALmSmK0Tj-Zd-u34uqg/exec";

export default function App() {
  const [student, setStudent] = useState<Student | null>(null);
  const [currentMode, setCurrentMode] = useState<SupportMode>("HINT");
  const [selectedModel, setSelectedModel] = useState<string>("3.5 Flash");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyList, setHistoryList] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isGasExportOpen, setIsGasExportOpen] = useState(false);

  // Confirmation Modal (bypasses iframe block on window.confirm)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  // Auto restore active student session
  useEffect(() => {
    const saved = localStorage.getItem("thay_tung_student") || sessionStorage.getItem("thay_tung_student");
    if (saved) {
      try {
        setStudent(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Fetch per-student chat history whenever student changes
  useEffect(() => {
    if (!student) return;
    const localKey = "thay_tung_history_" + student.username;
    const savedLocal = localStorage.getItem(localKey);
    if (savedLocal) {
      try {
        setHistoryList(JSON.parse(savedLocal));
      } catch (e) {
        console.error(e);
      }
    }

    // Sync with Google Apps Script WebApp & local backend API
    let gasUrl = localStorage.getItem("thay_tung_gas_url");
    if (!gasUrl || gasUrl.includes("AKfycbz2Iju6-Plon1357LALMO2JfEP0M3IbvvpM8hAHVT91OQZAnspgBcIStqqjERxVVhW04Q")) {
      gasUrl = DEFAULT_GAS_URL;
      localStorage.setItem("thay_tung_gas_url", DEFAULT_GAS_URL);
    }
    if (gasUrl) {
      fetch(`${gasUrl}?action=GET_HISTORY&username=${encodeURIComponent(student.username)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success && Array.isArray(data.history) && data.history.length > 0) {
            setHistoryList(data.history);
            localStorage.setItem(localKey, JSON.stringify(data.history));
          }
        })
        .catch(() => {});
    }

    fetch(`/api/history?username=${encodeURIComponent(student.username)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.history) && data.history.length > 0) {
          setHistoryList((prev) => (prev.length === 0 ? data.history : prev));
          localStorage.setItem(localKey, JSON.stringify(data.history));
        }
      })
      .catch((err) => console.error("Error fetching history:", err));
  }, [student]);

  const handleLoginSuccess = (st: Student) => {
    setStudent(st);
    localStorage.setItem("thay_tung_student", JSON.stringify(st));
    sessionStorage.setItem("thay_tung_student", JSON.stringify(st));
  };

  const handleLogout = () => {
    setStudent(null);
    setMessages([]);
    localStorage.removeItem("thay_tung_student");
    sessionStorage.removeItem("thay_tung_student");
  };

  // Reset Session Memory Handler
  const handleResetSession = async () => {
    if (messages.length > 0) {
      setConfirmModal({
        isOpen: true,
        title: "Làm mới phiên học",
        message: "Kết thúc phiên học hiện tại và bắt đầu phiên mới?\n\nThầy Tùng AI sẽ lưu tóm tắt phiên cũ vào lịch sử học tập và bắt đầu một trí nhớ phiên hoàn toàn mới cho em.",
        onConfirm: async () => {
          if (student) {
            try {
              await fetch("/api/session/end", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: student.username })
              });
            } catch (e) {
              console.error("Error ending session:", e);
            }
          }
          setMessages([]);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      });
    } else {
      if (student) {
        try {
          await fetch("/api/session/end", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: student.username })
          });
        } catch (e) {
          console.error("Error ending session:", e);
        }
      }
      setMessages([]);
    }
  };

  // Generate Similar Exercise (Mô-đun 1 - Isolated Answer Card)
  const handleGenerateSimilar = async () => {
    let originalProblem = "";
    let originalSolutionSummary = "";

    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];

      if (m.sender === "thay_tung") {
        if (!originalProblem && m.confirmedProblemText && m.confirmedProblemText.trim()) {
          originalProblem = m.confirmedProblemText.trim();
        }
        if (!originalSolutionSummary) {
          if (m.solutionBlocks && m.solutionBlocks.length > 0) {
            originalSolutionSummary = m.solutionBlocks.map((b) => b.content).join("\n");
          } else if (m.step?.allSteps) {
            originalSolutionSummary = m.step.allSteps.map((s) => `${s.title}: ${s.stepSolution}`).join("\n");
          }
        }
      }

      if (m.sender === "student" && !originalProblem) {
        if (
          m.text &&
          m.text.trim() &&
          !m.text.includes("Tạo bài tập tương tự") &&
          !m.text.includes("Em chưa hiểu") &&
          !m.text.includes("[Ảnh đính kèm]")
        ) {
          originalProblem = m.text.trim();
        }
      }

      if (originalProblem && originalSolutionSummary) break;
    }

    if (!originalProblem && messages.length > 0) {
      for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i];
        if (m.confirmedProblemText) {
          originalProblem = m.confirmedProblemText;
          break;
        }
        if (m.text && !m.text.includes("[Ảnh đính kèm]")) {
          originalProblem = m.text;
          break;
        }
      }
    }

    if (!originalProblem) {
      originalProblem = "Bài toán đại số / hình học vừa học";
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/similar-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: student?.username,
          originalProblem,
          originalSolution: originalSolutionSummary,
          studentGrade: student?.lopDuocPhep || 8,
          knowledgeLevel: student?.mucDoMacDinh || "BASIC",
          modelName: selectedModel
        })
      });

      const resData = await res.json();
      if (resData.success && resData.data) {
        const simData = resData.data;
        const msgId = "msg_sim_" + Date.now();

        const newMsg: ChatMessage = {
          id: msgId,
          sender: "thay_tung",
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          mode: currentMode,
          responseTitle: "Bài tập tương tự (Tự luyện tập)",
          similarExercise: {
            exerciseId: simData.exerciseId,
            parentProblemId: simData.parentProblemId,
            statementText: simData.statementText,
            statementLatex: simData.statementLatex,
            answerRevealed: false
          }
        };

        setMessages((prev) => [...prev, newMsg]);
      }
    } catch (err) {
      console.error("Error creating similar exercise:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Answer Isolation Handler: Fetch Answer Lazily
  const handleRevealAnswer = async (exerciseId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.similarExercise && m.similarExercise.exerciseId === exerciseId) {
          return {
            ...m,
            similarExercise: {
              ...m.similarExercise,
              isLoadingAnswer: true,
              error: undefined
            }
          };
        }
        return m;
      })
    );

    try {
      const res = await fetch("/api/get-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId, username: student?.username })
      });
      const data = await res.json();

      if (data.success && data.data) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.similarExercise && m.similarExercise.exerciseId === exerciseId) {
              return {
                ...m,
                similarExercise: {
                  ...m.similarExercise,
                  isLoadingAnswer: false,
                  answerRevealed: true,
                  answerText: data.data.answerText,
                  answerLatex: data.data.answerLatex,
                  answerType: data.data.answerType
                }
              };
            }
            return m;
          })
        );
      } else {
        throw new Error(data.message || "Không thể lấy đáp số");
      }
    } catch (e: any) {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.similarExercise && m.similarExercise.exerciseId === exerciseId) {
            return {
              ...m,
              similarExercise: {
                ...m.similarExercise,
                isLoadingAnswer: false,
                error: e.message || "Lỗi khi tải đáp số."
              }
            };
          }
          return m;
        })
      );
    }
  };

  const handleHideAnswer = (exerciseId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.similarExercise && m.similarExercise.exerciseId === exerciseId) {
          return {
            ...m,
            similarExercise: {
              ...m.similarExercise,
              answerRevealed: false
            }
          };
        }
        return m;
      })
    );
  };

  // Main Solver Call
  const handleSendMessage = async (text: string, imageBase64?: string, mimeType?: string) => {
    if (!student) return;

    const userMsgId = "msg_stu_" + Date.now();
    const newStudentMsg: ChatMessage = {
      id: userMsgId,
      sender: "student",
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      text: text,
      imageUrl: imageBase64,
      mode: currentMode
    };

    setMessages((prev) => [...prev, newStudentMsg]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/solve-math", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemText: text,
          imageData: imageBase64,
          imageMimeType: mimeType,
          mode: currentMode,
          knowledgeLevel: student.mucDoMacDinh,
          studentGrade: student.lopDuocPhep,
          modelName: selectedModel
        })
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        const aiData = resData.data;
        const aiMsgId = "msg_ai_" + Date.now();

        const newAiMsg: ChatMessage = {
          id: aiMsgId,
          sender: "thay_tung",
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          mode: currentMode,
          confirmedProblemText:
            aiData.problem?.latex ||
            aiData.problem?.normalizedText ||
            aiData.problem?.originalText ||
            aiData.problem?.text ||
            aiData.confirmedProblemText ||
            (text && !text.includes("[Ảnh đính kèm]") ? text : ""),
          responseTitle: aiData.response?.title || "Hướng dẫn giải Toán",
          hints: aiData.response?.hints,
          step: aiData.response?.step,
          solutionBlocks: aiData.response?.solutionBlocks,
          geometry: aiData.geometry,
          curriculumGuard: aiData.curriculumGuard
        };

        setMessages((prev) => [...prev, newAiMsg]);

        // Append to per-student history list and sync
        const newHistRecord: HistoryRecord = {
          historyId: "hist_" + Date.now(),
          timestamp: new Date().toLocaleString("vi-VN"),
          username: student.username,
          lopHoc: student.lopDuocPhep,
          cheDo: currentMode,
          cauHoiGoc: text || "Đề bài bằng hình ảnh",
          deBaiLatex:
            aiData.problem?.latex ||
            aiData.problem?.normalizedText ||
            aiData.problem?.originalText ||
            (text && !text.includes("[Ảnh đính kèm]") ? text : "Đề bài bằng hình ảnh"),
          resultStatus: "SUCCESS"
        };

        setHistoryList((prev) => {
          const updated = [newHistRecord, ...prev];
          localStorage.setItem("thay_tung_history_" + student.username, JSON.stringify(updated));
          return updated;
        });

        // Sync to local server API
        fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: student.username, record: newHistRecord })
        }).catch(console.error);

        // Direct Google Apps Script Sheet Sync (GAS environment or custom WebApp URL)
        if (typeof (window as any).google !== "undefined" && (window as any).google?.script?.run) {
          (window as any).google.script.run.saveChatHistory(newHistRecord);
        } else {
          const gasUrl = localStorage.getItem("thay_tung_gas_url") || DEFAULT_GAS_URL;
          if (gasUrl) {
            fetch(gasUrl, {
              method: "POST",
              mode: "no-cors",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "SAVE_HISTORY", record: newHistRecord })
            }).catch(console.error);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Step Answer Validation
  const handleValidateStep = async (stepId: string, answer: string) => {
    try {
      const res = await fetch("/api/validate-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepId,
          studentAnswer: answer,
          acceptedForms: ["1", "a=1", "1, -4"]
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.step && m.step.stepId === stepId) {
              return {
                ...m,
                step: {
                  ...m.step,
                  feedback: data.data.feedback,
                  status: data.data.status
                }
              };
            }
            return m;
          })
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRating = (msgId: string, rating: "HELPFUL" | "UNHELPFUL") => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, helpfulRating: rating } : m))
    );
  };

  const handleNotUnderstood = (msgId: string) => {
    handleSendMessage("Em chưa hiểu rõ đoạn biến đổi vừa rồi, Thầy giải thích kĩ hơn bước đó giúp em với ạ!");
  };

  return (
    <div className="min-h-screen bg-[#F4FBF9] flex flex-col font-sans">
      {/* Login Modal overlay if no active student session */}
      {!student && <LoginModal onLoginSuccess={handleLoginSuccess} />}

      {/* Main Header */}
      <Header
        student={student}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenGasExport={() => setIsGasExportOpen(true)}
        onNewChat={handleResetSession}
        onLogout={handleLogout}
      />

      {/* Mode Navigation Bar */}
      <ModeSelector
        currentMode={currentMode}
        onSelectMode={(mode) => {
          if (messages.length > 0) {
            setConfirmModal({
              isOpen: true,
              title: "Xác nhận đổi chế độ",
              message: "Đổi chế độ sẽ cập nhật cách Thầy Tùng AI hỗ trợ cho câu hỏi tiếp theo. Em có muốn đổi không?",
              onConfirm: () => {
                setCurrentMode(mode);
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
              }
            });
          } else {
            setCurrentMode(mode);
          }
        }}
        disabled={isLoading}
      />

      {/* Main Workspace: GeoGebra Mode vs Chat Area */}
      {currentMode === "GEOGEBRA" ? (
        <main className="flex-1 flex flex-col w-full mx-auto pb-12">
          <GeoGebraWorkspace
            student={student!}
            selectedModel={selectedModel}
            latestProblemText={messages.slice().reverse().find((m) => m.sender === "student" && m.text)?.text}
            onAttachToChat={(summaryText) => {
              setCurrentMode("FULL");
              handleSendMessage(summaryText);
            }}
          />
        </main>
      ) : (
        <>
          {/* Main Chat Workspace */}
          <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto">
            <ChatArea
              messages={messages}
              onValidateStep={handleValidateStep}
              onGenerateSimilar={handleGenerateSimilar}
              onRevealAnswer={handleRevealAnswer}
              onHideAnswer={handleHideAnswer}
              onRating={handleRating}
              onNotUnderstood={handleNotUnderstood}
              isLoading={isLoading}
            />
          </main>

          {/* Fixed Bottom Input Bar */}
          <InputToolbar
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            selectedModel={selectedModel}
          />
        </>
      )}

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        historyList={historyList}
        onSelectHistoryItem={(item) => {
          handleSendMessage(item.cauHoiGoc);
        }}
      />

      {/* Google Apps Script 1-Click Code Export Modal */}
      <GasExportModal
        isOpen={isGasExportOpen}
        onClose={() => setIsGasExportOpen(false)}
        codeGsContent={CODE_GS_FULL}
        indexHtmlContent={INDEX_HTML_FULL}
      />

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-[#0f2421]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-teal-100 overflow-hidden transform transition-all duration-300 scale-100 animate-in fade-in zoom-in-95">
            <div className="p-6">
              <h3 className="text-lg font-bold text-teal-900 mb-2">
                {confirmModal.title}
              </h3>
              <p className="text-sm text-teal-700 leading-relaxed whitespace-pre-line">
                {confirmModal.message}
              </p>
            </div>
            <div className="bg-teal-50/50 px-6 py-4 flex items-center justify-end gap-3 border-t border-teal-100">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-100/50 rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-5 py-2 text-sm font-bold text-white bg-[#0F9D8A] hover:bg-[#0d8b7a] rounded-xl shadow-md transition"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
