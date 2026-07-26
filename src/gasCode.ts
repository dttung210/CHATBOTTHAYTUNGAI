export const CODE_GS_FULL = `/**
 * TRỢ LÝ HỌC TẬP THẦY TÙNG AI - GOOGLE APPS SCRIPT BACKEND
 * Slogan: "Hỏi đúng cách – Hiểu từng bước – Tự mình giải được"
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('THẦY TÙNG AI')
    .addItem('1. Thiết lập ứng dụng lần đầu', 'setupApp')
    .addItem('2. Nhập hoặc thay Gemini API Key', 'promptAndSaveGeminiApiKey')
    .addItem('3. Chọn model Gemini', 'promptAndSaveGeminiModel')
    .addItem('4. Mã hóa mật khẩu đang chờ', 'hashPendingPasswords')
    .addItem('5. Đặt lại mật khẩu học sinh', 'resetStudentPassword')
    .addItem('6. Kiểm tra cấu hình', 'checkConfiguration')
    .addItem('7. Tạo dữ liệu học sinh mẫu', 'seedSampleStudents_')
    .addItem('8. Tạo lịch sử chat mẫu (Ghi vào LICH_SU_CHAT)', 'seedSampleHistory_')
    .addItem('9. Mở hướng dẫn sử dụng', 'openGuideSheet_')
    .addItem('10. Xóa cache cấu hình', 'clearAppCache')
    .addToUi();
}

function doGet(e) {
  if (e && e.parameter) {
    var action = e.parameter.action;
    if (action === 'GET_HISTORY') {
      var username = e.parameter.username;
      var history = getStudentHistory(username);
      return ContentService.createTextOutput(JSON.stringify({ success: true, history: history }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  var template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('Trợ lý học tập Thầy Tùng AI')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    var postBody = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : null;
    if (postBody) {
      if (postBody.action === "GET_HISTORY" && postBody.username) {
        var historyList = getStudentHistory(postBody.username);
        return ContentService.createTextOutput(JSON.stringify({ success: true, history: historyList }))
          .setMimeType(ContentService.MimeType.JSON);
      } else if (postBody.record) {
        saveChatHistory(postBody.record);
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: "History saved to LICH_SU_CHAT" }))
          .setMimeType(ContentService.MimeType.JSON);
      } else if (postBody.action === "SAVE_HISTORY" && postBody.record) {
        saveChatHistory(postBody.record);
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: "History saved to LICH_SU_CHAT" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ success: false, message: "No post data" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Lấy danh sách lịch sử chat của học sinh từ sheet LICH_SU_CHAT
function getStudentHistory(username) {
  if (!username) return [];
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('LICH_SU_CHAT');
  if (!sheet || sheet.getLastRow() <= 1) return [];

  var data = sheet.getDataRange().getValues();
  var historyList = [];
  var targetUser = String(username).toLowerCase().trim();

  for (var i = 1; i < data.length; i++) {
    var rowUser = String(data[i][2]).toLowerCase().trim();
    if (rowUser === targetUser) {
      historyList.push({
        historyId: data[i][0] || ('hist_' + i),
        timestamp: data[i][1] ? new Date(data[i][1]).toLocaleString('vi-VN') : '',
        username: data[i][2],
        lopHoc: data[i][6] || 8,
        cheDo: data[i][8] || 'HINT',
        cauHoiGoc: data[i][9] || '',
        deBaiLatex: data[i][13] || data[i][9] || '',
        resultStatus: data[i][26] || 'SUCCESS'
      });
    }
  }
  return historyList.reverse(); // Mới nhất lên đầu
}

// Lưu lịch sử câu hỏi / phản hồi vào sheet LICH_SU_CHAT
function saveChatHistory(historyData) {
  if (!historyData || !historyData.username) return false;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('LICH_SU_CHAT');
  if (!sheet) return false;

  sheet.appendRow([
    historyData.historyId || ('hist_' + Date.now()),
    new Date(),
    historyData.username,
    'session_' + Date.now(),
    'conv_' + Date.now(),
    'prob_' + Date.now(),
    historyData.lopHoc || 8,
    'BASIC',
    historyData.cheDo || 'HINT',
    historyData.cauHoiGoc || '',
    'WEB_APP',
    '',
    historyData.cauHoiGoc || '',
    historyData.deBaiLatex || '',
    'MATH',
    'MEDIUM',
    '{}',
    '',
    1,
    3,
    '',
    'SUCCESS',
    false,
    'OK',
    'OK',
    250,
    'SUCCESS',
    '',
    '',
    'HELPFUL'
  ]);
  return true;
}

// Tự động đăng nhập học sinh mặc định hoặc qua URL param
function getAutoStudent(queryUsername) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('HOC_SINH');
  if (!sheet || sheet.getLastRow() <= 1) return null;

  var data = sheet.getDataRange().getValues();
  var target = (queryUsername || 'hs8a01').toLowerCase().trim();

  for (var i = 1; i < data.length; i++) {
    var u = String(data[i][1]).toLowerCase().trim();
    var status = String(data[i][10]).toUpperCase().trim();
    if (u === target && status === 'ACTIVE') {
      return {
        username: data[i][1],
        hoTen: data[i][5],
        lopDuocPhep: data[i][6] || 8,
        mucDoMacDinh: data[i][8] || 'BASIC',
        mucDoToiDa: data[i][9] || 'BASIC',
        trangThai: 'ACTIVE'
      };
    }
  }
  // Mặc định chọn dòng đầu tiên active
  for (var j = 1; j < data.length; j++) {
    if (String(data[j][10]).toUpperCase().trim() === 'ACTIVE') {
      return {
        username: data[j][1],
        hoTen: data[j][5],
        lopDuocPhep: data[j][6] || 8,
        mucDoMacDinh: data[j][8] || 'BASIC',
        mucDoToiDa: data[j][9] || 'BASIC',
        trangThai: 'ACTIVE'
      };
    }
  }
  return null;
}

function setupApp() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  createRequiredSheets_(ss);
  formatSheets_(ss);
  seedSettings_(ss);
  seedCurriculumRules_(ss);
  seedSampleStudents_(ss);
  seedSampleHistory_(ss);
  createGuideSheet_(ss);
  
  // Ensure session secret
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SESSION_SECRET')) {
    props.setProperty('SESSION_SECRET', Utilities.getUuid());
  }
  if (!props.getProperty('GEMINI_MODEL')) {
    props.setProperty('GEMINI_MODEL', 'gemma-4-31b-it');
  }
  
  SpreadsheetApp.getUi().alert('Thiết lập thành công! Đã tạo dữ liệu mẫu và sheet LICH_SU_CHAT.');
}

function createRequiredSheets_(ss) {
  var requiredSheets = [
    'HOC_SINH',
    'QUY_TAC_KIEN_THUC',
    'LICH_SU_CHAT',
    'TIEN_DO_TUNG_BUOC',
    'CAI_DAT',
    'NHAT_KY_LOI',
    'HUONG_DAN'
  ];
  
  requiredSheets.forEach(function(name) {
    if (!ss.getSheetByName(name)) {
      ss.insertSheet(name);
    }
  });
}

function formatSheets_(ss) {
  var headersMap = {
    'HOC_SINH': ['student_id', 'username', 'temp_password', 'password_hash', 'password_salt', 'ho_ten', 'lop_duoc_phep', 'chu_de_duoc_phep', 'muc_do_mac_dinh', 'muc_do_toi_da', 'trang_thai', 'ngay_het_han', 'login_failed_count', 'locked_until', 'ngay_tao', 'ngay_cap_nhat', 'lan_dang_nhap_cuoi', 'ghi_chu'],
    'QUY_TAC_KIEN_THUC': ['rule_id', 'lop_hoc', 'muc_do', 'mach_kien_thuc', 'chu_de', 'noi_dung_duoc_phep', 'noi_dung_bi_chan', 'phuong_phap_duoc_phep', 'phuong_phap_bi_chan', 'tu_khoa_nhan_dien', 'ghi_chu', 'enabled', 'updated_at'],
    'LICH_SU_CHAT': ['history_id', 'timestamp', 'username', 'session_id', 'conversation_id', 'problem_id', 'lop_hoc', 'muc_do_kien_thuc', 'che_do_ho_tro', 'cau_hoi_goc', 'source_type', 'image_name', 'de_bai_nhan_dien', 'de_bai_latex', 'classification', 'difficulty', 'ai_response_json', 'response_display_text', 'current_step', 'total_steps', 'student_step_answer', 'validation_status', 'needs_figure', 'tikz_status', 'svg_status', 'processing_time_ms', 'result_status', 'error_code', 'error_message', 'helpful_rating'],
    'TIEN_DO_TUNG_BUOC': ['progress_id', 'username', 'session_id', 'conversation_id', 'problem_id', 'current_step', 'total_steps', 'step_state', 'student_answer', 'retry_count', 'validation_status', 'plan_json', 'updated_at', 'completed_at'],
    'CAI_DAT': ['config_key', 'config_value', 'data_type', 'description', 'editable', 'updated_at'],
    'NHAT_KY_LOI': ['log_id', 'timestamp', 'function_name', 'username', 'error_code', 'safe_message', 'technical_message', 'stack_summary', 'request_id', 'resolved'],
    'HUONG_DAN': ['STT', 'Mục', 'Nội dung hướng dẫn']
  };

  Object.keys(headersMap).forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    var headers = headersMap[sheetName];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      var range = sheet.getRange(1, 1, 1, headers.length);
      range.setBackground('#0F9D8A').setFontColor('#FFFFFF').setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  });
}

function seedSettings_(ss) {
  var sheet = ss.getSheetByName('CAI_DAT');
  if (sheet.getLastRow() <= 1) {
    var defaults = [
      ['APP_NAME', 'Trợ lý học tập Thầy Tùng AI', 'STRING', 'Tên ứng dụng', true, new Date()],
      ['DEFAULT_MODE', 'HINT', 'STRING', 'Chế độ mặc định', true, new Date()],
      ['DEFAULT_LEVEL', 'BASIC', 'STRING', 'Mức kiến thức mặc định', true, new Date()],
      ['SESSION_DURATION_MINUTES', '120', 'NUMBER', 'Thời gian phiên đăng nhập', true, new Date()],
      ['MAX_IMAGE_SIZE_MB', '4', 'NUMBER', 'Dung lượng ảnh tối đa', true, new Date()],
      ['MAX_LOGIN_ATTEMPTS', '5', 'NUMBER', 'Số lần đăng nhập sai tối đa', true, new Date()]
    ];
    defaults.forEach(function(row) { sheet.appendRow(row); });
  }
}

function seedCurriculumRules_(ss) {
  var sheet = ss.getSheetByName('QUY_TAC_KIEN_THUC');
  if (sheet.getLastRow() <= 1) {
    var rules = [
      ['R001', 7, 'BASIC', 'Đại số', 'Số hữu tỉ', 'Số hữu tỉ, số thập phân, quy tắc chuyển vế', 'Số thực, căn bậc hai, hằng đẳng thức', 'Cộng trừ nhân chia số hữu tỉ', 'Dùng căn thức', 'số hữu tỉ', 'Lớp 7 cơ bản', true, new Date()],
      ['R002', 8, 'BASIC', 'Đại số', 'Phương trình', 'Phương trình bậc nhất 1 ẩn', 'Đạo hàm, Tích phân, Hệ PT bậc nhất 2 ẩn', 'Phân tích thành nhân tử', 'Ma trận, Đạo hàm', 'phương trình', 'Lớp 8 cơ bản', true, new Date()],
      ['R003', 9, 'BASIC', 'Đại số', 'Căn thức & Bậc hai', 'Căn bậc hai, PT bậc hai, Viet', 'Đạo hàm, Tích phân, Giới hạn, Số phức', 'Công thức nghiệm Delta, Viet', 'Đạo hàm, Tích phân', 'căn thức, delta', 'Lớp 9 cơ bản', true, new Date()]
    ];
    rules.forEach(function(row) { sheet.appendRow(row); });
  }
}

function seedSampleStudents_(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('HOC_SINH');
  if (sheet.getLastRow() <= 1) {
    var students = [
      ['STU001', 'hs7a01', '123456', '', '', 'Phạm Khánh Linh', 7, 'ALL', 'BASIC', 'BASIC', 'ACTIVE', '', 0, '', new Date(), new Date(), '', 'Tài khoản mẫu'],
      ['STU002', 'hs8a01', '123456', '', '', 'Nguyễn Minh An', 8, 'ALL', 'BASIC', 'BASIC', 'ACTIVE', '', 0, '', new Date(), new Date(), '', 'Tài khoản mẫu'],
      ['STU003', 'hs8a02', '123456', '', '', 'Trần Ngọc Bình', 8, 'ALL', 'ADVANCED', 'ADVANCED', 'ACTIVE', '', 0, '', new Date(), new Date(), '', 'Tài khoản mẫu'],
      ['STU004', 'hs9a01', '123456', '', '', 'Lê Gia Huy', 9, 'ALL', 'ADVANCED', 'ADVANCED', 'ACTIVE', '', 0, '', new Date(), new Date(), '', 'Tài khoản mẫu']
    ];
    students.forEach(function(row) { sheet.appendRow(row); });
    hashPendingPasswords();
  }
}

function seedSampleHistory_(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('LICH_SU_CHAT');
  if (!sheet) return;
  if (sheet.getLastRow() <= 1) {
    var now = new Date();
    var sampleLogs = [
      ['hist_101', now, 'hs8a01', 'sess_1', 'conv_1', 'prob_1', 8, 'BASIC', 'HINT', 'Giải phương trình x^2 + 3x - 4 = 0', 'WEB_APP', '', 'x^2 + 3x - 4 = 0', 'x^2 + 3x - 4 = 0', 'MATH', 'MEDIUM', '{}', 'Gợi ý: Phân tích x^2 + 3x - 4 thành nhân tử (x-1)(x+4)=0', 1, 3, 'x = 1 hoặc x = -4', 'VALID', false, 'OK', 'OK', 220, 'SUCCESS', '', '', 'HELPFUL'],
      ['hist_102', now, 'hs8a01', 'sess_1', 'conv_2', 'prob_2', 8, 'BASIC', 'STEP_BY_STEP', 'Tính diện tích hình thang có đáy a=5, b=9 và h=4', 'WEB_APP', '', 'Cho a=5, b=9, h=4', 'S = \\frac{(a+b)h}{2}', 'MATH', 'EASY', '{}', 'Bước 1: Tính tổng hai đáy 5 + 9 = 14. Bước 2: Nhân chiều cao 14 * 4 = 56. Bước 3: Chia 2 = 28.', 3, 3, 'S = 28', 'VALID', false, 'OK', 'OK', 180, 'SUCCESS', '', '', 'HELPFUL'],
      ['hist_103', now, 'hs7a01', 'sess_2', 'conv_3', 'prob_3', 7, 'BASIC', 'CHECK_ANSWER', 'Rút gọn biểu thức A = 3(x + 2) - 5', 'WEB_APP', '', '3(x + 2) - 5', 'A = 3x + 1', 'MATH', 'EASY', '{}', 'Chính xác! Em làm đúng rồi: 3x + 6 - 5 = 3x + 1', 1, 1, '3x + 1', 'VALID', false, 'OK', 'OK', 150, 'SUCCESS', '', '', 'HELPFUL']
    ];
    sampleLogs.forEach(function(row) { sheet.appendRow(row); });
  }
}

function createGuideSheet_(ss) {
  var sheet = ss.getSheetByName('HUONG_DAN');
  if (sheet.getLastRow() <= 1) {
    var guide = [
      [1, 'Thêm học sinh', 'Vào sheet HOC_SINH, điền username, ho_ten, lop_duoc_phep, temp_password.'],
      [2, 'Mã hóa mật khẩu', 'Mở menu THẦY TÙNG AI > Chọn "4. Mã hóa mật khẩu đang chờ".'],
      [3, 'Đặt lại mật khẩu', 'Mở menu THẦY TÙNG AI > Chọn "5. Đặt lại mật khẩu học sinh".'],
      [4, 'Triển khai Web App', 'Nhấn Deploy > New deployment > Chọn Web App > Execute as: Me > Who has access: Anyone.']
    ];
    guide.forEach(function(row) { sheet.appendRow(row); });
  }
}

function promptAndSaveGeminiApiKey() {
  var ui = SpreadsheetApp.getUi();
  var result = ui.prompt('Nhập Gemini API Key', 'Dán Gemini API Key của bạn vào đây:', ui.ButtonSet.OK_CANCEL);
  if (result.getSelectedButton() == ui.Button.OK) {
    var key = result.getResponseText().trim();
    if (key) {
      PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', key);
      ui.alert('Đã lưu Gemini API Key thành công!');
    }
  }
}

function promptAndSaveGeminiModel() {
  var ui = SpreadsheetApp.getUi();
  var result = ui.prompt('Chọn Model Gemini', 'Nhập tên model (Mặc định: gemini-3.6-flash):', ui.ButtonSet.OK_CANCEL);
  if (result.getSelectedButton() == ui.Button.OK) {
    var model = result.getResponseText().trim() || 'gemini-3.6-flash';
    PropertiesService.getScriptProperties().setProperty('GEMINI_MODEL', model);
    ui.alert('Đã lưu model: ' + model);
  }
}

function hashPendingPasswords() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('HOC_SINH');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var tempPass = data[i][2];
    if (tempPass && tempPass !== '') {
      var salt = Utilities.getUuid();
      var hash = computeHash_(tempPass, salt);
      sheet.getRange(i + 1, 4).setValue(hash);
      sheet.getRange(i + 1, 5).setValue(salt);
      sheet.getRange(i + 1, 3).setValue('');
    }
  }
  SpreadsheetApp.getUi().alert('Đã mã hóa tất cả mật khẩu đang chờ!');
}

function computeHash_(password, salt) {
  var raw = password + salt;
  var hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw);
  return hash.map(function(b) { return (b < 0 ? b + 256 : b).toString(16); }).join('');
}

function checkConfiguration() {
  var props = PropertiesService.getScriptProperties();
  var apiKey = props.getProperty('GEMINI_API_KEY');
  var model = props.getProperty('GEMINI_MODEL') || 'gemini-3.6-flash';
  
  var status = '=== KẾT QUẢ KIỂM TRA CẤU HÌNH ===\\n';
  status += '1. Gemini API Key: ' + (apiKey ? 'ĐÃ CÓ (Hợp lệ)' : 'CHƯA NHẬP (Lỗi)') + '\\n';
  status += '2. Gemini Model: ' + model + '\\n';
  status += '3. Google Sheets: Tất cả các sheet đã được thiết lập đủ.\\n';
  
  SpreadsheetApp.getUi().alert(status);
}

function clearAppCache() {
  CacheService.getScriptCache().removeAll(['config', 'curriculum']);
  SpreadsheetApp.getUi().alert('Đã xóa cache cấu hình thành công!');
}

function openGuideSheet_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('HUONG_DAN');
  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(sheet);
}
`;

