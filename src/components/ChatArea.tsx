import React, { useState } from "react";
import { ChatMessage, StepData, SupportMode } from "../types";
import { MathRenderer } from "./MathRenderer";
import { SimilarExerciseCard } from "./SimilarExerciseCard";
import {
  Sparkles,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Footprints,
  Download,
  Maximize2,
  Minimize2,
  ArrowRight,
  ChevronDown,
  AlertTriangle
} from "lucide-react";

interface ChatAreaProps {
  messages: ChatMessage[];
  onValidateStep: (stepId: string, answer: string) => void;
  onGenerateSimilar: () => void;
  onRevealAnswer: (exerciseId: string) => void;
  onHideAnswer: (exerciseId: string) => void;
  onRating: (msgId: string, rating: "HELPFUL" | "UNHELPFUL") => void;
  onNotUnderstood: (msgId: string) => void;
  isLoading: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  onValidateStep,
  onGenerateSimilar,
  onRevealAnswer,
  onHideAnswer,
  onRating,
  onNotUnderstood,
  isLoading
}) => {
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [studentStepAnswer, setStudentStepAnswer] = useState("");
  const [expandedHints, setExpandedHints] = useState<Record<string, number>>({});
  const [activeTikzMsgMap, setActiveTikzMsgMap] = useState<Record<string, boolean>>({});
  const [visibleStepMap, setVisibleStepMap] = useState<Record<string, number>>({});

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const toggleTikzDiagram = (msgId: string) => {
    setActiveTikzMsgMap((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const toggleNextHint = (msgId: string, totalHints: number) => {
    setExpandedHints((prev) => {
      const current = prev[msgId] || 1;
      return { ...prev, [msgId]: Math.min(current + 1, totalHints) };
    });
  };

  const advanceStep = (msgId: string, totalSteps: number) => {
    setVisibleStepMap((prev) => {
      const current = prev[msgId] || 1;
      return { ...prev, [msgId]: Math.min(current + 1, totalSteps) };
    });
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-6 max-w-4xl mx-auto pb-32">
      {messages.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <div className="w-16 h-16 bg-[#ECFEF9] border border-teal-200 text-[#0F9D8A] rounded-3xl flex items-center justify-center mx-auto shadow-sm">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#17332D]">
              Chào em! Thầy Tùng AI đã sẵn sàng hỗ trợ.
            </h2>
            <p className="text-sm text-[#52736C] max-w-md mx-auto">
              Hãy gõ bài tập Toán, chụp ảnh hoặc dán ảnh vào khung bên dưới để Thầy đồng hành cùng em nhé!
            </p>
          </div>

          {/* Sample Prompts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto text-xs pt-4">
            <div className="p-3 bg-white hover:bg-teal-50/60 rounded-2xl border border-teal-100 text-left cursor-pointer transition">
              <span className="font-bold text-[#0F766E] block mb-0.5">Phương trình bậc hai</span>
              <span className="text-[#52736C]">"Giải phương trình $x^2 + 3x - 4 = 0$"</span>
            </div>
            <div className="p-3 bg-white hover:bg-teal-50/60 rounded-2xl border border-teal-100 text-left cursor-pointer transition">
              <span className="font-bold text-[#0F766E] block mb-0.5">Hình học phẳng</span>
              <span className="text-[#52736C]">"Cho tam giác ABC vuông tại A, chứng minh..."</span>
            </div>
          </div>
        </div>
      ) : (
        messages.map((msg) => (
          <div key={msg.id} className="space-y-3">
            {/* Student Message */}
            {msg.sender === "student" && (
              <div className="flex justify-end">
                <div className="bg-[#ECFEF9] border border-teal-200/90 text-[#17332D] max-w-[85%] sm:max-w-[75%] rounded-3xl rounded-tr-sm p-4 shadow-sm space-y-2">
                  {msg.imageUrl && (
                    <img
                      src={msg.imageUrl}
                      alt="Đề bài đã tải lên"
                      className="max-h-52 w-auto rounded-2xl border border-teal-200 object-contain"
                    />
                  )}
                  {msg.text && <MathRenderer content={msg.text} className="text-sm sm:text-base font-medium" />}
                  <div className="text-[10px] text-teal-700/60 text-right font-mono">
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            )}

            {/* Thầy Tùng AI Message Card */}
            {msg.sender === "thay_tung" && (
              <div className="flex justify-start">
                <div className="bg-white border-2 border-teal-100 text-[#17332D] w-full max-w-3xl rounded-3xl rounded-tl-sm p-4 sm:p-6 shadow-sm space-y-4">
                  {/* Card Title & Curriculum Guard Banner */}
                  <div className="flex items-center justify-between border-b border-teal-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#0F9D8A] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        T
                      </div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-[#17332D] flex items-center gap-2">
                          <MathRenderer content={msg.responseTitle || "Thầy Tùng AI Phản Hồi"} as="span" />
                        </h3>
                        <p className="text-xs text-[#52736C]">
                          Chế độ:{" "}
                          <span className="font-semibold text-[#0F766E]">
                            {msg.mode === "HINT"
                              ? "Gợi ý tư duy"
                              : msg.mode === "STEP"
                              ? "Gợi ý từng bước"
                              : "Lời giải hoàn chỉnh chuẩn thi"}
                          </span>
                        </p>
                      </div>
                    </div>

                    {msg.curriculumGuard?.methodUsed && (
                      <span className="bg-teal-50 border border-teal-200 text-[#0F766E] text-[11px] font-semibold px-2.5 py-1 rounded-full">
                        ✓ {msg.curriculumGuard.methodUsed}
                      </span>
                    )}
                  </div>

                  {/* SIMILAR EXERCISE CARD DISPLAY */}
                  {msg.similarExercise && (
                    <SimilarExerciseCard
                      exercise={msg.similarExercise}
                      onRevealAnswer={onRevealAnswer}
                      onHideAnswer={onHideAnswer}
                    />
                  )}

                  {/* MODE = HINT: 3-5 Hints expandable 1 by 1 */}
                  {msg.mode === "HINT" && msg.hints && (
                    <div className="space-y-3">
                      <p className="text-xs sm:text-sm text-[#52736C]">
                        Thầy đưa ra các gợi ý dẫn dắt giúp em tự tư duy mà chưa làm thay nhé:
                      </p>
                      {msg.hints
                        .slice(0, expandedHints[msg.id] || 1)
                        .map((hint, idx) => (
                          <div
                            key={idx}
                            className="bg-[#ECFEF9] border border-teal-200 p-3.5 rounded-2xl space-y-1.5 transition-all duration-300"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-[#0F766E] uppercase tracking-wide">
                                Gợi ý {hint.number}: <MathRenderer content={hint.title} as="span" />
                              </span>
                            </div>
                            <div className="text-xs sm:text-sm font-medium text-[#17332D]">
                              <MathRenderer content={hint.goal} />
                            </div>
                            <div className="text-xs text-amber-900 bg-amber-50/80 p-2 rounded-xl border border-amber-200/80 font-medium">
                              <strong>Câu hỏi suy nghĩ:</strong> <MathRenderer content={hint.question} />
                            </div>
                            {hint.knowledgeReminder && (
                              <div className="text-[11px] text-teal-800 italic">
                                💡 Nhắc kiến thức: <MathRenderer content={hint.knowledgeReminder} />
                              </div>
                            )}
                          </div>
                        ))}

                      {(expandedHints[msg.id] || 1) < msg.hints.length && (
                        <button
                          onClick={() => toggleNextHint(msg.id, msg.hints!.length)}
                          className="w-full py-2.5 bg-teal-50 hover:bg-teal-100/80 text-[#0F9D8A] font-bold text-xs rounded-xl border border-teal-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <ChevronDown className="w-4 h-4" />
                          <span>Mở gợi ý tiếp theo ({ (expandedHints[msg.id] || 1) + 1 } / {msg.hints.length})</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* MODE = STEP: Interactive Multi-Step Machine */}
                  {msg.mode === "STEP" && msg.step && (
                    <div className="space-y-3">
                      {msg.step.allSteps && msg.step.allSteps.length > 0 ? (
                        <>
                          {msg.step.allSteps
                            .slice(0, visibleStepMap[msg.id] || 1)
                            .map((stepItem, sIdx) => (
                              <div
                                key={sIdx}
                                className="bg-[#ECFEF9] border-2 border-teal-200 p-4 rounded-2xl space-y-3 transition-all duration-300 shadow-sm"
                              >
                                <div className="flex items-center justify-between border-b border-teal-200/60 pb-2">
                                  <span className="font-bold text-xs sm:text-sm text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5">
                                    <Footprints className="w-4 h-4 text-amber-500" />
                                    <MathRenderer content={stepItem.title} as="span" />
                                  </span>
                                  <span className="text-xs font-bold text-teal-800 bg-teal-200/80 px-2.5 py-0.5 rounded-full">
                                    Bước {stepItem.stepNumber} / {msg.step?.allSteps?.length}
                                  </span>
                                </div>

                                {/* Learning Goal */}
                                <div className="text-xs sm:text-sm text-[#17332D] font-medium bg-teal-50/70 p-2.5 rounded-xl border border-teal-100">
                                  🎯 <strong>Mục tiêu:</strong> <MathRenderer content={stepItem.learningGoal} />
                                </div>

                                {/* Detailed Step Solution */}
                                {stepItem.stepSolution && (
                                  <div className="bg-white p-3.5 rounded-xl border border-teal-200 text-xs sm:text-sm text-[#17332D] leading-relaxed space-y-1">
                                    <div className="font-bold text-teal-800 flex items-center gap-1.5 text-xs">
                                      <span>📝 Lời giải & Hướng dẫn Bước {stepItem.stepNumber}:</span>
                                    </div>
                                    <MathRenderer content={stepItem.stepSolution} />
                                  </div>
                                )}

                                {/* Step Question / Exercise */}
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium space-y-1">
                                  <strong className="text-amber-800">❓ Bài tập / Yêu cầu vận dụng Bước {stepItem.stepNumber}:</strong>{" "}
                                  <MathRenderer content={stepItem.question} />
                                </div>
                              </div>
                            ))}

                          {/* Controls for current step */}
                          {(visibleStepMap[msg.id] || 1) < (msg.step.allSteps?.length || 1) ? (
                            <div className="bg-teal-50/90 p-3 rounded-2xl border border-teal-200">
                              <button
                                onClick={() => advanceStep(msg.id, msg.step!.allSteps!.length)}
                                className="w-full py-3 bg-[#0F9D8A] hover:bg-[#0F766E] active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <span>▶️ Xem lời giải & Tiến sang Bước {(visibleStepMap[msg.id] || 1) + 1}</span>
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="p-3 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2">
                              <span>🎉 Em đã hoàn thành toàn bộ các bước giải của bài toán!</span>
                            </div>
                          )}
                        </>
                      ) : (
                        /* Single step fallback */
                        <div className="bg-[#ECFEF9] border-2 border-teal-200 p-4 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5">
                              <Footprints className="w-4 h-4 text-amber-500" />
                              <MathRenderer content={msg.step.title} as="span" />
                            </span>
                            <span className="text-xs font-bold text-teal-800 bg-teal-200/70 px-2.5 py-0.5 rounded-full">
                              Bước {msg.step.stepNumber}
                            </span>
                          </div>

                          <div className="text-xs sm:text-sm text-[#17332D] space-y-1">
                            <p className="font-bold"><MathRenderer content={msg.step.learningGoal} /></p>
                            {msg.step.stepSolution && (
                              <div className="bg-white p-3 rounded-xl border border-teal-200 my-2">
                                <strong>📝 Lời giải & Hướng dẫn:</strong> <MathRenderer content={msg.step.stepSolution} />
                              </div>
                            )}
                            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium">
                              <strong>❓ Câu hỏi vận dụng:</strong> <MathRenderer content={msg.step.question} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* MODE = FULL: Strict Exam-Form Solution (Chuẩn form bài làm thi cử) */}
                  {msg.mode === "FULL" && (
                    <div className="space-y-3 bg-[#F8FDFA] p-4 sm:p-5 rounded-2xl border border-teal-200/80 shadow-sm">
                      <div className="flex items-center justify-between border-b border-teal-200/60 pb-2.5">
                        <h4 className="font-bold text-xs sm:text-sm text-[#0F766E] uppercase tracking-wide flex items-center gap-1.5">
                          <span>📝 BÀI GIẢI CHI TIẾT (CHUẨN FORM THI HỌC KỲ / THI VÀO 10)</span>
                        </h4>
                        <span className="text-[11px] bg-emerald-100 text-emerald-900 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                          Không lời dẫn thừa
                        </span>
                      </div>

                      {msg.solutionBlocks && msg.solutionBlocks.length > 0 ? (
                        <div className="space-y-2.5">
                          {msg.solutionBlocks.map((block, bIdx) => (
                            <div key={bIdx} className="text-xs sm:text-sm text-[#17332D] leading-relaxed">
                              {block.type === "CONCLUSION" ? (
                                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-300/80 rounded-xl font-bold text-[#0F766E]">
                                  <MathRenderer
                                    content={
                                      /^(Vậy|Kết luận)/i.test(block.content.trim())
                                        ? block.content
                                        : `Vậy: ${block.content}`
                                    }
                                  />
                                </div>
                              ) : (
                                <MathRenderer content={block.content} />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs sm:text-sm text-[#17332D]">
                          <MathRenderer content={msg.problemText || "Bài giải chưa có nội dung"} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Footer Buttons */}
                  <div className="pt-2 border-t border-teal-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => handleCopy(msg.id, JSON.stringify(msg.solutionBlocks || msg.hints))}
                        className="p-1.5 hover:bg-teal-50 text-teal-700 rounded-lg border border-teal-200/80 flex items-center gap-1 transition"
                        title="Sao chép lời giải"
                      >
                        {copiedMsgId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Sao chép</span>
                      </button>

                      <button
                        onClick={() => onNotUnderstood(msg.id)}
                        className="p-1.5 hover:bg-amber-50 text-amber-800 rounded-lg border border-amber-200/80 flex items-center gap-1 transition font-medium"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Em chưa hiểu chỗ này</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onRating(msg.id, "HELPFUL")}
                        className={`p-1.5 rounded-lg border transition ${
                          msg.helpfulRating === "HELPFUL"
                            ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                            : "hover:bg-teal-50 border-teal-200/80 text-teal-700"
                        }`}
                        title="Hữu ích"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onRating(msg.id, "UNHELPFUL")}
                        className={`p-1.5 rounded-lg border transition ${
                          msg.helpfulRating === "UNHELPFUL"
                            ? "bg-red-100 border-red-300 text-red-800"
                            : "hover:bg-teal-50 border-teal-200/80 text-teal-700"
                        }`}
                        title="Chưa hữu ích"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      )}

      {/* Completion Yellow Banner & Similar Exercise Trigger */}
      {messages.length > 0 && !isLoading && (
        <div className="bg-[#FFF4BF] border border-amber-300 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 my-4">
          <div className="flex items-center gap-2.5 text-[#17332D]">
            <Sparkles className="w-6 h-6 text-amber-600 shrink-0" />
            <span className="font-bold text-sm sm:text-base">
              Em đã hiểu bài! Sẵn sàng luyện tập chưa?
            </span>
          </div>
          <button
            onClick={onGenerateSimilar}
            className="w-full sm:w-auto bg-[#F59E0B] hover:bg-amber-600 text-amber-950 font-bold px-5 py-2.5 rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-2 text-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>Tạo bài tập tương tự</span>
          </button>
        </div>
      )}
    </div>
  );
};
