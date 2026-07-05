import React, { useState } from "react";
import { FileText, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const NUMBERED_RULE = /^(\d+)\.\s+(.+)$/;
const BOLD_LINE = /^\*\*(.+)\*\*$/;

type RuleBlock =
  | { type: "title"; text: string }
  | { type: "section"; text: string }
  | { type: "list"; items: string[] }
  | { type: "convenors"; text: string }
  | { type: "disclaimer"; text: string }
  | { type: "paragraph"; text: string };

function isSectionHeader(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 4 || trimmed.length > 80) return false;
  if (NUMBERED_RULE.test(trimmed)) return false;
  const letters = trimmed.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 3) return false;
  return trimmed === trimmed.toUpperCase();
}

function isConvenorsLine(line: string): boolean {
  return /^convenors?\s*:/i.test(line.trim());
}

function isDisclaimerLine(line: string): boolean {
  const lower = line.toLowerCase();
  return (
    lower.includes("subject to change") ||
    lower.includes("less than three") ||
    lower.includes("cancelled") ||
    lower.startsWith("an event with")
  );
}

function parseSportRules(rules: string): RuleBlock[] {
  const lines = rules.split("\n");
  const blocks: RuleBlock[] = [];
  let listItems: string[] = [];
  let paragraphLines: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: "list", items: [...listItems] });
      listItems = [];
    }
  };

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
      paragraphLines = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      flushParagraph();
      continue;
    }

    const numberedMatch = line.match(NUMBERED_RULE);
    if (numberedMatch) {
      flushParagraph();
      listItems.push(numberedMatch[2]);
      continue;
    }

    flushList();

    const boldMatch = line.match(BOLD_LINE);
    if (boldMatch) {
      flushParagraph();
      blocks.push({ type: "title", text: boldMatch[1] });
      continue;
    }

    if (isConvenorsLine(line)) {
      flushParagraph();
      blocks.push({ type: "convenors", text: line.replace(/^convenors?\s*:\s*/i, "") });
      continue;
    }

    if (isDisclaimerLine(line)) {
      flushParagraph();
      blocks.push({ type: "disclaimer", text: line });
      continue;
    }

    if (isSectionHeader(line)) {
      flushParagraph();
      blocks.push({ type: "section", text: line });
      continue;
    }

    paragraphLines.push(line);
  }

  flushList();
  flushParagraph();
  return blocks;
}

function renderInlineFormatting(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    const boldMatch = part.match(/^\*\*(.+)\*\*$/);
    if (boldMatch) {
      return (
        <strong key={index} className="font-semibold">
          {boldMatch[1]}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function getEmbeddedPdfUrl(url: string): string {
  let secureUrl = url;
  if (url.startsWith("http://") && !url.includes("localhost") && !url.includes("127.0.0.1")) {
    secureUrl = url.replace("http://", "https://");
  }
  const [baseUrl] = secureUrl.split("#");
  return `${baseUrl}#toolbar=0&navpanes=0`;
}

interface SportRulesContentProps {
  rules?: string | null;
  rulesFileUrl?: string | null;
  title?: string;
}

export function SportRulesContent({ rules, rulesFileUrl, title = "Official Rules Document" }: SportRulesContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasFile = Boolean(rulesFileUrl);
  const hasText = Boolean(rules?.trim());
  const isPdf = rulesFileUrl?.toLowerCase().includes(".pdf");

  if (!hasText && !hasFile) {
    return null;
  }

  // PDF takes precedence — only one rules format shown at a time
  if (hasFile) {
    return (
      <>
        <div 
          className="rounded-lg border bg-muted/30 p-4 space-y-3"
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <p className="font-medium text-sm">{title}</p>
            </div>
            <div className="flex items-center gap-2">
              {!isPdf && (
                <a
                  href={rulesFileUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
                >
                  Open Link ↗
                </a>
              )}
              {isPdf && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={() => setIsExpanded(true)}
                >
                  <Maximize2 className="h-4 w-4" />
                  Expand View
                </Button>
              )}
            </div>
          </div>
          {isPdf && (
            <iframe
              src={getEmbeddedPdfUrl(rulesFileUrl!)}
              title="Sport rules PDF"
              className="w-full h-[480px] rounded-md border bg-white"
              onContextMenu={(e) => e.preventDefault()}
            />
          )}
        </div>

        {/* Expanded View Modal */}
        {isExpanded && (
          <div 
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="bg-background w-full max-w-5xl h-[95vh] rounded-lg border shadow-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="border-b px-4 py-2 flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <h3 className="font-semibold text-base">{title}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={() => setIsExpanded(false)}
                >
                  <Minimize2 className="h-4 w-4" />
                  Close
                </Button>
              </div>
              <div className="flex-1 bg-white p-4 relative">
                <iframe
                  src={getEmbeddedPdfUrl(rulesFileUrl!)}
                  title="Sport rules PDF expanded"
                  className="w-full h-full rounded-md border"
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  const blocks = parseSportRules(rules!);

  return (
    <div className="rounded-lg border bg-card p-4 md:p-6 space-y-4 text-sm leading-relaxed">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "title":
            return (
              <h3
                key={index}
                className="text-lg font-bold text-center border-b pb-2 mb-2"
              >
                {renderInlineFormatting(block.text)}
              </h3>
            );
          case "section":
            return (
              <h4
                key={index}
                className="text-base font-bold uppercase underline tracking-wide pt-2"
              >
                {block.text}
              </h4>
            );
          case "list":
            return (
              <ol
                key={index}
                className="list-decimal list-outside pl-5 space-y-2 marker:font-semibold"
              >
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="pl-1">
                    {renderInlineFormatting(item)}
                  </li>
                ))}
              </ol>
            );
          case "convenors":
            return (
              <p key={index} className="font-bold uppercase pt-2">
                Convenors: {renderInlineFormatting(block.text)}
              </p>
            );
          case "disclaimer":
            return (
              <div
                key={index}
                className="border rounded-md p-3 text-center text-xs md:text-sm bg-muted/40"
              >
                {renderInlineFormatting(block.text)}
              </div>
            );
          case "paragraph":
            return (
              <p key={index}>{renderInlineFormatting(block.text)}</p>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
