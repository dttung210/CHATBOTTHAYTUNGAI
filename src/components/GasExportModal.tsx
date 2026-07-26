import React, { useState } from "react";
import { X, Copy, Check, FileCode, Download, BookOpen } from "lucide-react";

interface GasExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  codeGsContent: string;
  indexHtmlContent: string;
}

export const GasExportModal: React.FC<GasExportModalProps> = ({
  isOpen,
  onClose,
  codeGsContent,
  indexHtmlContent
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<"CODE_GS" | "INDEX_HTML" | "GUIDE">("CODE_GS");
  const [copiedGs, setCopiedGs] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  const copyToClipboard = (text: string, isGs: boolean) => {
    navigator.clipboard.writeText(text);
    if (isGs) {
      setCopiedGs(true);
      setTimeout(() => setCopiedGs(false), 2000);
    } else {
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    }
  };

  const downloadFile = (filename: string, text: string) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-teal-100 flex flex-col h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-[#0F9D8A] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileCode className="w-6 h-6 text-amber-300" />
            <div>
              <h2 className="font-bold text-lg">MÃ NGUỒN TRIỂN KHAI GOOGLE APPS SCRIPT</h2>
              <p className="text-xs text-teal-100">
                Chỉ cần copy 2 file Code.gs & Index.html sang Google Sheet để chạy ứng dụng thật!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-teal-800 rounded-full transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation & Controls */}
        <div className="bg-teal-50 px-5 py-2.5 border-b border-teal-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("CODE_GS")}
              className={`px-4 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition ${
                activeTab === "CODE_GS"
                  ? "bg-[#0F9D8A] text-white shadow-sm"
                  : "bg-white text-teal-800 hover:bg-teal-100"
              }`}
            >
              FILE 1: Code.gs
            </button>
            <button
              onClick={() => setActiveTab("INDEX_HTML")}
              className={`px-4 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition ${
                activeTab === "INDEX_HTML"
                  ? "bg-[#0F9D8A] text-white shadow-sm"
                  : "bg-white text-teal-800 hover:bg-teal-100"
              }`}
            >
              FILE 2: Index.html
            </button>
            <button
              onClick={() => setActiveTab("GUIDE")}
              className={`px-4 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-1.5 ${
                activeTab === "GUIDE"
                  ? "bg-amber-500 text-amber-950 shadow-sm"
                  : "bg-white text-amber-900 hover:bg-amber-100"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Hướng Dẫn Lắp Ráp
            </button>
          </div>

          {/* Action Copy/Download */}
          <div className="flex items-center gap-2">
            {activeTab === "CODE_GS" && (
              <>
                <button
                  onClick={() => copyToClipboard(codeGsContent, true)}
                  className="flex items-center gap-1.5 bg-[#0F9D8A] hover:bg-[#0F766E] text-white font-bold px-3 py-1.5 rounded-xl text-xs transition"
                >
                  {copiedGs ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedGs ? "Đã Sao Chép!" : "Copy Code.gs"}</span>
                </button>
                <button
                  onClick={() => downloadFile("Code.gs", codeGsContent)}
                  className="p-1.5 bg-white border border-teal-200 text-teal-800 hover:bg-teal-100 rounded-xl text-xs transition"
                  title="Tải file Code.gs"
                >
                  <Download className="w-4 h-4" />
                </button>
              </>
            )}

            {activeTab === "INDEX_HTML" && (
              <>
                <button
                  onClick={() => copyToClipboard(indexHtmlContent, false)}
                  className="flex items-center gap-1.5 bg-[#0F9D8A] hover:bg-[#0F766E] text-white font-bold px-3 py-1.5 rounded-xl text-xs transition"
                >
                  {copiedHtml ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedHtml ? "Đã Sao Chép!" : "Copy Index.html"}</span>
                </button>
                <button
                  onClick={() => downloadFile("Index.html", indexHtmlContent)}
                  className="p-1.5 bg-white border border-teal-200 text-teal-800 hover:bg-teal-100 rounded-xl text-xs transition"
                  title="Tải file Index.html"
                >
                  <Download className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Code Content View */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#1E293B] text-teal-100 font-mono text-xs leading-relaxed">
          {activeTab === "CODE_GS" && <pre className="whitespace-pre-wrap">{codeGsContent}</pre>}
          {activeTab === "INDEX_HTML" && <pre className="whitespace-pre-wrap">{indexHtmlContent}</pre>}
          {activeTab === "GUIDE" && (
            <div className="font-sans text-white text-sm space-y-4 max-w-3xl mx-auto py-4">
              <h3 className="font-bold text-lg text-amber-400">
                11 BƯỚC TRIỂN KHAI CHO GIÁO VIÊN (KHÔNG CẦN BIẾT LẬP TRÌNH)
              </h3>
              <ol className="list-decimal list-inside space-y-2.5 leading-relaxed text-slate-200">
                <li><strong>Tạo Google Trang tính mới:</strong> Truy cập Google Drive &gt; Mới &gt; Google Trang tính &gt; Đặt tên "Thầy Tùng AI".</li>
                <li><strong>Mở Apps Script:</strong> Nhấn menu <em>Tiện ích mở rộng &gt; Apps Script</em>.</li>
                <li><strong>Dán Code.gs:</strong> Xóa toàn bộ code cũ trong `Code.gs`, dán mã từ tab "FILE 1: Code.gs" vào rồi bấm Ctrl+S để lưu.</li>
                <li><strong>Tạo file Index.html:</strong> Bấm dấu (+) góc trái Apps Script &gt; Chọn HTML &gt; Đặt tên chính xác là `Index` &gt; Dán toàn bộ mã từ tab "FILE 2: Index.html" vào.</li>
                <li><strong>Chạy setupApp():</strong> Chọn hàm `setupApp` ở thanh công cụ phía trên &gt; Bấm `Run` &gt; Cấp quyền truy cập Google Sheet.</li>
                <li><strong>Nhập Gemini API Key:</strong> Quay lại Google Sheet &gt; Tải lại trang &gt; Mở menu <strong>THẦY TÙNG AI</strong> ở thanh công cụ &gt; Chọn "2. Nhập Gemini API Key" &gt; Dán key của bạn vào.</li>
                <li><strong>Chọn model Gemini:</strong> Trong menu THẦY TÙNG AI, chọn "3. Chọn model Gemini" &gt; Nhập model (ví dụ `gemini-2.5-flash`).</li>
                <li><strong>Kiểm tra cấu hình:</strong> Chọn "6. Kiểm tra cấu hình" trong menu để xác nhận hệ thống đã sẵn sàng.</li>
                <li><strong>Triển khai Web App:</strong> Bấm nút <em>Deploy (Triển khai) &gt; New deployment &gt; Web app</em> &gt; Execute as: <strong>Me</strong> &gt; Who has access: <strong>Anyone (Tất cả mọi người)</strong> &gt; Bấm Deploy.</li>
                <li><strong>Sao chép URL:</strong> Copy đường dẫn Web App vừa tạo để gửi cho học sinh sử dụng!</li>
                <li><strong>Tạo tài khoản thật:</strong> Vào Sheet `HOC_SINH`, thêm các dòng tài khoản mới, nhập `temp_password`, sau đó vào menu THẦY TÙNG AI chọn "4. Mã hóa mật khẩu đang chờ".</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
