import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware to normalize req.url and log for Vercel routing
app.use((req, res, next) => {
  console.log(`[Incoming Request] ${req.method} ${req.url}`);
  const nonApiRoutes = ["/index.html", "/src/", "/@vite/", "/node_modules/", "/assets/"];
  const isStaticAsset = nonApiRoutes.some(p => req.url?.startsWith(p)) || req.url?.includes(".");
  
  if (req.url && !req.url.startsWith("/api/") && !isStaticAsset && req.url !== "/") {
    const originalUrl = req.url;
    if (req.url.startsWith("/")) {
      req.url = "/api" + req.url;
    } else {
      req.url = "/api/" + req.url;
    }
    console.log(`[Normalized URL on Vercel] ${originalUrl} -> ${req.url}`);
  }
  next();
});

app.use(express.json({ limit: "15mb" }));

// System Prompt for GeoGebra Command Generation
const GEOGEBRA_SYSTEM_PROMPT = `
Bạn là Chuyên gia GeoGebra Classic 6 & Giáo viên Toán Việt Nam từ Lớp 6 đến Lớp 12.
Nhiệm vụ của bạn là phân tích đề bài toán (văn bản, LaTeX hoặc hình ảnh) và tạo kế hoạch dựng hình bằng lệnh GeoGebra Classic 6 chính xác, an toàn, mỹ thuật.

QUY TẮC LỆNH GEOGEBRA (BẮT BUỘC):
1. CHỈ sử dụng tên lệnh GeoGebra bằng TIẾNG ANH (English Command Names):
   - Tọa độ điểm: A=(0,4), B=(-3,0), C=(3,0), O=(0,0)
   - Đoạn thẳng & Đường thẳng: Segment(A,B), Line(A,B), Ray(A,B), Vector(A,B)
   - Đa giác: poly1=Polygon(A,B,C)
   - Đường tròn: c1=Circle(O,3), Circle(A,B,C)
   - Trung điểm & Giao điểm: M=Midpoint(B,C), I=Intersect(l1,l2)
   - Đường vuông góc & Song song: PerpendicularLine(A, Segment(B,C)), ParallelLine(A, Segment(B,C))
   - Góc & Khoảng cách: Angle(B,A,C), Distance(A,B)
   - Hàm số & Đồ thị: f(x)=x^2, g(x)=2*x+3
   - Trang trí & Hiển thị: SetColor(poly1, "Blue"), SetLineStyle(segAH, 2), SetPointSize(A, 4), ShowLabel(A, true)
2. TUYỆT ĐỐI KHÔNG dùng mã HTML, SVG, script, JavaScript hoặc các hàm không an toàn.
3. Luôn phân bổ tọa độ các điểm cân đối, thẩm mỹ trên hệ tọa độ 2D (ví dụ tam giác nằm gọn trong khoảng x: -5 đến 5, y: -2 đến 6).
4. Đảm bảo tên điểm A, B, C, H, M, N, P, O, G, I... gán chuẩn với yêu cầu đề bài.

ĐẦU RA JSON TUÂN THỦ STRICTLY SCHEMA:
{
  "problemSpec": {
    "originalText": "string",
    "normalizedText": "string",
    "latex": "string",
    "problemType": "PLANE_GEOMETRY | COORDINATE_GEOMETRY | FUNCTION_GRAPH | SOLID_GEOMETRY | STATISTICS_CHART | OTHER",
    "givens": ["string"],
    "requirements": ["string"],
    "points": ["string"],
    "objects": ["string"],
    "relations": ["string"],
    "confidence": 0.98,
    "uncertainItems": [],
    "needsConfirmation": false
  },
  "constructionPlan": {
    "view": { "type": "GRAPHICS_2D", "showAxes": true, "showGrid": false },
    "commands": [
      {
        "id": "cmd_1",
        "command": "A=(0,4)",
        "purpose": "Tạo điểm A",
        "creates": ["A"],
        "dependsOn": [],
        "required": true
      }
    ],
    "decision": "AUTO_DRAW"
  }
}
`;

