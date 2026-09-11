"use client";

import Editor, {
  type OnMount,
} from "@monaco-editor/react";

import type { editor } from "monaco-editor";

import {
  useEffect,
  useRef,
} from "react";

import type {
  ReviewFile,
  ReviewFinding,
} from "@/lib/api";

interface CodeViewerProps {
  file: ReviewFile | null;
  findings?: ReviewFinding[];
  selectedFindingId?: number | null;
  onFindingSelect?: (
    finding: ReviewFinding
  ) => void;
}

function normalizeLanguage(
  language: string
): string {
  const value = language.toLowerCase();

  if (
    value.includes("typescript") ||
    value === "ts" ||
    value === "tsx"
  ) {
    return "typescript";
  }

  if (
    value.includes("javascript") ||
    value === "js" ||
    value === "jsx"
  ) {
    return "javascript";
  }

  if (
    value.includes("python") ||
    value === "py"
  ) {
    return "python";
  }

  if (value === "java" || value.includes("java")) {
    return "java";
  }

  if (value.includes("json")) {
    return "json";
  }

  if (value.includes("css")) {
    return "css";
  }

  if (
    value.includes("html") ||
    value.includes("xml")
  ) {
    return "html";
  }

  if (value.includes("sql")) {
    return "sql";
  }

  if (
    value.includes("markdown") ||
    value === "md"
  ) {
    return "markdown";
  }

  if (
    value.includes("cpp") ||
    value.includes("c++")
  ) {
    return "cpp";
  }

  if (value === "c") {
    return "c";
  }

  if (
    value.includes("csharp") ||
    value.includes("c#")
  ) {
    return "csharp";
  }

  if (
    value === "go" ||
    value.includes("golang")
  ) {
    return "go";
  }

  if (value.includes("rust")) {
    return "rust";
  }

  if (value.includes("php")) {
    return "php";
  }

  if (value.includes("ruby")) {
    return "ruby";
  }

  if (
    value.includes("shell") ||
    value.includes("bash") ||
    value === "sh"
  ) {
    return "shell";
  }

  return "plaintext";
}

function getSeverityClass(
  severity: string
): string {
  switch (severity.toLowerCase()) {
    case "critical":
      return "codeguard-critical";

    case "high":
      return "codeguard-high";

    case "medium":
      return "codeguard-medium";

    case "low":
      return "codeguard-low";

    default:
      return "codeguard-info";
  }
}

export default function CodeViewer({
  file,
  findings = [],
  selectedFindingId = null,
  onFindingSelect,
}: CodeViewerProps) {
  const editorRef =
    useRef<editor.IStandaloneCodeEditor | null>(
      null
    );

  const decorationsRef =
    useRef<string[]>([]);

  const handleEditorMount: OnMount = (
    editorInstance
  ) => {
    editorRef.current = editorInstance;
  };

  /*
   * Highlight finding lines.
   */
  useEffect(() => {
    const editorInstance =
      editorRef.current;

    if (!editorInstance) {
      return;
    }

    const model =
      editorInstance.getModel();

    if (!model) {
      return;
    }

    const decorations = findings
      .filter(
        (finding) =>
          finding.line > 0 &&
          finding.line <=
            model.getLineCount()
      )
      .map((finding) => {
        const line = finding.line;

        const className =
          getSeverityClass(
            finding.severity
          );

        const isSelected =
          finding.id ===
          selectedFindingId;

        return {
          range: {
            startLineNumber: line,
            startColumn: 1,
            endLineNumber: line,
            endColumn: 1,
          },

          options: {
            isWholeLine: true,

            className: isSelected
              ? `${className} codeguard-selected`
              : className,

            glyphMarginClassName:
              `${className}-glyph`,

            hoverMessage: {
              value:
                `**${finding.severity.toUpperCase()}** — ` +
                `${finding.title}\n\n` +
                `${finding.description}`,
            },
          },
        };
      });

    decorationsRef.current =
      editorInstance.deltaDecorations(
        decorationsRef.current,
        decorations
      );
  }, [
    findings,
    selectedFindingId,
  ]);

  /*
   * Jump to selected finding.
   */
  useEffect(() => {
    if (
      selectedFindingId === null ||
      !editorRef.current
    ) {
      return;
    }

    const finding =
      findings.find(
        (item) =>
          item.id === selectedFindingId
      );

    if (!finding) {
      return;
    }

    const editorInstance =
      editorRef.current;

    const model =
      editorInstance.getModel();

    if (!model) {
      return;
    }

    const lineNumber = Math.min(
      Math.max(finding.line, 1),
      model.getLineCount()
    );

    editorInstance.revealLineInCenter(
      lineNumber
    );

    editorInstance.setPosition({
      lineNumber,
      column: 1,
    });

    editorInstance.focus();
  }, [
    selectedFindingId,
    findings,
  ]);

  /*
   * Select finding when clicking a finding line.
   */
  const handleEditorClick = () => {
    const editorInstance =
      editorRef.current;

    if (
      !editorInstance ||
      !onFindingSelect
    ) {
      return;
    }

    const position =
      editorInstance.getPosition();

    if (!position) {
      return;
    }

    const finding =
      findings.find(
        (item) =>
          item.line ===
          position.lineNumber
      );

    if (finding) {
      onFindingSelect(finding);
    }
  };

  /*
   * No file selected.
   */
  if (!file) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-xl border border-white/10 bg-[#0b0f16]">
        <div className="text-center">
          <p className="text-sm font-medium text-slate-300">
            No file selected
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Select a file to inspect its code.
          </p>
        </div>
      </div>
    );
  }

  const code = file.content ?? "";

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0b0f16]">
      {/* Header */}
      <div className="flex h-10 items-center justify-between border-b border-white/10 bg-[#0f141d] px-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />

          <span
            className="truncate text-xs font-medium text-slate-300"
            title={file.path}
          >
            {file.path}
          </span>
        </div>

        <div className="ml-4 flex shrink-0 items-center gap-3">
          {findings.length > 0 && (
            <span className="text-xs text-amber-400">
              {findings.length} finding
              {findings.length !== 1
                ? "s"
                : ""}
            </span>
          )}

          <span className="text-xs text-slate-500">
            {code.split("\n").length} lines
          </span>
        </div>
      </div>

      {/* Monaco */}
      <div
        className="h-[600px]"
        onClick={handleEditorClick}
      >
        <Editor
          height="100%"
          language={normalizeLanguage(
            file.language
          )}
          value={code}
          theme="vs-dark"
          onMount={handleEditorMount}
          options={{
            readOnly: true,

            minimap: {
              enabled: true,
            },

            fontSize: 13,

            lineHeight: 22,

            padding: {
              top: 16,
              bottom: 16,
            },

            scrollBeyondLastLine: false,

            renderLineHighlight: "all",

            glyphMargin: true,

            folding: true,

            automaticLayout: true,

            smoothScrolling: true,

            cursorBlinking: "solid",

            wordWrap: "off",

            scrollbar: {
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },

            renderWhitespace: "selection",

            contextmenu: true,
          }}
        />
      </div>
    </div>
  );
}

