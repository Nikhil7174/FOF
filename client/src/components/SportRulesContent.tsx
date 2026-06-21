import React from "react";
import { FileText } from "lucide-react";

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
  const [baseUrl] = url.split("#");
  return `${baseUrl}#toolbar=0&navpanes=0`;
}

interface SportRulesContentProps {
  rules?: string | null;
  rulesFileUrl?: string | null;
}

export function SportRulesContent({ rules, rulesFileUrl }: SportRulesContentProps) {
  const hasFile = Boolean(rulesFileUrl);
  const hasText = Boolean(rules?.trim());
  const isPdf = rulesFileUrl?.toLowerCase().includes(".pdf");

  if (!hasText && !hasFile) {
    return null;
  }

  // PDF takes precedence — only one rules format shown at a time
  if (hasFile) {
    return (
      <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <FileText className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">Official Rules Document</p>
          </div>
        </div>
        {isPdf && (
          <iframe
            src={getEmbeddedPdfUrl(rulesFileUrl!)}
            title="Sport rules PDF"
            className="w-full h-[480px] rounded-md border bg-white"
          />
        )}
      </div>
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