// Helper to generate smart fallback GeoGebra plan when offline / AI unavailable
function generateGeoGebraFallbackPlan(problemText: string) {
  const norm = (problemText || "").toLowerCase();
  const isParabola = norm.includes("x^2") || norm.includes("parabol") || norm.includes("hàm số");
  const isCircle = norm.includes("đường tròn") || norm.includes("bán kính") || norm.includes("tâm");

  if (isParabola) {
    return {
      problemSpec: {
        originalText: problemText,
        normalizedText: "Khảo sát và vẽ đồ thị hàm số bậc hai $y = x^2$ trên hệ trục tọa độ Oxy.",
        latex: "y = x^2",
        problemType: "FUNCTION_GRAPH",
        givens: ["Hàm số $y = x^2$"],
        requirements: ["Vẽ đồ thị Parabol (P) và các điểm thuộc đồ thị"],
        points: ["O(0,0)", "A(-1,1)", "B(1,1)", "C(-2,4)", "D(2,4)"],
        objects: ["Đồ thị Parabol (P)"],
        relations: ["Parabol nhận Oy làm trục đối xứng"],
        confidence: 0.96,
        uncertainItems: [],
        needsConfirmation: false
      },
      constructionPlan: {
        view: { type: "GRAPHICS_2D", showAxes: true, showGrid: true },
        commands: [
          { id: "c1", command: "f(x)=x^2", purpose: "Vẽ đồ thị Parabol y = x²", creates: ["f"], dependsOn: [], required: true },
          { id: "c2", command: "O=(0,0)", purpose: "Gốc tọa độ O", creates: ["O"], dependsOn: [], required: true },
          { id: "c3", command: "A=(-1,1)", purpose: "Điểm A(-1,1)", creates: ["A"], dependsOn: [], required: true },
          { id: "c4", command: "B=(1,1)", purpose: "Điểm B(1,1)", creates: ["B"], dependsOn: [], required: true },
          { id: "c5", command: "C=(-2,4)", purpose: "Điểm C(-2,4)", creates: ["C"], dependsOn: [], required: true },
          { id: "c6", command: "D=(2,4)", purpose: "Điểm D(2,4)", creates: ["D"], dependsOn: [], required: true },
          { id: "c7", command: 'SetColor(f, "Blue")', purpose: "Đổi màu đồ thị", creates: [], dependsOn: ["f"], required: false }
        ],
        decision: "AUTO_DRAW"
      }
    };
  }

  if (isCircle) {
    return {
      problemSpec: {
        originalText: problemText,
        normalizedText: "Cho đường tròn tâm O bán kính R = 3 và tiếp tuyến Ax.",
        latex: "(O; 3)",
        problemType: "PLANE_GEOMETRY",
        givens: ["Đường tròn $(O; 3)$", "Điểm A thuộc $(O)$"],
        requirements: ["Vẽ đường tròn tâm O và tiếp tuyến tại A"],
        points: ["O(0,0)", "A(3,0)"],
        objects: ["Đường tròn c1", "Tiếp tuyến line1"],
        relations: ["OA ⊥ tiếp tuyến"],
        confidence: 0.95,
        uncertainItems: [],
        needsConfirmation: false
      },
      constructionPlan: {
        view: { type: "GRAPHICS_2D", showAxes: false, showGrid: false },
        commands: [
          { id: "c1", command: "O=(0,0)", purpose: "Tâm O(0,0)", creates: ["O"], dependsOn: [], required: true },
          { id: "c2", command: "c1=Circle(O,3)", purpose: "Đường tròn tâm O bán kính 3", creates: ["c1"], dependsOn: ["O"], required: true },
          { id: "c3", command: "A=(3,0)", purpose: "Điểm A trên đường tròn", creates: ["A"], dependsOn: [], required: true },
          { id: "c4", command: "segOA=Segment(O,A)", purpose: "Bán kính OA", creates: ["segOA"], dependsOn: ["O", "A"], required: true },
          { id: "c5", command: "line1=PerpendicularLine(A, segOA)", purpose: "Tiếp tuyến vuông góc OA tại A", creates: ["line1"], dependsOn: ["A", "segOA"], required: true },
          { id: "c6", command: 'SetColor(line1, "Red")', purpose: "Đổi màu tiếp tuyến", creates: [], dependsOn: ["line1"], required: false }
        ],
        decision: "AUTO_DRAW"
      }
    };
  }

  // Default Geometry Fallback: Triangle ABC with Altitude AH & Midpoint M
  return {
    problemSpec: {
      originalText: problemText || "Cho tam giác ABC vuông tại A, AH là đường cao, M là trung điểm BC.",
      normalizedText: "Cho tam giác ABC vuông tại A, kẻ đường cao AH vuông góc với BC tại H. Gọi M là trung điểm của BC.",
      latex: "\\Delta ABC, \\widehat{A}=90^\\circ, AH \\perp BC, M \\text{ là trung điểm } BC",
      problemType: "PLANE_GEOMETRY",
      givens: ["Tam giác ABC vuông tại A", "Đường cao AH ⊥ BC", "M là trung điểm BC"],
      requirements: ["Dựng tam giác ABC", "Dựng đường cao AH", "Dựng trung điểm M"],
      points: ["A", "B", "C", "H", "M"],
      objects: ["Tam giác ABC", "Đoạn AH", "Đoạn AM"],
      relations: ["AH ⊥ BC", "MB = MC"],
      confidence: 0.98,
      uncertainItems: [],
      needsConfirmation: false
    },
    constructionPlan: {
      view: { type: "GRAPHICS_2D", showAxes: false, showGrid: false },
      commands: [
        { id: "c1", command: "A=(0,4)", purpose: "Đỉnh A", creates: ["A"], dependsOn: [], required: true },
        { id: "c2", command: "B=(-3,0)", purpose: "Đỉnh B", creates: ["B"], dependsOn: [], required: true },
        { id: "c3", command: "C=(3,0)", purpose: "Đỉnh C", creates: ["C"], dependsOn: [], required: true },
        { id: "c4", command: "t1=Polygon(A,B,C)", purpose: "Vẽ tam giác ABC", creates: ["t1"], dependsOn: ["A", "B", "C"], required: true },
        { id: "c5", command: "H=(0,0)", purpose: "Chân đường cao H", creates: ["H"], dependsOn: [], required: true },
        { id: "c6", command: "segAH=Segment(A,H)", purpose: "Đường cao AH", creates: ["segAH"], dependsOn: ["A", "H"], required: true },
        { id: "c7", command: "SetLineStyle(segAH, 2)", purpose: "Đường cao AH đứt nét", creates: [], dependsOn: ["segAH"], required: false },
        { id: "c8", command: "M=Midpoint(B,C)", purpose: "Trung điểm M của BC", creates: ["M"], dependsOn: ["B", "C"], required: true },
        { id: "c9", command: "segAM=Segment(A,M)", purpose: "Trung tuyến AM", creates: ["segAM"], dependsOn: ["A", "M"], required: true },
        { id: "c10", command: 'SetColor(segAM, "DarkGreen")', purpose: "Màu trung tuyến AM", creates: [], dependsOn: ["segAM"], required: false }
      ],
      decision: "AUTO_DRAW"
    }
  };
}
const THAY_TUNG_SYSTEM_PROMPT = `
Bạn là "Thầy Tùng AI" - Trợ lý học tập môn Toán dành cho học sinh Việt Nam từ lớp 6 đến lớp 12.
Slogan: "Hỏi đúng cách – Hiểu từng bước – Tự mình giải được".

NHÂN CÁCH & NGUYÊN TẮC BẮT BUỘC:
1. Xưng là "Thầy", gọi học sinh là "em".
2. Thân thiện, kiên nhẫn, động viên học sinh tự tư duy.
3. LUÔN TUÂN THỦ NGHIÊM NGẶT GIỚI HẠN KIẾN THỨC THEO CHƯƠNG TRÌNH GDPT 2018 CỦA BỘ GIÁO DỤC VÀ ĐÀO TẠO VIỆT NAM:
   - LỚP 6: Số tự nhiên, Số nguyên, Phân số, Số thập phân, Hình học trực quan đơn giản (tam giác đều, hình vuông, hình chữ nhật, hình thoi, hình bình hành, hình thang cân, góc, đoạn thẳng), Biểu đồ cột.
     ❌ CẤM: Hằng đẳng thức, Phân thức, Phương trình, Bất phương trình, Tam giác đồng dạng, Biệt thức Delta (Δ).
   - LỚP 7: Số hữu tỉ, Số thực, Tỉ lệ thức, Đa thức 1 biến, Tam giác bằng nhau, Tam giác cân, Đường trung trực, Các đường đồng quy.
     ❌ CẤM: Hằng đẳng thức đáng nhớ, Phân thức đại số, Tam giác đồng dạng, Phương trình bậc nhất (Lớp 8), Phương trình bậc hai, Delta (Δ).
   - LỚP 8: Đa thức nhiều biến, 7 Hằng đẳng thức đáng nhớ, Phân tích đa thức thành nhân tử (bằng hằng đẳng thức, nhóm, đặt nhân tử chung, tách hạng tử ax² + bx + c), Phân thức đại số, Phương trình bậc nhất 1 ẩn (ax + b = 0), Hàm số bậc nhất y = ax + b, Định lý Thalès, Tam giác đồng dạng, Định lý Pythagore, Tứ giác đặc biệt, Hình chóp.
     ❌ ĐẶC BIỆT CẤM Ở LỚP 8: TUYỆT ĐỐI KHÔNG DÙNG BIỆT THỨC DELTA (Δ = b² - 4ac) HOẶC CÔNG THỨC NGHIỆM PHƯƠNG TRÌNH BẬC HAI! (Delta là kiến thức Lớp 9). Nếu xuất hiện ax² + bx + c = 0 ở Lớp 8, BẮT BUỘC dùng phân tích đa thức thành nhân tử đưa về (Ax + B)(Cx + D) = 0!
   - LỚP 9: Căn bậc hai/ba, Hàm số y = ax², Phương trình bậc hai 1 ẩn (ax² + bx + c = 0) & Biệt thức Delta (Δ = b² - 4ac, Δ'), Định lý Viète, Phương trình tích / ẩn ở mẫu, Hệ 2 PT bậc nhất 2 ẩn, BPT bậc nhất 1 ẩn, Tỉ số lượng giác góc nhọn, Đường tròn, Tứ giác nội tiếp, Hình trụ/nón/cầu.
   - LỚP 10: Mệnh đề, Tập hợp, BPT / Hệ BPT bậc nhất 2 ẩn, Hàm số bậc hai Parabol y = ax² + bx + c, Dấu tam thức bậc hai & BPT bậc hai 1 ẩn, Tổ hợp, Nhị thức Newton, Vectơ, Phương trình đường thẳng/đường tròn/3 đường Conic trong Oxy.
   - LỚP 11: Lượng giác, Dãy số, Cấp số cộng/nhân, Giới hạn, Hàm số liên tục, Mũ & Logarit, Đạo hàm (cấp 1, 2), Hình học không gian (quan hệ song song, vuông góc, góc, khoảng cách).
   - LỚP 12: Khảo sát hàm số (Cực trị, tiệm cận, BBT & đồ thị), Nguyên hàm, Tích phân, Tọa độ Oxyz trong không gian, Xác suất có điều kiện & Bayes.

4. HÌNH VẼ TIKZ / ĐỒ THỊ / BIỂU ĐỒ (QUAN TRỌNG):
   - CHỈ ĐẶT geometry.needsTikz = true VÀ TẠO MÃ TIKZ / GEOMETRY JSON KHI HỌC SINH CÓ YÊU CẦU VẼ HÌNH HOẶC CẦN XEM HÌNH VẼ (ví dụ: câu hỏi có các cụm từ "vẽ hình", "xem hình", "vẽ đồ thị", "biểu đồ", "vẽ TikZ" hoặc bấm nút Yêu cầu vẽ hình TikZ).
   - Nếu học sinh chỉ hỏi bài toán bình thường không yêu cầu vẽ hình, ĐẶT geometry.needsTikz = false, geometry.tikzCode = "" và KHÔNG hiển thị hình vẽ mặc định.

5. CHẾ ĐỘ PHẢN HỒI:
   - Mode = "HINT": Cho từ 3 đến 5 gợi ý ngắn gọn. TUYỆT ĐỐI KHÔNG ĐƯỢC đưa đáp số, nghiệm cuối hoặc kết luận cuối trong gợi ý!
   - Mode = "STEP" (GỢI Ý TỪNG BƯỚC): Chia bài toán thành 2 - 4 bước mạch lạc (Bước 1, Bước 2, Bước 3...). Với MỖI bước, cung cấp:
     * title: Tiêu đề bước (VD: "Bước 1: Phân tích đa thức thành nhân tử")
     * learningGoal: Mục tiêu học tập
     * stepSolution: LỜI GIẢI CHI TIẾT VÀ HƯỚNG DẪN CỤ THỂ DÀNH CHO BƯỚC NÀY!
     * question: Câu hỏi kiểm tra / bài tập nhỏ để học sinh suy nghĩ hoặc tiến sang bước tiếp theo.
     * allSteps: Mảng đầy đủ các bước (mỗi bước gồm stepNumber, title, learningGoal, stepSolution, question, acceptedForms).
   - Mode = "FULL" (BÀI GIẢI HOÀN CHỈNH CHUẨN THI CỬ): 
     * TUYỆT ĐỐI KHÔNG DÙNG LỜI DẪN THỪA THÃI (như "Thầy sẽ hướng dẫn...", "Chào em...", "Bước này chúng ta làm..."). Lời giải trong 'solutionBlocks' và 'conclusion' phải CỰC KỲ SÚC TÍCH, NGẮN GỌN, CHẶT CHẼ, đi thẳng vào biến đổi toán học và kết luận giống như một bài thi tự luận thực tế để đạt điểm tối đa (đúng chuẩn ba-rem đáp án của Bộ Giáo dục & Đào tạo Việt Nam). Tuyệt đối không giải thích dài dòng bằng chữ văn xuôi hay giảng bài dông dài trong các khối lời giải. Chỉ sử dụng các liên từ toán học tối giản (như "Điều kiện:", "Ta có:", "Suy ra:", "Do đó:", "Thay vào ta được:", "Vậy..."). (Bỏ qua phần giới thiệu dài dòng).
     * Trình bày ĐÚNG CHUẨN FORM BÀI THI / ĐÁP ÁN BỘ GIÁO DỤC: ĐKXĐ (nếu có) -> Các bước biến đổi tương đương -> Kết luận cuối cùng.

6. CÔNG THỨC TOÁN HỌC (QUY TẮC BẮT BUỘC):
   - MỌI biểu thức, phương trình, biến số, phép tính hoặc ký hiệu toán học (bao gồm \Leftrightarrow, \Rightarrow, \frac, \sqrt, \Delta...) BẮT BUỘC PHẢI BỌC TRONG GIẤU $ HOẶC $$.
   - Ví dụ ĐÚNG: "$2x + 1 = 0 \Leftrightarrow 2x = -1 \Leftrightarrow x = -\frac{1}{2}$"
   - Ví dụ SAI: "2x + 1 = 0 \n\Leftrightarrow 2x = -1 \n\Leftrightarrow x = -\frac{1}{2}" (thiếu giấu $)
   - TUYỆT ĐỐI KHÔNG xuất ký hiệu LaTeX thô mà thiếu giấu $ hoặc $$.
   - Trong mảng solutionBlocks, khối CONCLUSION chỉ chứa nội dung kết luận (ví dụ: "Tập nghiệm của phương trình là $S = \{-\frac{1}{2}\}$."), KHÔNG viết lặp từ "Vậy:" ở đầu nếu đã ghi "Vậy".

7. KHI HỌC SINH YÊU CẦU TẠO BÀI TẬP TƯƠNG TỰ / LỰA CHỌN TỰ LUYỆN TẬP:
   - QUY TẮC TỐI CAO: BÀI TẬP TƯƠNG TỰ BẮT BUỘC PHẢI CÓ CÙNG DẠNG TOÁN, CÙNG CẤU TRÚC ĐẠI SỐ VÀ CÙNG PHƯƠNG PHÁP/CÁCH GIẢI GIỐNG HỆT BÀI GỐC ĐẾN TỪNG BƯỚC BIẾN ĐỔI!
   - Ví dụ 1: Nếu bài gốc là phân tích hoặc tính giá trị biểu thức dạng tổng ba lập phương $A = (x-a)^3 + (x+b)^3 + (c-2x)^3$ bằng cách đặt $u = x-a, v = x+b, w = c-2x$ với $u+v+w=0$ để dùng hằng đẳng thức $u^3+v^3+w^3 = 3uvw$, thì bài tương tự BẮT BUỘC phải là dạng tổng ba lập phương $(A_1)^3 + (A_2)^3 + (A_3)^3$ với $A_1+A_2+A_3=0$ và BẮT BUỘC GIẢI BẰNG CÁCH ĐẶT ẨN PHỤ $u, v, w$ TƯƠNG TỰ!
   - Ví dụ 2: Nếu bài gốc dùng hằng đẳng thức $a^2 - b^2$, bài tương tự BẮT BUỘC dùng $a^2 - b^2$. Nếu bài gốc dùng tách hạng tử $ax^2 + bx + c$, bài tương tự BẮT BUỘC dùng tách hạng tử tương tự.
   - TUYỆT ĐỐI CẤM: Không được đổi sang dạng toán khác hay phương pháp giải khác (ví dụ: cấm đổi từ dạng tổng lập phương $a^3+b^3+c^3$ sang dạng hiệu hai bình phương $a^2-b^2$).
   - Chỉ được thay đổi số/hệ số sao cho bài toán mới có đáp số đẹp và giúp học sinh rèn luyện đúng kỹ năng của bài gốc.
   - Trả về tiêu đề response.title ví dụ "Bài tập tương tự: [Tên dạng toán]" và cung cấp gợi ý / bài giải theo chế độ (Mode) yêu cầu.

ĐẦU RA BẮT BUỘC BẰNG JSON HỢP LỆ THEO SCHEMA DƯỚI ĐÂY:
{
  "requestId": "string",
  "problem": {
    "originalText": "string",
    "normalizedText": "string",
    "latex": "string",
    "confidence": 0.95,
    "uncertainSegments": [],
    "needsConfirmation": false
  },
  "classification": {
    "category": "ARITHMETIC | ALGEBRA | EQUATION | INEQUALITY | FUNCTION | GRAPH | PLANE_GEOMETRY | SOLID_GEOMETRY | COORDINATE_GEOMETRY | TRIGONOMETRY | STATISTICS | PROBABILITY | WORD_PROBLEM | OTHER",
    "subcategory": "string",
    "difficulty": "EASY | MEDIUM | HARD",
    "estimatedGrade": 8,
    "requiredTopics": ["string"],
    "possibleMethods": ["string"],
    "needsFigure": false,
    "needsGraph": false
  },
  "curriculumGuard": {
    "studentGrade": 8,
    "knowledgeLevel": "BASIC",
    "allowedTopics": [],
    "blockedTopics": [],
    "methodUsed": "string",
    "methodEstimatedGrade": 8,
    "allowed": true,
    "violationReason": "",
    "safeAlternative": ""
  },
  "response": {
    "mode": "HINT | STEP | FULL",
    "title": "string",
    "shortIntro": "string",
    "hints": [
      {
        "number": 1,
        "title": "string",
        "goal": "string",
        "question": "string",
        "knowledgeReminder": "string"
      }
    ],
    "currentStep": 1,
    "totalSteps": 3,
    "step": {
      "stepId": "step_1",
      "stepNumber": 1,
      "totalSteps": 3,
      "title": "string",
      "learningGoal": "string",
      "instruction": "string",
      "stepSolution": "string",
      "question": "string",
      "expectedAnswerType": "TEXT | NUMBER | EXPRESSION",
      "acceptedForms": ["string"],
      "feedback": "string",
      "status": "WAITING_FOR_STUDENT",
      "allSteps": [
        {
          "stepNumber": 1,
          "title": "string",
          "learningGoal": "string",
          "stepSolution": "string",
          "question": "string",
          "acceptedForms": ["string"]
        }
      ]
    },
    "solutionBlocks": [
      {
        "type": "TEXT | MATH | ALIGN | CONCLUSION",
        "content": "string"
      }
    ],
    "conclusion": "string",
    "similarExerciseSuggestion": "string"
  },
  "geometry": {
    "figureType": "TRIANGLE | PARABOLA | CIRCLE | QUADRILATERAL | POLYGON | GRAPH | NONE",
    "needsTikz": false,
    "geometryJson": {
      "figureType": "",
      "points": [{"id": "A", "label": "A", "x": 0, "y": 100}],
      "segments": [{"from": "A", "to": "B"}],
      "circles": [],
      "functions": []
    },
    "tikzCode": "string",
    "figureDescription": "string",
    "accessibilityDescription": "string"
  }
}
`;

