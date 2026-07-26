import React, { useState, useRef } from "react";
import { Camera, Image as ImageIcon, Sigma, Send, X, Loader2 } from "lucide-react";

interface InputToolbarProps {
  onSendMessage: (text: string, imageBase64?: string, mimeType?: string) => void;
  isLoading: boolean;
  selectedModel: string;
}

export const InputToolbar: React.FC<InputToolbarProps> = ({
  onSendMessage,
  isLoading,
  selectedModel
}) => {
  const [inputText, setInputText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>("image/jpeg");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Compress image on canvas to keep payload small & fast
  const processAndCompressFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file hình ảnh (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Dung lượng ảnh vượt quá 10MB. Vui lòng chọn ảnh nhỏ hơn.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 1600;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setImagePreview(dataUrl);
          setImageMime("image/jpeg");
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processAndCompressFile(e.target.files[0]);
    }
  };

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAndCompressFile(e.dataTransfer.files[0]);
    }
  };

  // Handle Clipboard Paste (Ctrl+V / Cmd+V)
  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.items) {
      for (let i = 0; i < e.clipboardData.items.length; i++) {
        const item = e.clipboardData.items[i];
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          if (file) processAndCompressFile(file);
        }
      }
    }
  };

  const handleSend = () => {
    if (!inputText.trim() && !imagePreview) return;
    onSendMessage(inputText.trim(), imagePreview || undefined, imageMime);
    setInputText("");
    setImagePreview(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertFormulaSymbol = (symbol: string) => {
    setInputText((prev) => prev + symbol);
    if (textareaRef.current) textareaRef.current.focus();
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-t border-teal-100 shadow-lg px-3 py-2.5 sm:px-6 sm:py-3"
    >
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Hidden Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Image Preview Thumb */}
        {imagePreview && (
          <div className="relative inline-block bg-teal-50 p-1.5 rounded-xl border border-teal-200">
            <img
              src={imagePreview}
              alt="Xem trước đề bài"
              className="h-16 w-auto object-cover rounded-lg shadow-sm"
            />
            <button
              onClick={() => setImagePreview(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition"
              title="Xóa ảnh"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Main Input Row */}
        <div className="flex items-end gap-2">
          {/* Action Icons */}
          <div className="flex items-center gap-1 bg-teal-50/80 p-1 rounded-2xl border border-teal-100">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="p-2 hover:bg-teal-100/70 text-teal-700 rounded-xl transition"
              title="Chụp ảnh bằng camera"
            >
              <Camera className="w-5 h-5" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-teal-100/70 text-teal-700 rounded-xl transition"
              title="Tải ảnh lên"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => insertFormulaSymbol(" $x^2$ ")}
              className="p-2 hover:bg-teal-100/70 text-teal-700 rounded-xl font-semibold transition"
              title="Chèn công thức Toán"
            >
              <Sigma className="w-5 h-5" />
            </button>
          </div>

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Nhập bài tập Toán... hoặc Ctrl+V dán ảnh đề bài"
              rows={1}
              className="w-full bg-white border border-teal-200 focus:border-[#0F9D8A] focus:ring-2 focus:ring-teal-100 rounded-2xl px-4 py-2.5 text-sm sm:text-base text-[#17332D] placeholder-teal-600/50 resize-none outline-none max-h-32 transition"
            />
          </div>

          {/* Send Button */}
          <button
            disabled={isLoading || (!inputText.trim() && !imagePreview)}
            onClick={handleSend}
            className={`p-3 rounded-2xl font-bold transition flex items-center justify-center ${
              isLoading || (!inputText.trim() && !imagePreview)
                ? "bg-teal-100 text-teal-400 cursor-not-allowed"
                : "bg-[#0F9D8A] hover:bg-[#0F766E] text-white shadow-md shadow-teal-900/10 cursor-pointer"
            }`}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>

        {/* Footer Hint Text */}
        <div className="flex items-center justify-between text-[11px] text-teal-600/70 px-2 font-medium">
          <span>SHIFT + ENTER xuống dòng • $\Sigma$ chèn công thức</span>
          <span>Model: ✨ {selectedModel}</span>
        </div>
      </div>
    </div>
  );
};
