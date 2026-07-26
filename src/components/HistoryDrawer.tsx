import React, { useState, useEffect } from "react";
import { HistoryRecord } from "../types";
import { X, Clock, MessageSquare, CheckCircle2, Link, Save, Check } from "lucide-react";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  historyList: HistoryRecord[];
  onSelectHistoryItem: (item: HistoryRecord) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  historyList,
  onSelectHistoryItem
}) => {
  const [sheetUrl, setSheetUrl] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("thay_tung_gas_url") || "https://script.google.com/macros/s/AKfycbzMauX8KA8eIYgBIuHKmA6xJ3PB6NK2zrPPnYetEhJibBIKEhEALmSmK0Tj-Zd-u34uqg/exec";
    setSheetUrl(saved);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveUrl = () => {
    localStorage.setItem("thay_tung_gas_url", sheetUrl.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-teal-100">
        {/* Header */}
        <div className="bg-[#0F9D8A] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-200" />
            <h2 className="font-bold text-base">Lịch Sử Học Tập & Đồng Bộ Sheet</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-teal-800 rounded-full transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Info & WebApp URL Input */}
        <div className="bg-teal-50 px-4 py-3 border-b border-teal-200 text-xs text-teal-900 space-y-2">
          <div className="font-bold flex items-center gap-1.5 text-[#0F766E]">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Tự động đồng bộ với Google Sheet
          </div>
          <p className="text-[11px] text-teal-700 leading-snug">
            Khi chạy trực tiếp trên Google Apps Script, lịch sử được tự động ghi vào sheet <code className="bg-teal-100 px-1 rounded font-mono font-bold">LICH_SU_CHAT</code>.
          </p>

          <div className="pt-1 space-y-1">
            <label className="text-[11px] font-bold text-teal-800 block flex items-center gap-1">
              <Link className="w-3.5 h-3.5 text-teal-600" />
              URL WebApp Google Sheet (Tùy chọn):
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 bg-white border border-teal-300 rounded-lg px-2.5 py-1 text-[11px] text-teal-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <button
                onClick={handleSaveUrl}
                className="bg-[#0F9D8A] hover:bg-[#0F766E] text-white text-[11px] font-bold px-3 py-1 rounded-lg flex items-center gap-1 transition"
              >
                {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                {savedSuccess ? "Đã lưu!" : "Lưu"}
              </button>
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {historyList.length === 0 ? (
            <div className="text-center py-12 text-teal-700/60 text-sm">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-40 text-teal-600" />
              Chưa có lịch sử học tập nào. Hãy gửi bài tập đầu tiên nhé!
            </div>
          ) : (
            historyList.map((item) => (
              <div
                key={item.historyId}
                onClick={() => {
                  onSelectHistoryItem(item);
                  onClose();
                }}
                className="bg-[#ECFEF9] hover:bg-teal-100/70 p-3.5 rounded-2xl border border-teal-200/80 cursor-pointer transition space-y-1.5 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs text-teal-700 font-semibold">
                  <span className="bg-teal-200 text-teal-900 px-2 py-0.5 rounded-full text-[10px]">
                    {item.cheDo === "HINT"
                      ? "Gợi ý"
                      : item.cheDo === "STEP"
                      ? "Từng bước"
                      : "Giải đầy đủ"}
                  </span>
                  <span className="text-[11px] text-teal-600">{item.timestamp}</span>
                </div>
                <p className="text-xs font-semibold text-[#17332D] line-clamp-2">
                  {item.cauHoiGoc}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đã ghi chép bài giải</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