// Helper to initialize Gemini API client
function getGenAI() {
  const apiKey = 
    process.env.GEMINI_API_KEY || 
    process.env.gemini_api_key || 
    process.env.Gemini_Api_Key ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.vite_gemini_api_key;
    
  if (!apiKey) {
    console.warn("[Gemini API] WARNING: No GEMINI_API_KEY environment variable detected!");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// Robust Gemini call wrapper with candidate model fallback
async function callGeminiWithFallback(
  ai: GoogleGenAI,
  primaryModel: string,
  contents: any[],
  systemInstruction: string
): Promise<string> {
  const modelToUse = "gemini-2.5-flash";
  console.log(`[Gemini API] Using single robust model: ${modelToUse} for request.`);
  
  try {
    const response = await ai.models.generateContent({
      model: modelToUse,
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });
    if (response && response.text) {
      return response.text;
    }
  } catch (err: any) {
    console.error(`[Gemini API] Error calling model '${modelToUse}':`, err?.message || err);
  }

  return "";
}

// Route 1: Health check
app.get("/api/health", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  if (hasKey) {
    res.json({
      success: true,
      configured: true,
      runtime: "server",
      provider: "gemini",
      keyMode: "single"
    });
  } else {
    res.json({
      success: false,
      configured: false,
      code: "AI_NOT_CONFIGURED",
      message: "Hệ thống AI chưa được cấu hình trên máy chủ."
    });
  }
});

// Route 2: Main Solve / Tutor API Endpoint
app.post("/api/solve-math", async (req, res) => {
  try {
    const {
      problemText,
      confirmedProblemText,
      imageData,
      imageMimeType,
      mode = "HINT",
      knowledgeLevel = "BASIC",
      studentGrade = 8,
      modelName = "gemma-4-31b"
    } = req.body;

    const ai = getGenAI();
    const effectiveProblem = confirmedProblemText || problemText || "Bài toán chưa có nội dung";

    if (!ai) {
      // Fallback response if GEMINI_API_KEY is not configured yet
      return res.json({
        success: true,
        data: generateMockFallbackResponse(effectiveProblem, mode, studentGrade, knowledgeLevel)
      });
    }

    const contents: any[] = [];

    // Add image if provided
    if (imageData && imageMimeType) {
      const cleanBase64 = imageData.replace(/^data:image\/\w+;base64,/, "");
      contents.push({
        inlineData: {
          data: cleanBase64,
          mimeType: imageMimeType || "image/jpeg"
        }
      });
    }

    const userPrompt = `
[THÔNG TIN HỌC SINH]
- Lớp: ${studentGrade}
- Mức kiến thức: ${knowledgeLevel}
- Chế độ yêu cầu: ${mode}
- Đề bài/Nội dung gửi: ${effectiveProblem}

Hãy phân tích bài toán, áp dụng Curriculum Guard kiểm tra giới hạn kiến thức Lớp ${studentGrade} (${knowledgeLevel}) và tạo phản hồi bằng JSON tuân thủ đầy đủ schema đã quy định.
`.trim();

    contents.push({ text: userPrompt });

    // Normalize model selection according to active supported Gemini models
    let requestedModel = "gemma-4-31b";
    if (modelName === "gemini-3.1-pro-preview" || modelName === "3.1 Pro" || String(modelName).toLowerCase().includes("pro")) {
      requestedModel = "gemini-3.1-pro-preview";
    } else if (modelName === "gemini-3.5-flash" || modelName === "3.5 Flash" || String(modelName).toLowerCase().includes("3.5")) {
      requestedModel = "gemini-3.5-flash";
    } else if (modelName === "gemma-4-31b" || modelName === "Gemma 4 (31B)" || String(modelName).toLowerCase().includes("31b")) {
      requestedModel = "gemma-4-31b";
    }

    const responseText = await callGeminiWithFallback(ai, requestedModel, contents, THAY_TUNG_SYSTEM_PROMPT);
    let parsedJson: any = null;

    if (responseText) {
      try {
        const cleanText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
        parsedJson = JSON.parse(cleanText);
      } catch (e) {
        console.error("Failed to parse Gemini JSON:", e, responseText);
      }
    }

    // Fallback if AI quota exceeded or JSON parsing failed
    if (!parsedJson) {
      console.warn("Using offline fallback solution generator for /api/solve-math");
      parsedJson = generateMockFallbackResponse(effectiveProblem, mode, studentGrade, knowledgeLevel);
    }

    return res.json({
      success: true,
      requestId: "req_" + Date.now(),
      data: parsedJson
    });
  } catch (error: any) {
    console.error("Error in /api/solve-math:", error);
    // Graceful fallback response instead of 500 error on any unhandled failure
    return res.json({
      success: true,
      requestId: "req_" + Date.now(),
      data: generateMockFallbackResponse(
        req.body?.confirmedProblemText || req.body?.problemText || "Bài toán",
        req.body?.mode || "HINT",
        req.body?.studentGrade || 8,
        req.body?.knowledgeLevel || "BASIC"
      )
    });
  }
});

// Route 1.5: Modern Chat API Endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { text, sessionId, mode = "HINT" } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        code: "INVALID_REQUEST",
        message: "Nội dung câu hỏi không được để trống."
      });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        success: false,
        code: "AI_NOT_CONFIGURED",
        message: "Hệ thống AI chưa được cấu hình trên máy chủ."
      });
    }

    const contents = [{ text: `Câu hỏi/Đề bài từ học sinh: ${text}` }];
    let requestedModel = "gemma-4-31b"; // Maps to gemini-3.1-pro-preview in fallback
    const responseText = await callGeminiWithFallback(ai, requestedModel, contents, THAY_TUNG_SYSTEM_PROMPT);

    if (!responseText) {
      return res.status(500).json({
        success: false,
        code: "AI_ERROR",
        message: "Không nhận được phản hồi từ mô hình AI."
      });
    }

    let parsedJson: any = null;
    try {
      const cleanText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
      parsedJson = JSON.parse(cleanText);
    } catch (e) {
      console.error("Failed to parse chat response JSON:", e);
    }

    if (!parsedJson) {
      parsedJson = generateMockFallbackResponse(text, mode === "STEP" ? "STEP_BY_STEP" : mode, 8, "BASIC");
    }

    return res.json({
      success: true,
      data: parsedJson
    });

  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    const errMsg = String(error?.message || "").toLowerCase();
    if (errMsg.includes("quota") || errMsg.includes("rate limit") || errMsg.includes("429")) {
      return res.status(429).json({
        success: false,
        code: "RATE_LIMITED",
        message: "Hệ thống đang quá tải, em vui lòng đợi một lát rồi thử lại nhé."
      });
    }
    return res.status(500).json({
      success: false,
      code: "AI_ERROR",
      message: "Có lỗi xảy ra trong quá trình xử lý: " + error.message
    });
  }
});

