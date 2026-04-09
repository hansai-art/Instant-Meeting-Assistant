"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendIcon, GripHorizontal, ChevronDown, ChevronUp } from "lucide-react";

interface QuestionAssistantProps {
  onQuestionSubmit?: (question: string) => void;
}

export function QuestionAssistant({
  onQuestionSubmit,
}: QuestionAssistantProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      const isTypingInInput =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      // K to focus input (only if not already typing)
      if (e.key.toLowerCase() === "k" && !isTypingInInput) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Escape to clear answer
      if (e.key === "Escape" && answer) {
        e.preventDefault();
        setAnswer("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [answer]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!question.trim()) return;

    setError(null);
    setAnswer("");
    setIsLoading(true);

    if (controller.current) controller.current.abort();
    controller.current = new AbortController();

    try {
      const response = await fetch("/api/completion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: question,
          flag: "copilot",
          bg: `你是一位專業的面試教練與會議顧問，請一律使用臺灣繁體中文回答。

重要要求：請提供詳細、完整、可直接使用的回覆，協助使用者在面試或會議情境中快速掌握重點，而不是只給簡短定義。

回答任何問題時都要：
1. 先說明核心概念或直接答案
2. 解釋為什麼這件事重要
3. 提供真實情境範例與適用場景
4. 整理使用者應該提到的重點、優勢或風險
5. 給出可直接採用的表達建議或行動建議
6. 補充最佳實務與常見誤區
7. 優先用條列方式，方便快速閱讀

其他規則：
- 不要使用口語贅詞
- 內容必須足夠具體，讓使用者可直接引用
- 可加入實際例句與建議說法
- 保持專業、清楚、好查閱`,
        }),
        signal: controller.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is null");
      }

      const decoder = new TextDecoder();
      let fullAnswer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const eventStrings = chunk.split("\n\n");

        for (const eventString of eventStrings) {
          if (!eventString.trim()) continue;

          const dataMatch = eventString.match(/data: (.*)/);
          if (!dataMatch) continue;

          const data = dataMatch[1];
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              fullAnswer += parsed.text;
              setAnswer(fullAnswer);
            }
          } catch (err) {
            console.error("Error parsing response:", err);
          }
        }
      }

      if (onQuestionSubmit) {
        onQuestionSubmit(question);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error:", err);
        setError("取得回答失敗，請稍後再試。");
      }
    } finally {
      setIsLoading(false);
      controller.current = null;
    }
  };

  const handleStop = () => {
    if (controller.current) {
      controller.current.abort();
      controller.current = null;
      setIsLoading(false);
    }
  };

  // Simulate listening state
  useEffect(() => {
    setIsListening(true);
    // Set position to right side on client
    setPosition({ x: window.innerWidth - 320, y: 80 });
    // Load minimized preference
    const savedMinimized = localStorage.getItem("qaAssistantMinimized");
    if (savedMinimized) {
      setIsMinimized(JSON.parse(savedMinimized));
    }
  }, []);

  // Save minimized preference
  useEffect(() => {
    localStorage.setItem("qaAssistantMinimized", JSON.stringify(isMinimized));
  }, [isMinimized]);

  // Handle mouse drag
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    const rect = containerRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Handle touch drag (mobile)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    const rect = containerRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top,
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Keep within bounds - responsive box width
      let boxWidth = 288; // w-72 default
      if (window.innerWidth < 768) {
        boxWidth = 256; // sm:w-64
      }
      if (window.innerWidth >= 1024) {
        boxWidth = 320; // lg:w-80
      }

      const maxX = window.innerWidth - boxWidth;
      const maxY = window.innerHeight - 100;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      const newX = e.touches[0].clientX - dragOffset.x;
      const newY = e.touches[0].clientY - dragOffset.y;

      // Keep within bounds
      let boxWidth = 288;
      if (window.innerWidth < 768) {
        boxWidth = 256;
      }
      if (window.innerWidth >= 1024) {
        boxWidth = 320;
      }

      const maxX = window.innerWidth - boxWidth;
      const maxY = window.innerHeight - 100;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchend", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <div
      ref={containerRef}
      className="fixed w-72 lg:w-80 sm:w-64 z-40 select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      {/* Listening Indicator */}
      {isListening && !isLoading && !answer && (
        <div className="mb-2 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center gap-1.5 shadow-sm">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse animation-delay-100" />
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse animation-delay-200" />
          </div>
          <span className="text-white text-xs font-medium flex-1">
            快問快答已就緒
          </span>
        </div>
      )}

      {/* Main Box */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {/* Drag Handle Header */}
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className="px-2.5 py-1.5 flex items-center gap-1.5 cursor-grab active:cursor-grabbing hover:transition-colors touch-none bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800"
        >
          <GripHorizontal size={12} />
          <span className="text-xs font-medium flex-1">詢問 AI</span>
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded hover:bg-white hover:bg-opacity-20 transition-colors"
            title={isMinimized ? "展開" : "收合"}
          >
            {isMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Compact Input Area */}
        {!isMinimized && (
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-1.5 p-2.5"
          >
            <Input
              ref={inputRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="輸入問題…（K）"
              disabled={isLoading}
              className="flex-1 border-0 text-xs h-7 placeholder-gray-400 focus:ring-1 focus:ring-green-500 bg-white text-gray-900"
              title="按 Esc 清除回答，按 K 聚焦輸入框"
            />
            <Button
              type="submit"
              disabled={isLoading || !question.trim()}
              onClick={isLoading ? handleStop : undefined}
              className={`${
                isLoading
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-600 hover:bg-green-700"
              } text-white h-6 w-6 p-0 rounded transition-colors flex items-center justify-center`}
              size="sm"
            >
              {isLoading ? "✕" : <SendIcon size={12} />}
            </Button>
          </form>
        )}

        {/* Loading State - Skeleton Loader */}
        {!isMinimized && isLoading && !answer && (
          <div className="px-2.5 py-2 border-t border-gray-100 bg-gray-50">
            <div className="space-y-2">
              <div className="h-3 w-full animate-skeleton rounded" />
              <div className="h-3 w-5/6 animate-skeleton rounded" />
              <div className="h-3 w-4/5 animate-skeleton rounded" />
            </div>
          </div>
        )}

        {/* Error */}
        {!isMinimized && error && (
          <div className="px-2.5 py-1.5 border-t border-gray-100 bg-red-50 text-red-600 text-xs">
            {error}
          </div>
        )}

        {/* Answer */}
        {!isMinimized && answer && (
          <div className="px-2.5 py-2 border-t border-gray-100 bg-gradient-to-b from-green-50 to-white max-h-48 overflow-y-auto fade-in-answer">
            <div className="text-gray-800 text-xs leading-relaxed whitespace-pre-wrap">
              {answer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
