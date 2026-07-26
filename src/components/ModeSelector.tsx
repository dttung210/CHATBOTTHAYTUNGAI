import React from "react";
import { SupportMode } from "../types";
import { Lightbulb, Footprints, CheckCircle2, Compass } from "lucide-react";

interface ModeSelectorProps {
  currentMode: SupportMode;
  onSelectMode: (mode: SupportMode) => void;
  disabled?: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onSelectMode,
  disabled = false
}) => {
  const modes: { id: SupportMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: "HINT",
      label: "Gợi ý",
      icon: <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5" />,
      desc: "3 - 5 gợi ý dẫn dắt tư duy"
    },
    {
      id: "STEP",
      label: "Gợi ý từng bước",
      icon: <Footprints className="w-4 h-4 sm:w-5 sm:h-5" />,
      desc: "Giải từng bước, kiểm tra kết quả"
    },
    {
      id: "FULL",
      label: "Giải hoàn chỉnh",
      icon: <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />,
      desc: "Lời giải đầy đủ chuẩn bài thi"
    },
    {
      id: "GEOGEBRA",
      label: "Vẽ hình GeoGebra",
      icon: <Compass className="w-4 h-4 sm:w-5 sm:h-5" />,
      desc: "Dựng hình trực tiếp với GeoGebra Classic 6"
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto my-3 px-3">
      <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-teal-100 shadow-sm flex items-center justify-between gap-1.5 sm:gap-2">
        {modes.map((m) => {
          const isActive = currentMode === m.id;
          return (
            <button
              key={m.id}
              disabled={disabled}
              onClick={() => onSelectMode(m.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 sm:px-4 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 ${
                isActive
                  ? "bg-[#0F9D8A] text-white shadow-md shadow-teal-900/10 scale-[1.01]"
                  : "text-[#52736C] hover:bg-teal-50 hover:text-[#0F9D8A]"
              } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span className={isActive ? "text-amber-300" : "text-teal-600"}>{m.icon}</span>
              <span className="truncate">{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
