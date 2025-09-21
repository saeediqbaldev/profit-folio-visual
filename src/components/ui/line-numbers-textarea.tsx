import React, { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface LineNumbersTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
}

const LineNumbersTextarea = React.forwardRef<HTMLTextAreaElement, LineNumbersTextareaProps>(
  ({ className, value = "", onChange, ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);
    const [lines, setLines] = useState<number[]>([1]);

    useEffect(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const updateLineNumbers = () => {
        const lineCount = value.split('\n').length;
        setLines(Array.from({ length: lineCount }, (_, i) => i + 1));
      };

      updateLineNumbers();
    }, [value]);

    const handleScroll = () => {
      const textarea = textareaRef.current;
      const lineNumbers = lineNumbersRef.current;
      if (textarea && lineNumbers) {
        lineNumbers.scrollTop = textarea.scrollTop;
      }
    };

    return (
      <div className="relative flex border rounded-md bg-background">
        <div
          ref={lineNumbersRef}
          className="flex flex-col items-center justify-start bg-muted/30 text-muted-foreground text-sm font-mono px-2 py-3 border-r min-w-[3rem] overflow-hidden"
          style={{
            lineHeight: '1.5',
            fontSize: '14px',
          }}
        >
          {lines.map((lineNumber) => (
            <div key={lineNumber} className="leading-6 select-none">
              {lineNumber}
            </div>
          ))}
        </div>
        <textarea
          ref={ref || textareaRef}
          className={cn(
            "flex-1 min-h-[120px] px-3 py-3 text-sm bg-transparent border-0 resize-none focus:outline-none focus:ring-0 font-mono leading-6",
            className
          )}
          value={value}
          onChange={onChange}
          onScroll={handleScroll}
          style={{
            lineHeight: '1.5',
            fontSize: '14px',
          }}
          {...props}
        />
      </div>
    );
  }
);

LineNumbersTextarea.displayName = "LineNumbersTextarea";

export { LineNumbersTextarea };