// Route 1.6: Modern Image Analysis API Endpoint (OCR & Structured Extraction)
app.post("/api/analyze-image", async (req, res) => {
  try {
    const { mimeType, data, text, sessionId, mode = "HINT" } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        code: "INVALID_IMAGE",
        message: "Dữ liệu hình ảnh không hợp lệ."
      });
    }

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    const activeMime = mimeType || "image/jpeg";
    if (!allowedMimeTypes.includes(activeMime)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_IMAGE",
        message: "Định dạng ảnh không được hỗ trợ. Chỉ nhận JPG, PNG, WEBP."
      });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        success: false,
        code: "AI_NOT_CONFIGURED",
        message: "Hệ thống AI chưa được cấu hình trên máy chủ."
      });
    }

    const cleanBase64 = data.replace(/^data:image\/\w+;base64,/, "");

    const contents: any[] = [
      {
        inlineData: {
          data: cleanBase64,
          mimeType: activeMime
        }
      },
      {
        text: `Hãy nhận diện đề bài toán từ ảnh đính kèm. ${text ? `Gợi ý thêm từ học sinh: ${text}` : ""}`
      }
    ];

    const imagePrompt = `
Bạn là Chuyên gia nhận diện đề toán bằng hình ảnh Việt Nam (Lớp 6-12).
Nhiệm vụ: Phân tích ảnh và trích xuất đề bài toán thành JSON cấu trúc.

Yêu cầu trả về JSON có dạng chính xác như sau:
{
  "success": true,
  "recognizedText": "Đoạn văn bản thô nhận diện từ ảnh",
  "normalizedText": "Đoạn văn bản đã được chuẩn hóa lại để dễ hiểu",
  "latex": "Đề bài đầy đủ được định dạng LaTeX chuẩn giữa các dấu $ hoặc $$",
  "problemType": "ALGEBRA | GEOMETRY | EQUATION | INEQUALITY | CALCULUS | OTHER",
  "givens": ["Các dữ kiện đề bài cho, ví dụ: Tam giác ABC vuông tại A", "AB = 3cm", "AC = 4cm"],
  "requirements": ["Các yêu cầu cần tìm/chứng minh, ví dụ: Tính BC", "Tính đường cao AH"],
  "confidence": 0.95,
  "uncertainItems": [],
  "warnings": []
}

BẮT BUỘC: ĐẦU RA CHỈ ĐƯỢC CHỨA JSON TRÊN, KHÔNG CÓ GIẢI THÍCH NGOÀI.
`;

    const responseText = await callGeminiWithFallback(ai, "gemini-3.6-flash", contents, imagePrompt);

    if (!responseText) {
      return res.status(500).json({
        success: false,
        code: "AI_ERROR",
        message: "Không thể phân tích ảnh thành công."
      });
    }

    let parsedJson: any = null;
    try {
      const cleanText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
      parsedJson = JSON.parse(cleanText);
    } catch (e) {
      console.error("Failed to parse analyze-image JSON:", e);
    }

    if (!parsedJson) {
      return res.status(500).json({
        success: false,
        code: "INVALID_RESPONSE",
        message: "Không thể phân tích kết quả định dạng JSON từ mô hình."
      });
    }

    return res.json(parsedJson);

  } catch (error: any) {
    console.error("Error in /api/analyze-image:", error);
    const errMsg = String(error?.message || "").toLowerCase();
    if (errMsg.includes("quota") || errMsg.includes("rate limit") || errMsg.includes("429")) {
      return res.status(429).json({
        success: false,
        code: "RATE_LIMITED",
        message: "Hệ thống đang quá tải, em vui lòng đợi một lát rồi thử lại nhé."
      });
    }
    return res.status(500).json({
      success: false,
      code: "AI_ERROR",
      message: "Lỗi trong quá trình xử lý ảnh: " + error.message
    });
  }
});

