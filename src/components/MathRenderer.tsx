import React from "react";
import katex from "katex";

interface MathRendererProps {
  content: string;
  className?: string;
  block?: boolean;
  as?: "div" | "span";
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  className = "",
  block = false,
  as = "div"
}) => {
  // Parses a string containing $ inline math $, $$ block math $$, \( ... \), or \[ ... \]
  const renderMathContent = (text: string) => {
    if (!text) return null;

    // 1. Convert escaped literal \n and \t strings to actual whitespace
    let processedText = String(text)
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t");

    // 2. Normalize LaTeX delimiters
    processedText = processedText
      .replace(/\\\[([\s\S]+?)\\\]/g, "$$$$$1$$$$")
      .replace(/\\\(([\s\S]+?)\\\)/g, "$$$1$$");

    // 3. Auto-detect raw LaTeX math expressions that lack $ or $$ delimiters
    const hasLatexCommands = /\\(Leftrightarrow|Rightarrow|frac|sqrt|left|right|begin|end|Delta|cdot|approx|le|ge|neq|alpha|beta|theta|pi)/.test(processedText);
    const hasMathDelimiters = /\$[^\$]+\$/.test(processedText) || /\$\$[\s\S]+\$\$/.test(processedText);

    if (hasLatexCommands && !hasMathDelimiters) {
      // Process line-by-line: if a line contains LaTeX commands or equation signs, wrap it in $...$
      const lines = processedText.split("\n");
      processedText = lines
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed) return "";
          if (
            /(?:\\(?:Leftrightarrow|Rightarrow|frac|sqrt|left|right|begin|end|Delta|cdot|approx|le|ge|neq|alpha|beta|theta|pi)|[=><\+\-\*\^])/.test(
              trimmed
            )
          ) {
            return `$${trimmed}$`;
          }
          return trimmed;
        })
        .join("\n");
    }

    // Split text by $$ math $$ or $ math $
    const parts = processedText.split(/(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g);

    return parts.map((part, index) => {
      if (part.startsWith("$$") && part.endsWith("$$")) {
        const math = part.slice(2, -2).trim();
        try {
          const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
          if (as === "span") {
            return (
              <span
                key={index}
                className="my-1.5 block overflow-x-auto py-1 text-center font-serif"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          }
          return (
            <div
              key={index}
              className="my-2 overflow-x-auto py-1 text-center font-serif"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (e) {
          return <code key={index} className="text-red-500 font-mono text-xs">{part}</code>;
        }
      } else if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
        const math = part.slice(1, -1).trim();
        try {
          const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
          return (
            <span
              key={index}
              className="inline-block px-0.5 align-baseline font-serif"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (e) {
          return <code key={index} className="text-red-500 font-mono text-xs">{part}</code>;
        }
      } else {
        // Plain text with line breaks preserved
        return (
          <span key={index}>
            {part.split("\n").map((line, lIdx, arr) => (
              <React.Fragment key={lIdx}>
                {line}
                {lIdx < arr.length - 1 && <br />}
              </React.Fragment>
            ))}
          </span>
        );
      }
    });
  };

  const Component = as;

  return (
    <Component className={`leading-relaxed text-[#17332D] ${className}`}>
      {renderMathContent(content)}
    </Component>
  );
};