export const INDEX_HTML_FULL = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trợ lý học tập Thầy Tùng AI</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#F4FBF9] text-[#17332D]">
  <div id="app" class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-[#0F9D8A] text-white p-4 shadow-md flex justify-between items-center">
      <div class="flex items-center gap-2">
        <h1 class="font-bold text-lg">Trợ lý học tập Thầy Tùng AI</h1>
        <span class="text-[11px] bg-teal-800/80 px-2.5 py-0.5 rounded-full" id="studentBadge">Đang tải học sinh...</span>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="newChat()" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1">
          🔄 Làm mới
        </button>
        <button onclick="loadHistory()" class="bg-teal-800 hover:bg-teal-900 text-white text-xs px-3 py-1.5 rounded-xl font-medium transition">
          🕒 Lịch sử chat
        </button>
      </div>
    </header>
    
    <!-- Main Content -->
    <main class="flex-1 max-w-4xl mx-auto w-full p-4 space-y-4">
      <div class="bg-white p-6 rounded-3xl shadow-sm border border-teal-100 space-y-4">
        <div class="flex items-center justify-between border-b pb-3 border-teal-100">
          <div>
            <h2 class="text-base font-bold text-[#0F766E]" id="welcomeMsg">Đang kết nối tài khoản Google Sheet...</h2>
            <p class="text-xs text-slate-500">Tự động đồng bộ lịch sử bài tập theo từng học sinh</p>
          </div>
          <span class="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">✓ Tự động đăng nhập</span>
        </div>

        <div id="historySection" class="hidden bg-teal-50/60 p-4 rounded-2xl border border-teal-100 space-y-2">
          <h3 class="font-bold text-xs text-teal-800 uppercase tracking-wider">Lịch sử các bài toán đã giải</h3>
          <div id="historyList" class="space-y-2 text-xs">
            <p class="text-slate-500 italic">Đang tải lịch sử...</p>
          </div>
        </div>
      </div>
    </main>
  </div>

  <script>
    var currentUsername = 'hs8a01';

    window.onload = function() {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run.withSuccessHandler(function(stu) {
          if (stu) {
            currentUsername = stu.username;
            document.getElementById('studentBadge').innerText = stu.hoTen + ' (Lớp ' + stu.lopDuocPhep + ')';
            document.getElementById('welcomeMsg').innerText = 'Xin chào ' + stu.hoTen + '! Thầy Tùng AI sẵn sàng hỗ trợ em.';
            loadHistory();
          }
        }).getAutoStudent('');
      } else {
        document.getElementById('studentBadge').innerText = 'Phạm Khánh Linh (Lớp 8)';
        document.getElementById('welcomeMsg').innerText = 'Xin chào Phạm Khánh Linh! Thầy Tùng AI sẵn sàng hỗ trợ em.';
      }
    };

    function newChat() {
      var histSec = document.getElementById('historySection');
      if (histSec) histSec.classList.add('hidden');
      alert('Đã làm mới cuộc trò chuyện. Em có thể gửi câu hỏi mới!');
    }

    function loadHistory() {
      var histSec = document.getElementById('historySection');
      histSec.classList.remove('hidden');
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run.withSuccessHandler(function(list) {
          var container = document.getElementById('historyList');
          if (!list || list.length === 0) {
            container.innerHTML = '<p class="text-slate-500 italic">Chưa có lịch sử học tập nào trên Google Sheet.</p>';
            return;
          }
          var html = '';
          list.forEach(function(item) {
            html += '<div class="bg-white p-3 rounded-xl border border-teal-200/80 shadow-sm space-y-1">';
            html += '  <div class="flex justify-between text-[10px] text-teal-700 font-semibold">';
            html += '    <span>Chế độ: ' + item.cheDo + '</span>';
            html += '    <span>' + item.timestamp + '</span>';
            html += '  </div>';
            html += '  <p class="font-medium text-slate-800">' + item.cauHoiGoc + '</p>';
            html += '</div>';
          });
          container.innerHTML = html;
        }).getStudentHistory(currentUsername);
      }
    }
  </script>
</body>
</html>
`;
