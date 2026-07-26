import React from "react";
import { SimilarExerciseData } from "../types";
import { MathRenderer } from "./MathRenderer";
import { Sparkles, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

interface SimilarExerciseCardProps {
  exercise: SimilarExerciseData;
  onRevealAnswer: (exerciseId: string) => void;
  onHideAnswer: (exerciseId: string) => void;
}

export const SimilarExerciseCard: React.FC<SimilarExerciseCardProps> = ({
  exercise,
  onRevealAnswer,
  onHideAnswer,
}) => {
  return (
    <div className="bg-white border-2 border-[#C7EEE7] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 my-2">
      {/* Header Badge */}
      <div className="flex items-center justify-between border-b border-teal-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#ECFEF9] border border-teal-200 text-[#0F9D8A] rounded-xl">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-[#0F766E] uppercase tracking-wide">
            Bài tập tương tự
          </span>
        </div>
        <span className="text-[11px] bg-teal-50 text-[#0F766E] font-semibold px-2.5 py-0.5 rounded-full border border-teal-200">
          Tự luyện tập
        </span>
      </div>

      {/* Problem Statement Only */}
      <div className="text-sm sm:text-base text-[#17332D] leading-relaxed font-medium bg-[#ECFEF9]/60 p-3.5 rounded-xl border border-teal-100/80">
        <MathRenderer content={exercise.statementLatex || exercise.statementText} />
      </div>

      {/* Error state */}
      {exercise.error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{exercise.error}</span>
        </div>
      )}

      {/* Revealed Answer Box */}
      {exercise.answerRevealed && exercise.answerText && (
        <div className="p-3.5 bg-[#ECFEF9] border-2 border-teal-300 rounded-xl space-y-1 text-sm text-[#17332D]">
          <div className="font-bold text-[#0F766E] text-xs uppercase tracking-wider flex items-center gap-1.5">
            <span>✨ Đáp số:</span>
          </div>
          <div className="font-bold text-[#17332D] text-base pt-0.5">
            <MathRenderer content={exercise.answerLatex || exercise.answerText} />
          </div>
        </div>
      )}

      {/* Answer Button */}
      <div className="flex items-center justify-end pt-1">
        {exercise.answerRevealed ? (
          <button
            onClick={() => onHideAnswer(exercise.exerciseId)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-50 hover:bg-teal-100/80 text-[#0F766E] font-bold text-xs sm:text-sm rounded-xl border border-teal-200 transition cursor-pointer"
          >
            <EyeOff className="w-4 h-4" />
            <span>Ẩn đáp số</span>
          </button>
        ) : (
          <button
            onClick={() => onRevealAnswer(exercise.exerciseId)}
            disabled={exercise.isLoadingAnswer}
            className="flex items-center gap-2 px-4 py-2 bg-[#0F9D8A] hover:bg-[#0F766E] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
            aria-label="Xem đáp số bài tập tương tự"
          >
            {exercise.isLoadingAnswer ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang tải đáp số...</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                <span>Đáp số</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
