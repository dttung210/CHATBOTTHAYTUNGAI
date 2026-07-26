import React, { useState } from "react";
import { Student } from "../types";
import { BookOpen, Eye, EyeOff, Lock, User, AlertCircle, Sparkles } from "lucide-react";

interface LoginModalProps {
  onLoginSuccess: (student: Student) => void;
}

// Pre-seeded Sample Students
const SAMPLE_STUDENTS: Record<string, Student> = {
  hs7a01: {
    username: "hs7a01",
    hoTen: "Phạm Khánh Linh",
    lopDuocPhep: 7,
    mucDoMacDinh: "BASIC",
    mucDoToiDa: "BASIC",
    trangThai: "ACTIVE"
  },
  hs8a01: {
    username: "hs8a01",
    hoTen: "Nguyễn Minh An",
    lopDuocPhep: 8,
    mucDoMacDinh: "BASIC",
    mucDoToiDa: "BASIC",
    trangThai: "ACTIVE"
  },
  hs8a02: {
    username: "hs8a02",
    hoTen: "Trần Ngọc Bình",
    lopDuocPhep: 8,
    mucDoMacDinh: "ADVANCED",
    mucDoToiDa: "ADVANCED",
    trangThai: "ACTIVE"
  },
  hs9a01: {
    username: "hs9a01",
    hoTen: "Lê Gia Huy",
    lopDuocPhep: 9,
    mucDoMacDinh: "ADVANCED",
    mucDoToiDa: "ADVANCED",
    trangThai: "ACTIVE"
  }
};

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("hs8a01");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberUsername, setRememberUsername] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (loginAttempts >= 5) {
      setErrorMsg("Tài khoản tạm thời bị khóa do nhập sai quá 5 lần. Vui lòng thử lại sau 10 phút.");
      return;
    }

    const key = username.trim().toLowerCase();
    let foundStudent = SAMPLE_STUDENTS[key];

    // If not found in static list, allow dynamic student creation for testing in web preview
    if (!foundStudent && key.length >= 3) {
      foundStudent = {
        username: key,
        hoTen: username.trim(),
        lopDuocPhep: 8,
        mucDoMacDinh: "BASIC",
        mucDoToiDa: "BASIC",
        trangThai: "ACTIVE"
      };
    }

    if (foundStudent && foundStudent.trangThai === "ACTIVE") {
      const studentWithToken: Student = {
        ...foundStudent,
        sessionToken: "sess_" + Math.random().toString(36).substring(2) + "_" + Date.now()
      };
      if (rememberUsername) {
        localStorage.setItem("thay_tung_last_user", username);
      }
      onLoginSuccess(studentWithToken);
    } else {
      setLoginAttempts((prev) => prev + 1);
      setErrorMsg("Vui lòng nhập tên đăng nhập có ít nhất 3 ký tự.");
    }
  };

  const autofillStudent = (userKey: string) => {
    setUsername(userKey);
    setPassword("123456");
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F9D8A]/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-teal-100 overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 bg-teal-50 rounded-2xl border border-teal-100 shadow-sm text-[#0F9D8A]">
            <BookOpen className="w-9 h-9" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#17332D]">
            Trợ lý học tập Thầy Tùng AI
          </h1>
          <p className="text-xs sm:text-sm text-teal-700 font-medium">
            "Hỏi đúng cách – Hiểu từng bước – Tự mình giải được"
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-50 text-red-700 p-3 rounded-2xl border border-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#0F766E] uppercase">
              Tên đăng nhập (Username)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-teal-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập username học sinh..."
                className="w-full bg-teal-50/50 border border-teal-200 focus:border-[#0F9D8A] focus:ring-2 focus:ring-teal-100 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-[#17332D] outline-none font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#0F766E] uppercase">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-teal-500 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full bg-teal-50/50 border border-teal-200 focus:border-[#0F9D8A] focus:ring-2 focus:ring-teal-100 rounded-2xl pl-10 pr-10 py-2.5 text-sm text-[#17332D] outline-none font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-teal-600 hover:text-teal-800"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-teal-800">
            <label className="flex items-center gap-1.5 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={rememberUsername}
                onChange={(e) => setRememberUsername(e.target.checked)}
                className="accent-teal-600 rounded"
              />
              Ghi nhớ tên đăng nhập
            </label>
            <span className="text-teal-600/70 italic text-[11px]">Tài khoản do Thầy cấp</span>
          </div>

          <button
            type="submit"
            className="w-full bg-[#0F9D8A] hover:bg-[#0F766E] text-white font-bold py-3 rounded-2xl shadow-lg shadow-teal-900/15 transition cursor-pointer"
          >
            Đăng Nhập Vào Học
          </button>
        </form>

        {/* Quick Demo Accounts Selection */}
        <div className="pt-2 border-t border-teal-100 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-teal-800">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Tài khoản kiểm thử mẫu:
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => autofillStudent("hs7a01")}
              className="bg-teal-50 hover:bg-teal-100/80 p-2 rounded-xl text-left border border-teal-200/80 transition"
            >
              <div className="font-bold text-[#17332D]">hs7a01</div>
              <div className="text-[11px] text-teal-700">P. Khánh Linh (Lớp 7)</div>
            </button>
            <button
              type="button"
              onClick={() => autofillStudent("hs8a01")}
              className="bg-teal-50 hover:bg-teal-100/80 p-2 rounded-xl text-left border border-teal-200/80 transition"
            >
              <div className="font-bold text-[#17332D]">hs8a01</div>
              <div className="text-[11px] text-teal-700">N. Minh An (Lớp 8)</div>
            </button>
            <button
              type="button"
              onClick={() => autofillStudent("hs8a02")}
              className="bg-amber-50 hover:bg-amber-100/80 p-2 rounded-xl text-left border border-amber-200/80 transition"
            >
              <div className="font-bold text-amber-950">hs8a02 (Nâng cao)</div>
              <div className="text-[11px] text-amber-800">T. Ngọc Bình (Lớp 8)</div>
            </button>
            <button
              type="button"
              onClick={() => autofillStudent("hs9a01")}
              className="bg-amber-50 hover:bg-amber-100/80 p-2 rounded-xl text-left border border-amber-200/80 transition"
            >
              <div className="font-bold text-amber-950">hs9a01 (Nâng cao)</div>
              <div className="text-[11px] text-amber-800">Lê Gia Huy (Lớp 9)</div>
            </button>
          </div>
        </div>

        {/* Google Sheet Sync Notice */}
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-3 text-[11px] text-amber-950 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-900">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Lưu ý quan trọng khi thêm tài khoản trên Google Sheet:
          </div>
          <ol className="list-decimal list-inside space-y-0.5 text-amber-900/90 leading-tight">
            <li>Ghi thông tin học sinh vào sheet <code className="bg-amber-100 px-1 rounded font-mono font-bold">HOC_SINH</code> (điền <code className="bg-amber-100 px-1 rounded font-mono">temp_password</code>).</li>
            <li>Vào menu <strong className="text-amber-950">THẦY TÙNG AI</strong> trên Google Sheet &gt; Chọn <strong className="text-amber-950">"4. Mã hóa mật khẩu đang chờ"</strong> (bắt buộc).</li>
            <li>Tải lại Web App để đăng nhập tài khoản mới!</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