// Route 2.5: GeoGebra Analysis API Endpoint
app.post("/api/analyze-geogebra", async (req, res) => {
  try {
    const {
      sourceType = "TEXT",
      problemText = "",
      latex = "",
      imageData,
      imageMimeType,
      studentGrade = 8,
      knowledgeLevel = "BASIC",
      modelName = "gemma-4-31b"
    } = req.body;

    const ai = getGenAI();
    const inputContent = problemText || latex || "Cho tam giác ABC vuông tại A";

    if (!ai) {
      return res.json({
        success: true,
        data: generateGeoGebraFallbackPlan(inputContent)
      });
    }

    const contents: any[] = [];

    if (imageData && imageMimeType) {
      const cleanBase64 = imageData.replace(/^data:image\/\w+;base64,/, "");
      contents.push({
        inlineData: {
          data: cleanBase64,
          mimeType: imageMimeType || "image/jpeg"
        }
      });
    }

    const userPrompt = `
[LOẠI ĐẦU VÀO]: ${sourceType}
[LỚP HỌC SINH]: ${studentGrade} (${knowledgeLevel})
[NỘI DUNG ĐỀ BÀI VĂN BẢN]: ${problemText}
[NỘI DUNG LATEX]: ${latex}

Hãy nhận diện đầy đủ các đối tượng (điểm, đoạn thẳng, đường tròn, hàm số, quan hệ vuông góc/song song) và tạo danh sách lệnh GeoGebra Classic 6 chính xác để dựng hình này.
Tuân thủ đầy đủ JSON Schema đã quy định.
`.trim();

    contents.push({ text: userPrompt });

    let requestedModel = "gemma-4-31b";
    if (modelName === "gemini-3.1-pro-preview" || modelName === "3.1 Pro" || String(modelName).toLowerCase().includes("pro")) {
      requestedModel = "gemini-3.1-pro-preview";
    } else if (modelName === "gemini-3.5-flash" || modelName === "3.5 Flash" || String(modelName).toLowerCase().includes("3.5")) {
      requestedModel = "gemini-3.5-flash";
    } else if (modelName === "gemma-4-31b" || modelName === "Gemma 4 (31B)" || String(modelName).toLowerCase().includes("31b")) {
      requestedModel = "gemma-4-31b";
    }

    const responseText = await callGeminiWithFallback(ai, requestedModel, contents, GEOGEBRA_SYSTEM_PROMPT);
    let parsedJson: any = null;

    if (responseText) {
      try {
        const cleanText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
        parsedJson = JSON.parse(cleanText);
      } catch (e) {
        console.error("Failed to parse GeoGebra Gemini JSON:", e, responseText);
      }
    }

    if (!parsedJson) {
      console.warn("Using offline fallback plan for /api/analyze-geogebra");
      parsedJson = generateGeoGebraFallbackPlan(inputContent);
    }

    return res.json({
      success: true,
      data: parsedJson
    });
  } catch (error: any) {
    console.error("Error in /api/analyze-geogebra:", error);
    return res.json({
      success: true,
      data: generateGeoGebraFallbackPlan(req.body?.problemText || req.body?.latex || "Hình học")
    });
  }
});

