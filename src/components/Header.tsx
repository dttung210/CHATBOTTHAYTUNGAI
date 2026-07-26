import React from "react";
import { Student } from "../types";
import { BookOpen, History, Code2, LogOut, ChevronDown, Key, RotateCcw } from "lucide-react";

interface HeaderProps {
  student: Student | null;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  onOpenHistory: () => void;
  onOpenGasExport: () => void;
  onNewChat: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  student,
  selectedModel,
  onSelectModel,
  onOpenHistory,
  onOpenGasExport,
  onNewChat,
  onLogout
}) => {
  return (
    <header className="bg-[#0F9D8A] text-white shadow-md sticky top-0 z-30 px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 sm:gap-4">
        {/* Left Branding */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg sm:text-xl tracking-tight flex items-center gap-2">
                Trợ lý học tập Thầy Tùng AI
              </h1>
              <p className="text-xs text-teal-100 font-medium hidden sm:block">
                Hỏi đúng cách – Hiểu từng bước – Tự mình giải được
              </p>
            </div>
          </div>

          {/* Mobile indicator / status */}
          <div className="md:hidden flex items-center gap-1.5 bg-teal-800/60 px-2.5 py-1 rounded-full text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Trực tuyến</span>
          </div>
        </div>

        {/* Right Controls & Student Info */}
        <div className="flex flex-wrap items-center justify-end gap-2 w-full md:w-auto text-xs sm:text-sm">
          {/* API / Model Selector Dropdown */}
          <div className="relative group">
            <div className="flex items-center gap-1.5 bg-teal-800/50 hover:bg-teal-800/80 px-3 py-1.5 rounded-full border border-teal-600/40 cursor-pointer transition">
              <Key className="w-3.5 h-3.5 text-teal-200" />
              <span className="font-semibold text-teal-100">{selectedModel}</span>
              <ChevronDown className="w-3 h-3 text-teal-300" />
            </div>
            <div className="absolute right-0 mt-1 w-48 bg-white text-[#17332D] rounded-xl shadow-xl border border-teal-100 hidden group-hover:block z-50 p-1">
              <div
                onClick={() => onSelectModel("Gemma 4 (31B)")}
                className="px-3 py-1.5 hover:bg-teal-50 rounded-lg cursor-pointer font-medium text-xs flex items-center justify-between"
              >
                <span className="font-semibold text-emerald-700">Gemma 4 (31B) 👑</span>
                {selectedModel === "Gemma 4 (31B)" && <span className="text-teal-600 font-bold">✓</span>}
              </div>
              <div
                onClick={() => onSelectModel("3.5 Flash")}
                className="px-3 py-1.5 hover:bg-teal-50 rounded-lg cursor-pointer font-medium text-xs flex items-center justify-between"
              >
                <span>3.5 Flash</span>
                {selectedModel === "3.5 Flash" && <span className="text-teal-600 font-bold">✓</span>}
              </div>
              <div
                onClick={() => onSelectModel("3.1 Pro")}
                className="px-3 py-1.5 hover:bg-teal-50 rounded-lg cursor-pointer font-medium text-xs flex items-center justify-between"
              >
                <span>3.1 Pro</span>
                {selectedModel === "3.1 Pro" && <span className="text-teal-600 font-bold">✓</span>}
              </div>
            </div>
          </div>

          {/* Student Grade Badge */}
          {student && (
            <div className="flex items-center gap-1.5 bg-teal-800/70 px-3 py-1.5 rounded-full border border-teal-500/30">
              <span className="font-medium text-teal-100">{student.hoTen}</span>
              <span className="bg-teal-600 px-2 py-0.5 rounded-full text-[11px] font-bold text-white">
                Lớp {student.lopDuocPhep}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                  student.mucDoMacDinh === "ADVANCED"
                    ? "bg-amber-400 text-amber-950"
                    : "bg-teal-200 text-teal-900"
                }`}
              >
                {student.mucDoMacDinh === "ADVANCED" ? "Nâng cao" : "Cơ bản"}
              </span>
            </div>
          )}

          {/* Reset Continuous Session Memory Button */}
          <button
            onClick={onNewChat}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-full font-bold shadow-sm transition"
            title="Kết thúc trí nhớ phiên học hiện tại"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Làm mới phiên</span>
          </button>

          {/* Action Buttons */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 bg-teal-700/80 hover:bg-teal-600 px-3 py-1.5 rounded-full text-white font-medium border border-teal-500/40 transition"
            title="Lịch sử trò chuyện"
          >
            <History className="w-4 h-4 text-teal-200" />
            <span className="hidden sm:inline">Lịch sử</span>
          </button>

          <button
            onClick={onOpenGasExport}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-amber-950 px-3 py-1.5 rounded-full font-bold shadow-sm transition"
            title="Xuất mã Google Apps Script Code.gs / Index.html"
          >
            <Code2 className="w-4 h-4" />
            <span className="hidden sm:inline">Xuất Mã GAS</span>
          </button>

          {student && (
            <button
              onClick={onLogout}
              className="p-1.5 hover:bg-teal-800/80 rounded-full text-teal-200 hover:text-white transition ml-1"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
