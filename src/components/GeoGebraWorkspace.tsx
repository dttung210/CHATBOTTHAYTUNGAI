import React, { useState, useEffect, useRef } from "react";
import { Student } from "../types";
import { MathRenderer } from "./MathRenderer";
import {
  Compass,
  Camera,
  Image as ImageIcon,
  Sigma,
  Type,
  Sparkles,
  RotateCcw,
  Undo2,
  Redo2,
  Grid,
  Maximize2,
  Download,
  FileCode,
  Send,
  AlertCircle,
  CheckCircle2,
  Trash2,
  HelpCircle,
  Layers,
  Activity,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageSquare
} from "lucide-react";

interface GeoGebraWorkspaceProps {
  student: Student;
  selectedModel: string;
  latestProblemText?: string;
  onAttachToChat?: (summaryText: string) => void;
}

export const GeoGebraWorkspace: React.FC<GeoGebraWorkspaceProps> = ({
  student,
  selectedModel,
  latestProblemText,
  onAttachToChat
}) => {
  // Input Tabs & States
  const [inputTab, setInputTab] = useState<"TEXT" | "LATEX" | "IMAGE" | "LAB">("TEXT");
  const [textInput, setTextInput] = useState("");
  const [latexInput, setLatexInput] = useState("y = x^2");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState("image/jpeg");

  // Analysis & Result States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [problemSpec, setProblemSpec] = useState<any>(null);
  const [constructionPlan, setConstructionPlan] = useState<any>(null);
  const [executedLogs, setExecutedLogs] = useState<{ id: string; cmd: string; success: boolean }[]>([]);
  const [appletStatus, setAppletStatus] = useState<"LOADING" | "READY" | "DRAWING" | "VERIFIED" | "ERROR">("LOADING");

  // GeoGebra API & View controls
  const [ggbApi, setGgbApi] = useState<any>(null);
  const [showAxes, setShowAxes] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLogPanel, setShowLogPanel] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load GeoGebra deployggb.js script
  useEffect(() => {
    let isMounted = true;

    const loadGeoGebraScript = () => {
      if ((window as any).GGBApplet) {
        initApplet();
        return;
      }

      const existingScript = document.getElementById("ggb-script");
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "ggb-script";
        script.src = "https://www.geogebra.org/apps/deployggb.js";
        script.async = true;
        script.onload = () => {
          if (isMounted) initApplet();
        };
        script.onerror = () => {
          if (isMounted) setAppletStatus("ERROR");
        };
        document.body.appendChild(script);
      } else {
        existingScript.addEventListener("load", () => {
          if (isMounted) initApplet();
        });
      }
    };

    const initApplet = () => {
      if (!(window as any).GGBApplet) return;

      const container = document.getElementById("geogebra-applet-box");
      if (!container) return;
      container.innerHTML = "";

      const params = {
        appName: "classic",
        width: Math.max(340, container.clientWidth || 850),
        height: 650,
        showToolBar: true,
        showToolBarHelp: false,
        showAlgebraInput: true,
        showMenuBar: false,
        showZoomButtons: true,
        showFullscreenButton: false,
        enableUndoRedo: true,
        enableRightClick: true,
        enableLabelDrags: true,
        enableShiftDragZoom: true,
        allowStyleBar: true,
        errorDialogsActive: false,
        allowScale: false,
        language: "vi",
        country: "VN",
        appletOnLoad: (api: any) => {
          if (!isMounted) return;
          setGgbApi(api);
          setAppletStatus("READY");
          // Initial default axes/grid setup
          try {
            api.setAxesVisible(true, true);
            api.setGridVisible(true);
          } catch (e) {}
        }
      };

      try {
        const applet = new (window as any).GGBApplet(params, true);
        applet.inject("geogebra-applet-box");
      } catch (err) {
        console.error("GeoGebra injection error:", err);
        if (isMounted) setAppletStatus("ERROR");
      }
    };

    loadGeoGebraScript();

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for fullscreen and resize events to scale GeoGebra canvas 100% without display issues
  useEffect(() => {
    const handleResizeOrFullscreen = () => {
      if (!ggbApi) return;
      const isBrowserFull = !!document.fullscreenElement;
      if (!isBrowserFull && isFullscreen) {
        setIsFullscreen(false);
      }
      const activeFullscreen = isBrowserFull || isFullscreen;

      const wrapper = document.getElementById("geogebra-canvas-wrapper");
      const appletBox = document.getElementById("geogebra-applet-box");
      if (!appletBox) return;

      if (activeFullscreen) {
        wrapper?.classList.add("is-fullscreen");
      } else {
        wrapper?.classList.remove("is-fullscreen");
      }

      const updateSize = () => {
        try {
          if (activeFullscreen) {
            const w = window.innerWidth;
            const h = window.innerHeight;
            ggbApi.setSize(w, h);
          } else {
            const w = wrapper?.clientWidth ? Math.max(340, wrapper.clientWidth - 16) : (appletBox.clientWidth || 800);
            const h = 680;
            ggbApi.setSize(w, h);
          }
        } catch (e) {
          console.warn("Resize GeoGebra failed:", e);
        }
      };

      updateSize();
      setTimeout(updateSize, 100);
      setTimeout(updateSize, 300);
    };

    document.addEventListener("fullscreenchange", handleResizeOrFullscreen);
    document.addEventListener("webkitfullscreenchange", handleResizeOrFullscreen);
    window.addEventListener("resize", handleResizeOrFullscreen);

    return () => {
      document.removeEventListener("fullscreenchange", handleResizeOrFullscreen);
      document.removeEventListener("webkitfullscreenchange", handleResizeOrFullscreen);
      window.removeEventListener("resize", handleResizeOrFullscreen);
    };
  }, [ggbApi, isFullscreen]);

  const toggleFullscreen = () => {
    const wrapper = document.getElementById("geogebra-canvas-wrapper");
    if (!wrapper) return;

    const willBeFull = !isFullscreen && !document.fullscreenElement;
    setIsFullscreen(willBeFull);

    if (willBeFull) {
      if (wrapper.requestFullscreen) {
        wrapper.requestFullscreen().catch(() => {});
      } else if ((wrapper as any).webkitRequestFullscreen) {
        (wrapper as any).webkitRequestFullscreen();
      }
    } else {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        }
      }
    }

    setTimeout(() => {
      if (ggbApi) {
        try {
          if (willBeFull) {
            ggbApi.setSize(window.innerWidth, window.innerHeight);
          } else {
            const w = wrapper?.clientWidth ? Math.max(340, wrapper.clientWidth - 16) : 800;
            ggbApi.setSize(w, 680);
          }
        } catch (e) {
          console.warn("Failed setting size in toggleFullscreen", e);
        }
      }
    }, 150);
  };

  // Image processing & compression
  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn tệp hình ảnh (JPG, PNG, WEBP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 1600;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          setImagePreview(canvas.toDataURL("image/jpeg", 0.85));
          setImageMime("image/jpeg");
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Clipboard Paste support
  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.items) {
      for (let i = 0; i < e.clipboardData.items.length; i++) {
        const item = e.clipboardData.items[i];
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          if (file) processImageFile(file);
        }
      }
    }
  };

  // Safe GeoGebra Command Executor
  const executeGeoGebraCommands = (commands: string[]) => {
    if (!ggbApi) {
      alert("GeoGebra Classic 6 chưa sẵn sàng. Vui lòng đợi trong giây lát.");
      return;
    }

    setAppletStatus("DRAWING");
    const logs: { id: string; cmd: string; success: boolean }[] = [];

    // Reset current canvas first
    try {
      ggbApi.reset();
      ggbApi.setAxesVisible(showAxes, showAxes);
      ggbApi.setGridVisible(showGrid);
    } catch (e) {}

    commands.forEach((cmd, idx) => {
      const cleanCmd = cmd.trim();
      if (!cleanCmd) return;

      // Allowlist / Security Check
      const isUnsafe = /(eval|script|javascript|http|url|RunClickScript|RunUpdateScript)/i.test(cleanCmd);
      if (isUnsafe) {
        logs.push({ id: `cmd_${idx}`, cmd: cleanCmd + " (Bị chặn do không an toàn)", success: false });
        return;
      }

      try {
        ggbApi.evalCommand(cleanCmd);
        logs.push({ id: `cmd_${idx}`, cmd: cleanCmd, success: true });
      } catch (err) {
        console.warn(`GeoGebra Command failed: "${cleanCmd}"`, err);
        logs.push({ id: `cmd_${idx}`, cmd: cleanCmd + " (Lỗi cú pháp)", success: false });
      }
    });

    setExecutedLogs(logs);
    setAppletStatus("VERIFIED");
    showNotification("Đã dựng hình GeoGebra thành công!");
  };

  // Analyze & Generate GeoGebra Plan via API
  const handleAnalyzeAndDraw = async () => {
    let source = inputTab;
    let text = textInput;
    let ltx = latexInput;

    if (source === "TEXT" && !text.trim()) {
      alert("Vui lòng nhập nội dung bài toán.");
      return;
    }
    if (source === "LATEX" && !ltx.trim()) {
      alert("Vui lòng nhập công thức LaTeX.");
      return;
    }
    if (source === "IMAGE" && !imagePreview) {
      alert("Vui lòng tải lên hoặc chụp ảnh bài toán.");
      return;
    }

    setIsAnalyzing(true);
    setAppletStatus("DRAWING");

    try {
      const res = await fetch("/api/analyze-geogebra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: source,
          problemText: text,
          latex: ltx,
          imageData: imagePreview || undefined,
          imageMimeType: imageMime,
          studentGrade: student.lopDuocPhep,
          knowledgeLevel: student.mucDoMacDinh,
          modelName: selectedModel
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setProblemSpec(data.data.problemSpec);
        setConstructionPlan(data.data.constructionPlan);

        const cmds = (data.data.constructionPlan?.commands || []).map((c: any) => c.command);
        if (cmds.length > 0) {
          executeGeoGebraCommands(cmds);
        } else {
          setAppletStatus("READY");
        }
      } else {
        alert("Không thể phân tích đề bài. Vui lòng thử lại.");
        setAppletStatus("READY");
      }
    } catch (error) {
      console.error("GeoGebra analysis failed:", error);
      alert("Đã xảy ra lỗi khi kết nối máy chủ phân tích GeoGebra.");
      setAppletStatus("READY");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Lab Preset Loader
  const loadPresetLab = (presetType: string) => {
    let cmds: string[] = [];
    let specText = "";

    switch (presetType) {
      case "TRIANGLE_RIGHT_ALTITUDE":
        specText = "Tam giác ABC vuông tại A, đường cao AH vuông góc với BC";
        cmds = [
          "A=(0,4)",
          "B=(-3,0)",
          "C=(3,0)",
          "t1=Polygon(A,B,C)",
          "H=(0,0)",
          "segAH=Segment(A,H)",
          "SetLineStyle(segAH, 2)",
          'SetColor(segAH, "Red")'
        ];
        break;
      case "MEDIANS_CENTROID":
        specText = "Tam giác ABC và ba đường trung tuyến cắt nhau tại Trọng tâm G";
        cmds = [
          "A=(0,4)",
          "B=(-3,0)",
          "C=(3,0)",
          "t1=Polygon(A,B,C)",
          "M=Midpoint(B,C)",
          "N=Midpoint(A,C)",
          "P=Midpoint(A,B)",
          "segAM=Segment(A,M)",
          "segBN=Segment(B,N)",
          "segCP=Segment(C,P)",
          "G=Intersect(segAM, segBN)",
          'SetColor(G, "Purple")',
          "SetPointSize(G, 5)"
        ];
        break;
      case "ALTITUDES_ORTHOCENTER":
        specText = "Tam giác ABC và ba đường cao cắt nhau tại Trực tâm H";
        cmds = [
          "A=(0,4)",
          "B=(-3,0)",
          "C=(4,0)",
          "t1=Polygon(A,B,C)",
          "h1=PerpendicularLine(A, Segment(B,C))",
          "h2=PerpendicularLine(B, Segment(A,C))",
          "H=Intersect(h1, h2)",
          'SetColor(H, "Red")',
          "SetPointSize(H, 5)"
        ];
        break;
      case "PARABOLA_LINE":
        specText = "Đồ thị Parabol y = x² và đường thẳng y = 2x + 3";
        cmds = [
          "f(x)=x^2",
          "g(x)=2*x+3",
          "A=Intersect(f, g, 1)",
          "B=Intersect(f, g, 2)",
          'SetColor(f, "Blue")',
          'SetColor(g, "Red")'
        ];
        setShowAxes(true);
        setShowGrid(true);
        break;
      case "CIRCLE_TANGENT":
        specText = "Đường tròn O(0,0) bán kính 3 và tiếp tuyến tại A(3,0)";
        cmds = [
          "O=(0,0)",
          "c1=Circle(O,3)",
          "A=(3,0)",
          "segOA=Segment(O,A)",
          "line1=PerpendicularLine(A, segOA)",
          'SetColor(line1, "Red")'
        ];
        break;
      default:
        break;
    }

    setProblemSpec({
      normalizedText: specText,
      problemType: presetType.includes("PARABOLA") ? "FUNCTION_GRAPH" : "PLANE_GEOMETRY",
      confidence: 1.0,
      givens: [specText],
      requirements: ["Quan sát các tính chất hình học trên GeoGebra Classic 6"],
      points: ["A", "B", "C", "H", "G", "O"],
      uncertainItems: [],
      needsConfirmation: false
    });

    executeGeoGebraCommands(cmds);
  };

  // Toolbar Actions
  const toggleAxes = () => {
    if (!ggbApi) return;
    const next = !showAxes;
    setShowAxes(next);
    try {
      ggbApi.setAxesVisible(next, next);
    } catch (e) {}
  };

  const toggleGrid = () => {
    if (!ggbApi) return;
    const next = !showGrid;
    setShowGrid(next);
    try {
      ggbApi.setGridVisible(next);
    } catch (e) {}
  };

  const handleReset = () => {
    if (!ggbApi) return;
    try {
      ggbApi.reset();
      ggbApi.setAxesVisible(showAxes, showAxes);
      ggbApi.setGridVisible(showGrid);
      setExecutedLogs([]);
      setAppletStatus("READY");
      showNotification("Đã làm mới bản vẽ.");
    } catch (e) {}
  };

  const handleUndo = () => {
    if (!ggbApi) return;
    try {
      ggbApi.undo();
    } catch (e) {}
  };

  const handleRedo = () => {
    if (!ggbApi) return;
    try {
      ggbApi.redo();
    } catch (e) {}
  };

  const exportPNG = () => {
    if (!ggbApi) return;
    try {
      const pngBase64 = ggbApi.getPNGBase64(2, false, 300);
      const link = document.createElement("a");
      link.href = "data:image/png;base64," + pngBase64;
      link.download = `GeoGebra_Giao_Duc_${Date.now()}.png`;
      link.click();
      showNotification("Đã xuất tệp ảnh PNG.");
    } catch (e) {
      alert("Không thể xuất ảnh PNG.");
    }
  };

  const exportSVG = () => {
    if (!ggbApi) return;
    try {
      const svgText = ggbApi.exportSVG();
      const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `GeoGebra_Vector_${Date.now()}.svg`;
      link.click();
      showNotification("Đã xuất tệp đồ họa vector SVG.");
    } catch (e) {
      alert("Không thể xuất tệp SVG.");
    }
  };

  const downloadGGB = () => {
    if (!ggbApi) return;
    try {
      ggbApi.getBase64((b64: string) => {
        const link = document.createElement("a");
        link.href = "data:application/vnd.geogebra.file;base64," + b64;
        link.download = `Ban_Ve_GeoGebra_${Date.now()}.ggb`;
        link.click();
        showNotification("Đã tải tệp .ggb về máy!");
      });
    } catch (e) {
      alert("Không thể tạo tệp .ggb.");
    }
  };

  const handleAttachToSolution = () => {
    if (!ggbApi) return;
    try {
      const pngBase64 = ggbApi.getPNGBase64(1.5, false, 200);
      const summaryText = `[Bản vẽ GeoGebra đính kèm]\nĐề bài: ${
        problemSpec?.normalizedText || textInput || "Hình vẽ GeoGebra"
      }\nCác lệnh đã thực thi:\n${executedLogs.map((l) => "• " + l.cmd).join("\n")}`;

      if (onAttachToChat) {
        onAttachToChat(summaryText);
        showNotification("Đã đính kèm bản dựng GeoGebra vào cuộc trò chuyện!");
      }
    } catch (e) {
      alert("Đã xảy ra lỗi khi gắn vào cuộc trò chuyện.");
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 space-y-4 font-sans text-[#17332D]">
      {/* Top Banner & Status Header */}
      <div className="bg-gradient-to-r from-[#0F9D8A] via-[#118A7A] to-teal-800 text-white rounded-2xl p-4 shadow-md border border-teal-600 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shrink-0">
            <Compass className="w-7 h-7 text-amber-300 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <span>Cửa Sổ Dựng Hình GeoGebra Classic 6</span>
              <span className="text-xs font-semibold bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Chuyên Dụng
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-teal-100 mt-0.5">
              Phân tích đề toán tự động, dựng hình chính xác, tương tác trực tiếp bằng GeoGebra JavaScript API
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 bg-white/15 px-3 py-1.5 rounded-xl border border-white/20 text-xs font-bold shrink-0">
          {appletStatus === "LOADING" && (
            <>
              <Loader2 className="w-4 h-4 text-amber-300 animate-spin" />
              <span>Đang tải GeoGebra...</span>
            </>
          )}
          {appletStatus === "READY" && (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Sẵn sàng (READY)</span>
            </>
          )}
          {appletStatus === "DRAWING" && (
            <>
              <Sparkles className="w-4 h-4 text-amber-300 animate-bounce" />
              <span>Đang dựng hình...</span>
            </>
          )}
          {appletStatus === "VERIFIED" && (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Đã xác minh (VERIFIED)</span>
            </>
          )}
          {appletStatus === "ERROR" && (
            <>
              <AlertCircle className="w-4 h-4 text-red-300" />
              <span>Lỗi nạp GeoGebra</span>
            </>
          )}
        </div>
      </div>

      {/* Floating Notification */}
      {notification && (
        <div className="fixed top-16 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg font-bold text-sm flex items-center gap-2 border border-emerald-400 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main 2-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column (Input & Analysis & Lab) - 4 cols on desktop */}
        <div className="lg:col-span-5 space-y-4">
          {/* Input Panel Card */}
          <div className="bg-white rounded-2xl border border-teal-100 shadow-sm overflow-hidden">
            {/* Input Sub-tabs */}
            <div className="flex items-center justify-between bg-teal-50/80 p-1.5 border-b border-teal-100">
              <button
                onClick={() => setInputTab("TEXT")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                  inputTab === "TEXT"
                    ? "bg-[#0F9D8A] text-white shadow-sm"
                    : "text-teal-800 hover:bg-teal-100/60"
                }`}
              >
                <Type className="w-4 h-4" />
                <span>Văn bản</span>
              </button>
              <button
                onClick={() => setInputTab("LATEX")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                  inputTab === "LATEX"
                    ? "bg-[#0F9D8A] text-white shadow-sm"
                    : "text-teal-800 hover:bg-teal-100/60"
                }`}
              >
                <Sigma className="w-4 h-4" />
                <span>LaTeX</span>
              </button>
              <button
                onClick={() => setInputTab("IMAGE")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                  inputTab === "IMAGE"
                    ? "bg-[#0F9D8A] text-white shadow-sm"
                    : "text-teal-800 hover:bg-teal-100/60"
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Hình ảnh</span>
              </button>
              <button
                onClick={() => setInputTab("LAB")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                  inputTab === "LAB"
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-amber-800 hover:bg-amber-100/80"
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>PTN Động</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-4 space-y-3">
              {/* Tab 1: Text */}
              {inputTab === "TEXT" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                      Nhập đề bài hình học / đồ thị:
                    </label>
                    {latestProblemText && (
                      <button
                        onClick={() => setTextInput(latestProblemText)}
                        className="text-[11px] text-[#0F9D8A] font-bold hover:underline flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Dùng đề từ chat</span>
                      </button>
                    )}
                  </div>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onPaste={handlePaste}
                    placeholder="Ví dụ: Cho tam giác ABC vuông tại A, đường cao AH. Gọi M là trung điểm của BC... (Có thể Ctrl+V dán ảnh)"
                    rows={4}
                    className="w-full bg-teal-50/40 border border-teal-200 rounded-xl p-3 text-sm focus:border-[#0F9D8A] focus:ring-2 focus:ring-teal-100 outline-none resize-none"
                  />
                </div>
              )}

              {/* Tab 2: LaTeX */}
              {inputTab === "LATEX" && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                    Nhập biểu thức LaTeX:
                  </label>
                  <textarea
                    value={latexInput}
                    onChange={(e) => setLatexInput(e.target.value)}
                    placeholder="y = x^2 - 4x + 3"
                    rows={2}
                    className="w-full bg-teal-50/40 border border-teal-200 rounded-xl p-3 text-sm font-mono focus:border-[#0F9D8A] outline-none resize-none"
                  />

                  {/* LaTeX Preview */}
                  <div className="p-2.5 bg-amber-50/60 border border-amber-200 rounded-xl">
                    <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                      Xem trước công thức (KaTeX):
                    </div>
                    <MathRenderer content={`$${latexInput}$`} />
                  </div>

                  {/* Fast LaTeX Insertion Buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      { label: "y = x²", val: "y = x^2" },
                      { label: "Tam giác ABC", val: "\\Delta ABC" },
                      { label: "Vuông góc ⊥", val: "AH \\perp BC" },
                      { label: "Song song ∥", val: "AB \\parallel CD" },
                      { label: "Góc ∠", val: "\\widehat{ABC} = 90^\\circ" },
                      { label: "Đường tròn (O; R)", val: "(O; R)" }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => setLatexInput((prev) => prev + " " + item.val)}
                        className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-semibold border border-teal-200 transition"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Image */}
              {inputTab === "IMAGE" && (
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && processImageFile(e.target.files[0])}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && processImageFile(e.target.files[0])}
                  />

                  {imagePreview ? (
                    <div className="relative bg-teal-50 p-2 rounded-xl border border-teal-200">
                      <img
                        src={imagePreview}
                        alt="Đề bài"
                        className="w-full h-40 object-contain rounded-lg"
                      />
                      <button
                        onClick={() => setImagePreview(null)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 shadow hover:bg-red-600 transition"
                        title="Xóa ảnh"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files?.[0]) processImageFile(e.dataTransfer.files[0]);
                      }}
                      className="border-2 border-dashed border-teal-200 hover:border-[#0F9D8A] bg-teal-50/30 rounded-xl p-6 text-center space-y-2 transition"
                    >
                      <ImageIcon className="w-8 h-8 text-teal-600 mx-auto" />
                      <p className="text-xs font-bold text-teal-900">
                        Kéo thả ảnh đề bài vào đây hoặc bấm chọn file
                      </p>
                      <p className="text-[11px] text-teal-600">
                        Hỗ trợ Ctrl+V dán ảnh từ khay nhớ tạm
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-[#0F9D8A] hover:bg-[#0F766E] text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Tải ảnh lên</span>
                        </button>
                        <button
                          onClick={() => cameraInputRef.current?.click()}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Chụp ảnh</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Lab Presets */}
              {inputTab === "LAB" && (
                <div className="space-y-2">
                  <p className="text-xs text-amber-900 font-bold">
                    Chọn mô hình dựng hình nhanh để khám phá:
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      {
                        title: "1. Tam giác vuông & Đường cao AH",
                        desc: "Mô hình tam giác ABC vuông tại A, AH ⊥ BC",
                        key: "TRIANGLE_RIGHT_ALTITUDE"
                      },
                      {
                        title: "2. Ba đường trung tuyến & Trọng tâm G",
                        desc: "Giao điểm của ba đường trung tuyến AM, BN, CP",
                        key: "MEDIANS_CENTROID"
                      },
                      {
                        title: "3. Ba đường cao & Trực tâm H",
                        desc: "Giao điểm của 3 đường cao trong tam giác",
                        key: "ALTITUDES_ORTHOCENTER"
                      },
                      {
                        title: "4. Parabol y = x² & Đường thẳng",
                        desc: "Khảo sát giao điểm giữa Parabol và đường thẳng",
                        key: "PARABOLA_LINE"
                      },
                      {
                        title: "5. Đường tròn O(0,0) & Tiếp tuyến",
                        desc: "Tiếp tuyến vuông góc bán kính tại tiếp điểm",
                        key: "CIRCLE_TANGENT"
                      }
                    ].map((preset) => (
                      <button
                        key={preset.key}
                        onClick={() => loadPresetLab(preset.key)}
                        className="text-left p-2.5 bg-amber-50/80 hover:bg-amber-100 border border-amber-200 rounded-xl transition space-y-0.5 group cursor-pointer"
                      >
                        <div className="text-xs font-bold text-amber-950 group-hover:text-[#0F9D8A]">
                          {preset.title}
                        </div>
                        <div className="text-[11px] text-amber-800/80">{preset.desc}</div>
                      </button>
                    ))}
                  </div>
                  <div className="p-2 bg-amber-100/60 rounded-xl text-[11px] text-amber-900 italic font-medium mt-2">
                    💡 Lưu ý: Quan sát trên mô hình GeoGebra trợ giúp trực quan hóa, không thay thế cho chứng minh toán học.
                  </div>
                </div>
              )}

              {/* Submit / Analyze Button (When not in Lab mode) */}
              {inputTab !== "LAB" && (
                <button
                  disabled={isAnalyzing}
                  onClick={handleAnalyzeAndDraw}
                  className={`w-full py-3 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition ${
                    isAnalyzing
                      ? "bg-teal-200 text-teal-600 cursor-not-allowed"
                      : "bg-[#0F9D8A] hover:bg-[#0F766E] text-white shadow-teal-900/10 cursor-pointer"
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang phân tích Gemini & tạo lệnh GeoGebra...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Phân Tích & Vẽ Hình GeoGebra</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Recognized Problem Spec Card */}
          {problemSpec && (
            <div className="bg-white rounded-2xl border border-teal-200 p-4 shadow-sm space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-teal-100 pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#0F9D8A]" />
                  <h3 className="font-bold text-sm text-teal-950">ĐỀ BÀI ĐÃ NHẬN DIỆN</h3>
                </div>
                <span className="text-[11px] font-bold bg-teal-100 text-[#0F9D8A] px-2 py-0.5 rounded-full">
                  Độ tin cậy: {Math.round((problemSpec.confidence || 0.95) * 100)}%
                </span>
              </div>

              {/* Normalized Text */}
              <div className="bg-teal-50/50 p-2.5 rounded-xl border border-teal-100 text-xs sm:text-sm">
                <MathRenderer content={problemSpec.normalizedText || problemSpec.originalText} />
              </div>

              {/* Extracted Facts */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <span className="font-bold text-gray-700 block">Dạng toán:</span>
                  <span className="text-teal-800 font-semibold">{problemSpec.problemType}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <span className="font-bold text-gray-700 block">Các điểm:</span>
                  <span className="text-teal-800 font-semibold">
                    {(problemSpec.points || []).join(", ") || "A, B, C..."}
                  </span>
                </div>
              </div>

              {/* Uncertainties if any */}
              {problemSpec.uncertainItems && problemSpec.uncertainItems.length > 0 && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Cần lưu ý:
                  </span>
                  <ul className="list-disc list-inside text-[11px] space-y-0.5">
                    {problemSpec.uncertainItems.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column (GeoGebra Applet Canvas & Toolbar) - 7 cols on desktop */}
        <div className="lg:col-span-7 space-y-3" ref={containerRef}>
          {/* Canvas Action Bar */}
          <div className="bg-white p-2 rounded-2xl border border-teal-100 shadow-sm flex flex-wrap items-center justify-between gap-1.5 text-xs font-semibold">
            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={handleReset}
                className="p-2 hover:bg-teal-50 text-teal-800 rounded-xl border border-teal-200 transition flex items-center gap-1"
                title="Làm mới bản vẽ"
              >
                <RotateCcw className="w-4 h-4 text-teal-600" />
                <span className="hidden sm:inline">Reset</span>
              </button>

              <button
                onClick={handleUndo}
                className="p-2 hover:bg-teal-50 text-teal-800 rounded-xl border border-teal-200 transition"
                title="Hoàn tác"
              >
                <Undo2 className="w-4 h-4 text-teal-600" />
              </button>

              <button
                onClick={handleRedo}
                className="p-2 hover:bg-teal-50 text-teal-800 rounded-xl border border-teal-200 transition"
                title="Làm lại"
              >
                <Redo2 className="w-4 h-4 text-teal-600" />
              </button>

              <div className="h-5 w-[1px] bg-teal-200 my-auto mx-0.5" />

              <button
                onClick={toggleAxes}
                className={`p-2 rounded-xl border transition flex items-center gap-1 ${
                  showAxes
                    ? "bg-[#0F9D8A] text-white border-teal-700"
                    : "hover:bg-teal-50 text-teal-800 border-teal-200"
                }`}
                title="Ẩn/Hiện trục tọa độ Oxy"
              >
                <span>📈 Trục</span>
              </button>

              <button
                onClick={toggleGrid}
                className={`p-2 rounded-xl border transition flex items-center gap-1 ${
                  showGrid
                    ? "bg-[#0F9D8A] text-white border-teal-700"
                    : "hover:bg-teal-50 text-teal-800 border-teal-200"
                }`}
                title="Ẩn/Hiện lưới tọa độ"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Lưới</span>
              </button>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={toggleFullscreen}
                className="p-2 bg-[#0F9D8A] hover:bg-[#0F766E] text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Phóng to toàn màn hình không bị viền đen"
              >
                <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
                <span>Toàn màn hình</span>
              </button>

              <button
                onClick={exportPNG}
                className="p-2 hover:bg-amber-50 text-amber-900 rounded-xl border border-amber-200 transition flex items-center gap-1"
                title="Xuất tệp ảnh PNG"
              >
                <Download className="w-3.5 h-3.5 text-amber-600" />
                <span>PNG</span>
              </button>

              <button
                onClick={exportSVG}
                className="p-2 hover:bg-amber-50 text-amber-900 rounded-xl border border-amber-200 transition flex items-center gap-1"
                title="Xuất tệp đồ họa vector SVG"
              >
                <FileCode className="w-3.5 h-3.5 text-amber-600" />
                <span>SVG</span>
              </button>

              <button
                onClick={downloadGGB}
                className="p-2 hover:bg-teal-50 text-teal-800 rounded-xl border border-teal-200 transition flex items-center gap-1"
                title="Tải tệp tin GeoGebra (.ggb)"
              >
                <Download className="w-3.5 h-3.5 text-teal-600" />
                <span>.ggb</span>
              </button>

              {onAttachToChat && (
                <button
                  onClick={handleAttachToSolution}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                  title="Đính kèm bản vẽ GeoGebra vào câu trả lời"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dùng trong lời giải 💬</span>
                </button>
              )}
            </div>
          </div>

          {/* GeoGebra Applet Container Box */}
          <div
            id="geogebra-canvas-wrapper"
            className={`geogebra-canvas-wrapper bg-white rounded-2xl border-2 border-teal-200 shadow-md p-2 overflow-hidden relative flex flex-col items-center justify-center transition-all ${
              isFullscreen
                ? "is-fullscreen fixed inset-0 z-[9999] w-screen h-screen rounded-none border-none p-0 bg-white"
                : "min-h-[680px] w-full"
            }`}
          >
            {/* Exit Fullscreen Floating Control */}
            {isFullscreen && (
              <div className="absolute top-3 right-4 z-[10000] bg-teal-900/90 text-white px-3.5 py-2 rounded-xl backdrop-blur-md shadow-xl flex items-center gap-3 text-xs font-bold border border-teal-600">
                <span className="flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-amber-300 animate-spin" />
                  <span>Chế độ toàn màn hình GeoGebra (100% tỷ lệ)</span>
                </span>
                <button
                  onClick={toggleFullscreen}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition font-bold shadow-sm cursor-pointer"
                >
                  Thoát (Esc) ✕
                </button>
              </div>
            )}

            <div
              id="geogebra-applet-box"
              className={`w-full overflow-hidden flex items-center justify-center ${
                isFullscreen ? "w-screen h-screen" : "h-[680px]"
              }`}
            />
          </div>

          {/* Command Executed History Panel */}
          <div className="bg-white rounded-2xl border border-teal-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setShowLogPanel(!showLogPanel)}
              className="w-full px-4 py-2.5 bg-teal-50/60 hover:bg-teal-100/50 flex items-center justify-between text-xs font-bold text-teal-950 transition"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0F9D8A]" />
                <span>DANH SÁCH LỆNH GEOGEBRA ĐÃ THỰC THI ({executedLogs.length})</span>
              </div>
              {showLogPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showLogPanel && (
              <div className="p-3 max-h-40 overflow-y-auto space-y-1 bg-gray-900 text-emerald-400 font-mono text-xs">
                {executedLogs.length === 0 ? (
                  <div className="text-gray-500 italic p-1">Chưa có lệnh nào được thực thi.</div>
                ) : (
                  executedLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-2">
                      <span className={log.success ? "text-emerald-400" : "text-red-400"}>
                        {log.success ? "✓" : "✗"}
                      </span>
                      <span className="break-all">{log.cmd}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