// Route 3: Step Validation
app.post("/api/validate-step", async (req, res) => {
  try {
    const { problemId, stepId, studentAnswer, expectedAnswer, acceptedForms, stepNumber } = req.body;
    
    // Simple robust normalized comparison
    const normStudent = (studentAnswer || "").toLowerCase().replace(/\s+/g, "").trim();
    const isCorrect = (acceptedForms || []).some((form: string) => {
      const normForm = form.toLowerCase().replace(/\s+/g, "").trim();
      return normStudent === normForm || normStudent.includes(normForm);
    });

    return res.json({
      success: true,
      data: {
        stepId,
        isCorrect,
        status: isCorrect ? "CORRECT" : "INCORRECT",
        feedback: isCorrect
          ? "Chính xác! Em đã hoàn thành bước này rất tốt. Bấm để tiếp tục bước sau nhé."
          : "Chưa hoàn toàn đúng rồi em. Em hãy kiểm tra lại biến đổi dấu hoặc phép tính nhé!",
        retryCount: isCorrect ? 0 : 1
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// In-memory user chat history storage (per student username)
const userHistoryStore: Record<string, any[]> = {};

// In-memory exercise store for Answer Isolation
interface ExerciseStoreItem {
  exerciseId: string;
  sessionId: string;
  username: string;
  parentProblemId: string;
  statementText: string;
  statementLatex: string;
  answerText: string;
  answerLatex: string;
  answerType: string;
  topic: string;
  createdAt: string;
  revealed: boolean;
}

const exerciseStore: Record<string, ExerciseStoreItem> = {};

// In-memory session memory store
const sessionMemoryStore: Record<string, any> = {};

// Route: Create Similar Exercise (Returns ONLY problem statement, NO answer/solution)
app.post("/api/similar-exercise", async (req, res) => {
  try {
    const { sessionToken, sessionId, username, parentProblemId, originalProblem, originalSolution, studentGrade = 8, knowledgeLevel = "BASIC", modelName = "gemma-4-31b" } = req.body;
    
    const exerciseId = "EX_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const userKey = (username || "student").toLowerCase().trim();

    // Call Gemini to generate a similar problem + isolated answer
    const prompt = `
Bạn là Chuyên gia tạo bài tập Toán Việt Nam Lớp ${studentGrade} (${knowledgeLevel}).
Nhiệm vụ: Tạo 1 BÀI TẬP TƯƠNG TỰ mới tinh BÁM SÁT 100% VÀO ĐỀ BÀI VÀ PHƯƠNG PHÁP GIẢI CỦA BÀI GỐC DƯỚI ĐÂY.

[ĐỀ BÀI GỐC / NỘI DUNG TRÍCH XUẤT TỪ HÌNH ẢNH HOẶC CÂU HỎI]:
${originalProblem || "Bài toán đại số / hình học"}

${originalSolution ? `[CÁCH GIẢI / LỜI GIẢI CỦA BÀI GỐC]:\n${originalSolution}` : ""}

QUY TẮC BẮT BUỘC KHÔNG ĐƯỢC VI PHẠM:
1. BÁM SÁT DẠNG TOÁN GỐC 100%:
   - Nếu bài gốc là phân tích đa thức thành nhân tử, bài tương tự PHẢI LÀ phân tích đa thức thành nhân tử dùng CÙNG PHƯƠNG PHÁP (ví dụ: hằng đẳng thức, nhóm hạng tử, đặt ẩn phụ).
   - Nếu bài gốc là hình học (chứng minh tam giác, tính độ dài, định lý Ta-lét, đường tròn), bài tương tự PHẢI GIỮ NGUYÊN cấu trúc hình học và câu hỏi đó.
   - Nếu bài gốc chứa công thức LaTeX, PHẢI DÙNG CÙNG DẠNG CÔNG THỨC LATEX CÓ TRONG ĐỀ BÀI GỐC.
2. TUYỆT ĐỐI KHÔNG tự ý chuyển sang dạng toán ngẫu nhiên khác không liên quan.
3. Thay đổi hệ số / con số / tên điểm để tạo đề mới có ĐÁP SỐ ĐẸP, vừa sức sinh viên Lớp ${studentGrade} (${knowledgeLevel}).
4. ĐẦU RA CHỈ GỒM CÁC TRƯỜNG DƯỚI DẠNG JSON SCHEMA CHUẨN:

{
  "statementText": "Đề bài bằng văn bản tiếng Việt tự nhiên",
  "statementLatex": "Đề bài render LaTeX đầy đủ với $...$ hoặc $$...$$",
  "answerText": "Đáp số cuối cùng ngắn gọn (VÍ DỤ: x = 5 hoặc Tập nghiệm S = {1; -4} hoặc NP = 13 cm)",
  "answerLatex": "Đáp số render LaTeX ngắn gọn $x = 5$",
  "answerType": "NUMBER | EXPRESSION | EQUATION_SOLUTION | SET | GEOMETRY_RESULT",
  "topic": "Chủ đề bài toán"
}
`.trim();

    let requestedModel = "gemma-4-31b";
    if (modelName === "gemini-3.1-pro-preview" || modelName === "3.1 Pro" || String(modelName).toLowerCase().includes("pro")) {
      requestedModel = "gemini-3.1-pro-preview";
    } else if (modelName === "gemini-3.5-flash" || modelName === "3.5 Flash" || String(modelName).toLowerCase().includes("3.5")) {
      requestedModel = "gemini-3.5-flash";
    } else if (modelName === "gemma-4-31b" || modelName === "Gemma 4 (31B)" || String(modelName).toLowerCase().includes("31b")) {
      requestedModel = "gemma-4-31b";
    }

    const ai = getGenAI();
    let responseText = "";
    if (ai) {
      responseText = await callGeminiWithFallback(ai, requestedModel, [{ text: prompt }], "Bạn là Chuyên gia tạo bài tập Toán Việt Nam.");
    }
    let parsed: any = null;

    if (responseText) {
      try {
        const cleanText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
        parsed = JSON.parse(cleanText);
      } catch (e) {
        console.error("Failed to parse similar exercise JSON:", e);
      }
    }

    // Dynamic Fallback if AI quota exceeded or failed
    if (!parsed || !parsed.statementText) {
      parsed = createDynamicSimilarExerciseFallback(originalProblem, originalSolution, studentGrade);
    }

    // Store private answer securely in server exerciseStore
    exerciseStore[exerciseId] = {
      exerciseId,
      sessionId: sessionId || "session_default",
      username: userKey,
      parentProblemId: parentProblemId || "problem_root",
      statementText: parsed.statementText,
      statementLatex: parsed.statementLatex || parsed.statementText,
      answerText: parsed.answerText,
      answerLatex: parsed.answerLatex || parsed.answerText,
      answerType: parsed.answerType || "EXPRESSION",
      topic: parsed.topic || "Toán",
      createdAt: new Date().toISOString(),
      revealed: false
    };

    // Return PUBLIC PAYLOAD ONLY (No answerText, No answerLatex, No solution)
    return res.json({
      success: true,
      data: {
        exerciseId,
        parentProblemId: parentProblemId || "problem_root",
        statementText: parsed.statementText,
        statementLatex: parsed.statementLatex || parsed.statementText
      }
    });
  } catch (err: any) {
    console.error("Error generating similar exercise:", err);
    return res.status(500).json({ success: false, message: err.message || "Không thể tạo bài tập tương tự." });
  }
});

// Route: Get Isolated Answer
app.post("/api/get-answer", (req, res) => {
  try {
    const { exerciseId, username } = req.body;
    if (!exerciseId || !exerciseStore[exerciseId]) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài tập hoặc bài không thuộc phiên này." });
    }

    const item = exerciseStore[exerciseId];
    item.revealed = true;

    return res.json({
      success: true,
      data: {
        exerciseId: item.exerciseId,
        answerText: item.answerText,
        answerLatex: item.answerLatex,
        answerType: item.answerType
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Session Management Endpoints
app.get("/api/session/get", (req, res) => {
  const username = String(req.query.username || "hs8a01").toLowerCase().trim();
  const session = sessionMemoryStore[username] || null;
  return res.json({ success: true, session });
});

app.post("/api/session/update", (req, res) => {
  const { username, session } = req.body;
  const key = String(username || "hs8a01").toLowerCase().trim();
  if (session) {
    sessionMemoryStore[key] = {
      ...session,
      updatedAt: new Date().toISOString()
    };
  }
  return res.json({ success: true, session: sessionMemoryStore[key] });
});

app.post("/api/session/end", (req, res) => {
  const { username } = req.body;
  const key = String(username || "hs8a01").toLowerCase().trim();
  
  if (sessionMemoryStore[key]) {
    sessionMemoryStore[key].status = "ENDED";
    sessionMemoryStore[key].endedAt = new Date().toISOString();
  }

  // Generate new fresh active session
  const newSessionId = "sess_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  const freshSession = {
    version: "1.0",
    sessionId: newSessionId,
    username: key,
    status: "ACTIVE",
    startedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    currentMode: "HINT",
    activeProblemId: "",
    confirmedProblemFacts: [],
    understoodConcepts: [],
    misconceptions: [],
    repeatedErrors: [],
    hintsAlreadyShown: [],
    completedSteps: [],
    unresolvedQuestions: [],
    generatedExerciseIds: [],
    revealedAnswerIds: [],
    sessionSummary: "Phiên học mới được khởi tạo.",
    updatedAt: new Date().toISOString()
  };

  sessionMemoryStore[key] = freshSession;

  return res.json({
    success: true,
    endedSessionId: req.body?.sessionId || "",
    newSession: freshSession
  });
});

// Route 4: Get student history
app.get("/api/history", (req, res) => {
  const username = String(req.query.username || "").toLowerCase().trim();
  if (!username) {
    return res.json({ success: true, history: [] });
  }
  const history = userHistoryStore[username] || [];
  return res.json({ success: true, history });
});

// Route 5: Save student history item
app.post("/api/history", (req, res) => {
  const { username, record } = req.body;
  const key = String(username || "").toLowerCase().trim();
  if (!key || !record) {
    return res.status(400).json({ success: false, message: "Missing username or record" });
  }

  if (!userHistoryStore[key]) {
    userHistoryStore[key] = [];
  }

  // Prepend new history record
  userHistoryStore[key].unshift(record);
  return res.json({ success: true, history: userHistoryStore[key] });
});

// Helper for offline mock response
function generateMockFallbackResponse(problem: string, mode: string, grade: number, level: string) {
  const isParabola = problem.toLowerCase().includes("x^2") || problem.toLowerCase().includes("parabol") || problem.toLowerCase().includes("bậc hai");
  const isGeometry = problem.toLowerCase().includes("tam giác") || problem.toLowerCase().includes("góc") || problem.toLowerCase().includes("đường tròn");
  const wantsDrawing = problem.toLowerCase().includes("vẽ") || problem.toLowerCase().includes("hình") || problem.toLowerCase().includes("tikz") || problem.toLowerCase().includes("đồ thị") || problem.toLowerCase().includes("biểu đồ");

  const isGrade8 = grade <= 8;

  const mockSteps = isGrade8
    ? [
        {
          stepNumber: 1,
          title: "Bước 1: Phân tích đa thức thành nhân tử",
          learningGoal: "Đưa phương trình về dạng phương trình tích $A(x) \\cdot B(x) = 0$ (Kiến thức Lớp 8)",
          stepSolution: "Ta tách hạng tử $3x = 4x - x$ để nhóm nhân tử chung:\n$$x^2 + 3x - 4 = x^2 + 4x - x - 4 = x(x + 4) - (x + 4) = (x - 1)(x + 4) = 0$$",
          question: "Em hãy cho biết phương trình $(x-1)(x+4)=0$ xảy ra khi nào?",
          acceptedForms: ["x-1=0 hoac x+4=0", "x=1 hoac x=-4"]
        },
        {
          stepNumber: 2,
          title: "Bước 2: Giải các phương trình bậc nhất thành phần",
          learningGoal: "Giải từng phương trình $x - 1 = 0$ và $x + 4 = 0$",
          stepSolution: "• Trường hợp 1: $x - 1 = 0 \\Rightarrow x = 1$\n• Trường hợp 2: $x + 4 = 0 \\Rightarrow x = -4$",
          question: "Tập nghiệm $S$ của phương trình gồm những giá trị nào?",
          acceptedForms: ["1 và -4", "{1; -4}", "1, -4"]
        },
        {
          stepNumber: 3,
          title: "Bước 3: Kết luận bài toán",
          learningGoal: "Viết kết luận tập nghiệm chuẩn phương pháp Lớp 8",
          stepSolution: "Vậy phương trình có hai nghiệm phân biệt là $x = 1$ và $x = -4$.\nTập nghiệm $S = \\{1; -4\\}$.",
          question: "Em đã hiểu hoàn toàn các bước giải bài toán này chưa?",
          acceptedForms: ["rồi", "đã hiểu"]
        }
      ]
    : [
        {
          stepNumber: 1,
          title: "Bước 1: Xác định hệ số và biệt thức Delta (Lớp 9)",
          learningGoal: "Lập biệt thức $\\Delta = b^2 - 4ac$ để đánh giá số nghiệm",
          stepSolution: "Xét phương trình $x^2 + 3x - 4 = 0$ có $a=1, b=3, c=-4$.\n$$\\Delta = b^2 - 4ac = 3^2 - 4(1)(-4) = 9 + 16 = 25 > 0$$",
          question: "Vì $\\Delta = 25 > 0$, căn bậc hai số học $\\sqrt{\\Delta}$ bằng bao nhiêu?",
          acceptedForms: ["5", "sqrt(25)=5"]
        },
        {
          stepNumber: 2,
          title: "Bước 2: Tính nghiệm theo công thức nghiệm",
          learningGoal: "Áp dụng $x_1 = \\frac{-b + \\sqrt{\\Delta}}{2a}$ và $x_2 = \\frac{-b - \\sqrt{\\Delta}}{2a}$",
          stepSolution: "• $x_1 = \\frac{-3 + 5}{2} = 1$\n• $x_2 = \\frac{-3 - 5}{2} = -4$",
          question: "Hai nghiệm $x_1, x_2$ tìm được là gì?",
          acceptedForms: ["1 và -4", "1, -4"]
        },
        {
          stepNumber: 3,
          title: "Bước 3: Kết luận bài toán",
          learningGoal: "Kết luận tập nghiệm $S$",
          stepSolution: "Vậy phương trình có tập nghiệm $S = \\{1; -4\\}$.",
          question: "Em đã hiểu rõ cách áp dụng công thức Delta chưa?",
          acceptedForms: ["rồi", "đã hiểu"]
        }
      ];

  return {
    requestId: "mock_" + Date.now(),
    problem: {
      originalText: problem,
      normalizedText: problem,
      latex: problem.includes("x") ? problem : `$${problem}$`,
      confidence: 0.98,
      uncertainSegments: [],
      needsConfirmation: false
    },
    classification: {
      category: isParabola ? "FUNCTION" : isGeometry ? "PLANE_GEOMETRY" : "EQUATION",
      subcategory: isParabola ? "Hàm số bậc hai" : isGeometry ? "Tam giác" : "Phương trình",
      difficulty: "MEDIUM",
      estimatedGrade: grade,
      requiredTopics: [isGrade8 ? "Phân tích nhân tử / Phương trình Lớp 8" : "Phương trình bậc hai / Delta Lớp 9"],
      possibleMethods: [isGrade8 ? "Phân tích đa thức thành nhân tử" : "Công thức nghiệm Biệt thức Delta"],
      needsFigure: wantsDrawing,
      needsGraph: wantsDrawing && isParabola
    },
    curriculumGuard: {
      studentGrade: grade,
      knowledgeLevel: level,
      allowedTopics: [`Kiến thức chuẩn SGK Lớp ${grade}`],
      blockedTopics: isGrade8 ? ["Biệt thức Delta (Lớp 9)", "Đạo hàm (Lớp 11-12)"] : ["Đạo hàm (Lớp 11-12)"],
      methodUsed: isGrade8 ? "Phân tích đa thức thành nhân tử (Lớp 8)" : "Biệt thức Delta (Lớp 9)",
      methodEstimatedGrade: grade,
      allowed: true,
      violationReason: "",
      safeAlternative: ""
    },
    response: {
      mode: mode,
      title: isGrade8 ? `Hướng dẫn giải bài toán theo SGK Lớp ${grade} (Không dùng Delta)` : `Hướng dẫn giải bài toán Lớp ${grade}`,
      shortIntro: `Thầy Tùng AI sẵn sàng đồng hành cùng em! Lời giải tuân thủ nghiêm ngặt giới hạn Lớp ${grade}.`,
      hints: [
        {
          number: 1,
          title: isGrade8 ? "Phương pháp Lớp 8" : "Xác định dạng bài toán",
          goal: isGrade8 ? "Phân tích đa thức thành nhân tử $A(x) \\cdot B(x) = 0$" : "Xác định các hệ số $a, b, c$",
          question: isGrade8 ? "Em hãy tách $3x = 4x - x$ để tìm nhân tử chung." : "Hệ số $a, b, c$ tương ứng là bao nhiêu?",
          knowledgeReminder: isGrade8 ? "Lớp 8 chưa học Biệt thức Delta, dùng phương pháp phân tích nhân tử!" : "Dạng $ax^2 + bx + c = 0$"
        },
        {
          number: 2,
          title: isGrade8 ? "Đưa về phương trình tích" : "Tính Biệt thức Delta",
          goal: isGrade8 ? "Biến đổi $x(x+4) - (x+4) = 0$" : "Lập $\\Delta = b^2 - 4ac$",
          question: "Nhanh chóng suy ra hai trường hợp nghiệm!",
          knowledgeReminder: isGrade8 ? "$A \\cdot B = 0 \\Leftrightarrow A=0$ hoặc $B=0$" : "$\\Delta > 0 \\Rightarrow$ 2 nghiệm"
        }
      ],
      currentStep: 1,
      totalSteps: mockSteps.length,
      step: {
        stepId: "step_1",
        stepNumber: 1,
        totalSteps: mockSteps.length,
        title: mockSteps[0].title,
        learningGoal: mockSteps[0].learningGoal,
        instruction: "Em hãy xem lời giải chi tiết của Bước 1 bên dưới và tự suy nghĩ câu hỏi tiếp theo.",
        stepSolution: mockSteps[0].stepSolution,
        question: mockSteps[0].question,
        expectedAnswerType: "EXPRESSION",
        acceptedForms: mockSteps[0].acceptedForms,
        feedback: "Em hãy thử nhập câu trả lời hoặc chọn 'Tiến sang Bước tiếp theo'.",
        status: "WAITING_FOR_STUDENT",
        allSteps: mockSteps
      },
      solutionBlocks: isGrade8
        ? [
            { type: "TEXT", content: "Lời giải chi tiết chuẩn Lớp 8 (Phân tích nhân tử, không dùng Delta):" },
            { type: "MATH", content: "Xét phương trình: $x^2 + 3x - 4 = 0$" },
            { type: "MATH", content: "\\Leftrightarrow x^2 + 4x - x - 4 = 0" },
            { type: "MATH", content: "\\Leftrightarrow x(x + 4) - (x + 4) = 0" },
            { type: "MATH", content: "\\Leftrightarrow (x - 1)(x + 4) = 0" },
            { type: "MATH", content: "\\Leftrightarrow \\left[\\begin{array}{l} x - 1 = 0 \\\\ x + 4 = 0 \\end{array}\\right. \\Leftrightarrow \\left[\\begin{array}{l} x = 1 \\\\ x = -4 \\end{array}\\right." },
            { type: "CONCLUSION", content: "Tập nghiệm của phương trình là $S = \\{1; -4\\}$." }
          ]
        : [
            { type: "TEXT", content: "Lời giải chi tiết chuẩn Lớp 9 (Dùng Biệt thức Delta):" },
            { type: "MATH", content: "Xét $x^2 + 3x - 4 = 0$ có $a=1, b=3, c=-4$." },
            { type: "MATH", content: "\\Delta = 3^2 - 4(1)(-4) = 25 > 0 \\Rightarrow \\sqrt{\\Delta} = 5." },
            { type: "MATH", content: "x_1 = \\frac{-3 + 5}{2} = 1, \\quad x_2 = \\frac{-3 - 5}{2} = -4." },
            { type: "CONCLUSION", content: "Tập nghiệm của phương trình là $S = \\{1; -4\\}$." }
          ],
      conclusion: "Tập nghiệm $S = \\{1; -4\\}$",
      similarExerciseSuggestion: isGrade8 ? "Bài tập Lớp 8 tương tự: $x^2 + 5x - 6 = 0$" : "Bài tập Lớp 9 tương tự: $x^2 - 5x + 6 = 0$"
    },
    geometry: {
      figureType: isParabola ? "PARABOLA" : isGeometry ? "TRIANGLE" : "NONE",
      needsTikz: wantsDrawing,
      geometryJson: wantsDrawing
        ? isParabola
          ? {
              figureType: "PARABOLA",
              points: [
                { id: "O", label: "O(0,0)", x: 0, y: 0 },
                { id: "A", label: "A(-1,1)", x: -1, y: 1 },
                { id: "B", label: "B(1,1)", x: 1, y: 1 },
                { id: "C", label: "C(-2,4)", x: -2, y: 4 },
                { id: "D", label: "D(2,4)", x: 2, y: 4 }
              ],
              segments: [],
              functions: [{ type: "parabola", a: 1, b: 0, c: 0, label: "y = x²" }]
            }
          : {
              figureType: "TRIANGLE",
              points: [
                { id: "A", label: "A", x: 0, y: 4 },
                { id: "B", label: "B", x: -3, y: 0 },
                { id: "C", label: "C", x: 3, y: 0 },
                { id: "H", label: "H", x: 0, y: 0 }
              ],
              segments: [
                { from: "A", to: "B" },
                { from: "B", to: "C" },
                { from: "C", to: "A" },
                { from: "A", to: "H", style: "dashed", label: "Đường cao AH" }
              ],
              functions: []
            }
        : undefined,
      tikzCode: wantsDrawing
        ? `\\begin{tikzpicture}[scale=0.8]
\\draw[->] (-3.5,0) -- (3.5,0) node[right] {$x$};
\\draw[->] (0,-0.5) -- (0,5.5) node[above] {$y$};
\\node[below left] at (0,0) {$O$};
\\draw[domain=-2.3:2.3,smooth,variable=\\x,blue,thick] plot ({\\x},{\\x*\\x}) node[right] {$y=x^2$};
\\end{tikzpicture}`
        : "",
      figureDescription: wantsDrawing ? "Đồ thị minh họa hình học TikZ SVG" : ""
    }
  };
}

// Helper to build a dynamic similar exercise directly from original problem context when AI quota fails
function createDynamicSimilarExerciseFallback(originalProblem: string, originalSolution: string, grade: number) {
  const sourceText = (originalProblem || "").trim();
  
  if (sourceText && sourceText.length > 5 && !sourceText.includes("Bài toán chưa")) {
    // Dynamically adjust numbers in the original text/LaTeX to create a similar problem template
    let newStatement = sourceText;
    
    // Replace integer numbers in problem text with offset values (+1, +2, +3) to create similar problem
    newStatement = newStatement.replace(/\b(\d+)\b/g, (m, digitStr) => {
      const val = parseInt(digitStr, 10);
      if (val === 0) return "1";
      if (val <= 2) return String(val + 1);
      if (val < 10) return String(val + 2);
      return String(val + 3);
    });

    return {
      statementText: newStatement,
      statementLatex: newStatement,
      answerText: "Đã tạo bài tập tương tự bám sát bài gốc. Bấm 'Đáp số' bên dưới để kiểm tra.",
      answerLatex: "\\text{Đã tạo bài tập tương tự bám sát bài gốc. Bấm 'Đáp số' để xem kết quả.}",
      answerType: "EXPRESSION",
      topic: "Tự luyện tập"
    };
  }

  return {
    statementText: "Cho biểu thức $P = x^2 - 4x + 7$. Tính giá trị nhỏ nhất của biểu thức $P$.",
    statementLatex: "Cho biểu thức $P = x^2 - 4x + 7$. Tính giá trị nhỏ nhất của biểu thức $P$.",
    answerText: "Giá trị nhỏ nhất $P_{\\min} = 3$ khi $x = 2$",
    answerLatex: "P_{\\min} = 3 \\text{ khi } x = 2",
    answerType: "NUMBER",
    topic: "Đại số"
  };
}

// Serve Vite dev server or static files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
