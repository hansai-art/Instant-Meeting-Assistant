"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import RecorderTranscriber from "@/components/recorder";
import { TranscriptionDisplay } from "@/components/TranscriptionDisplay";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { HistoryData, TranscriptionSegment } from "@/lib/types";
import { FLAGS } from "@/lib/types";

interface CopilotProps {
  addInSavedData: (data: HistoryData) => void;
}

const modeDescriptions: Record<
  FLAGS,
  { title: string; description: string; shortcut: string }
> = {
  [FLAGS.SUMMERIZER]: {
    title: "摘要模式",
    description:
      "適合在會議進行中快速整理重點、待辦事項與結論，方便會後產出摘要。",
    shortcut: "S",
  },
  [FLAGS.COPILOT]: {
    title: "協作模式",
    description: "適合需要即時建議、回覆草稿、追問方向或下一步行動建議的情境。",
    shortcut: "C",
  },
};

const tutorialSections = [
  {
    title: "頁面導覽",
    items: [
      "左側先輸入會議背景、參與者角色與本次討論目標，AI 會依據這些資訊提供更準確的建議。",
      "中間的錄音按鈕會擷取目前頁面或系統音訊，並在右側逐步顯示時間戳記逐字稿。",
      "下方可切換摘要模式或協作模式，按下 Enter 或「產生回應」即可得到 AI 分析結果。",
    ],
  },
  {
    title: "建議使用流程",
    items: [
      "先補充會議主題、決策背景、重要限制與你希望 AI 協助的方向。",
      "開始擷取音訊後，確認右下角顯示已連線，再讓系統持續累積逐字稿內容。",
      "當討論到重點時立即產生回應，必要時再儲存結果，方便回頭整理紀錄。",
    ],
  },
  {
    title: "快捷鍵教學",
    items: [
      "K：快速聚焦右上角的 AI 問答輸入框。",
      "S / C：切換摘要模式或協作模式。",
      "Enter：在未聚焦輸入框時直接送出主表單。",
      "Esc：清除右上角 AI 問答的目前回答。",
    ],
  },
];

export function Copilot({ addInSavedData }: CopilotProps) {
  const [transcribedText, setTranscribedText] = useState<string>("");
  const [transcriptionSegments, setTranscriptionSegments] = useState<
    TranscriptionSegment[]
  >([]);
  const [flag, setFlag] = useState<FLAGS>(FLAGS.COPILOT);
  const [bg, setBg] = useState<string>("");
  const [completion, setCompletion] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const transcriptionBoxRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcription box to bottom
  useEffect(() => {
    if (transcriptionSegments.length === 0) return;
    if (transcriptionBoxRef.current) {
      transcriptionBoxRef.current.scrollTop =
        transcriptionBoxRef.current.scrollHeight;
    }
  }, [transcriptionSegments]);

  const handleFlag = useCallback((checked: boolean) => {
    if (!checked) {
      setFlag(FLAGS.SUMMERIZER);
    } else {
      setFlag(FLAGS.COPILOT);
    }
  }, []);

  const formRef = useRef<HTMLFormElement>(null);
  const controller = useRef<AbortController | null>(null);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Check if user is typing in an input or textarea
    const target = event.target as HTMLElement;
    const isTypingInInput =
      target.tagName === "INPUT" || target.tagName === "TEXTAREA";

    switch (event.key.toLowerCase()) {
      case "enter":
        // Only trigger global Enter if NOT in an input/textarea
        if (!isTypingInInput) {
          event.preventDefault();
          if (formRef.current) {
            const submitEvent = new Event("submit", {
              cancelable: true,
              bubbles: true,
            });
            formRef.current.dispatchEvent(submitEvent);
          }
        }
        break;
      case "s":
        if (!isTypingInInput) {
          event.preventDefault();
          setFlag(FLAGS.SUMMERIZER);
        }
        break;
      case "c":
        if (!isTypingInInput) {
          event.preventDefault();
          setFlag(FLAGS.COPILOT);
        }
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const addTextinTranscription = (text: string) => {
    setTranscribedText((prev) => `${prev} ${text}`);
  };

  const addTranscriptionSegment = (segment: TranscriptionSegment) => {
    setTranscriptionSegments((prev) => {
      // Check if this is an update to an existing interim segment or a new final segment
      const existingIndex = prev.findIndex((s) => s.id === segment.id);
      if (existingIndex !== -1) {
        // Update existing segment
        const updated = [...prev];
        updated[existingIndex] = segment;
        return updated;
      }
      // Add new segment
      return [...prev, segment];
    });
  };

  const clearTranscriptionChange = () => {
    setTranscribedText("");
    setTranscriptionSegments([]);
  };

  const stop = () => {
    if (controller.current) {
      controller.current.abort();
      controller.current = null;
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear any previous state
    setError(null);
    setCompletion("");
    setIsLoading(true);

    // Create a new AbortController for this request
    if (controller.current) controller.current.abort();
    controller.current = new AbortController();

    try {
      const response = await fetch("/api/completion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bg,
          flag,
          prompt: transcribedText,
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

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode the stream chunk
        const chunk = decoder.decode(value, { stream: true });

        // Process Server-Sent Events
        const eventStrings = chunk.split("\n\n");
        for (const eventString of eventStrings) {
          if (!eventString.trim()) continue;

          // Extract the data part of the SSE
          const dataMatch = eventString.match(/data: (.*)/);
          if (!dataMatch) continue;

          const data = dataMatch[1];
          if (data === "[DONE]") {
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              throw new Error(parsed.error);
            }

            if (parsed.text) {
              setCompletion((text) => text + parsed.text);
            }
          } catch (err) {
            console.error("Error parsing SSE data:", err);
          }
        }
      }
    } catch (err: unknown) {
      if (!(err instanceof Error && err.name === "AbortError")) {
        console.error("Stream error:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      setIsLoading(false);
      controller.current = null;
    }
  };

  useEffect(() => {
    const savedBg = localStorage.getItem("bg");
    if (savedBg) {
      setBg(savedBg);
    }
  }, []);

  useEffect(() => {
    if (!bg) return;
    localStorage.setItem("bg", bg);
  }, [bg]);

  const handleSave = () => {
    addInSavedData({
      createdAt: new Date().toISOString(),
      data: completion,
      tag: flag === FLAGS.COPILOT ? "協作模式" : "摘要模式",
    });
  };

  return (
    <div className="grid w-full gap-4 mt-12">
      <div className="grid gap-3">
        <h1 className="text-3xl font-bold text-green-700">即時會議助理</h1>
        <p className="text-sm leading-6 text-gray-700">
          這個頁面提供即時逐字稿、AI
          摘要與協作建議。所有操作說明都以臺灣繁體中文呈現，方便你在會議進行中快速上手。
        </p>
        <div className="grid gap-3 lg:grid-cols-3">
          {tutorialSections.map((section) => (
            <div
              key={section.title}
              className="rounded-lg border border-green-100 bg-green-50 p-4 shadow-sm"
            >
              <h2 className="text-base font-semibold text-green-800">
                {section.title}
              </h2>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-gray-700">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      {error && (
        <div className="fixed top-0 left-0 w-full p-4 text-center text-xs bg-red-500 text-white">
          {error.message}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="system_prompt" className="text-green-800">
            會議背景與需求說明
          </Label>
          <Textarea
            id="system_prompt"
            placeholder="請輸入此次會議的背景、參與角色、主要議題、預期成果，或你希望 AI 協助的重點。"
            className="resize-none h-[50px] overflow-hidden"
            style={{ lineHeight: "1.5", maxHeight: "150px" }}
            value={bg}
            onChange={(e) => setBg(e.target.value)}
          />
          <RecorderTranscriber
            addTextinTranscription={addTextinTranscription}
            addTranscriptionSegment={addTranscriptionSegment}
          />
        </div>

        <div className="grid gap-1.5 my-2">
          <Label htmlFor="transcription" className="text-green-800">
            即時逐字稿{" "}
            <button
              type="button"
              className="text-xs text-red-500 hover:text-red-800 underline"
              onClick={clearTranscriptionChange}
            >
              清除
            </button>
          </Label>
          <div
            ref={transcriptionBoxRef}
            className="mt-2 h-[225px] overflow-y-auto border border-gray-200 rounded-lg p-2 bg-white"
          >
            {transcriptionSegments.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-sm leading-6 text-gray-500">
                開始擷取會議音訊後，這裡會依序顯示帶有時間戳記的逐字稿，方便你即時掌握內容。
              </div>
            ) : (
              <TranscriptionDisplay segments={transcriptionSegments} />
            )}
          </div>
        </div>
      </div>
      <div>
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="grid md:grid-cols-2 gap-2"
        >
          <div className="flex items-center justify-center w-full border">
            <Label className="text-green-800  transition-opacity duration-300">
              摘要模式
              <span className="opacity-85 text-xs p-2">（S）</span>
            </Label>
            <Switch
              className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-200 m-2"
              onCheckedChange={handleFlag}
              defaultChecked
              checked={flag === FLAGS.COPILOT}
            />
            <Label className="text-green-800  transition-opacity duration-300">
              協作模式<span className="opacity-85 text-xs p-2">（C）</span>
            </Label>
          </div>

          <Button
            className="h-9 w-full bg-green-600 hover:bg-green-800 text-white transition-opacity duration-300"
            size="sm"
            variant="outline"
            disabled={isLoading}
            type="submit"
            onClick={isLoading ? stop : undefined}
          >
            {isLoading ? "停止" : "產生回應"}
            <span className="opacity-85 text-xs p-2">（Enter）</span>
          </Button>
        </form>
        <div className="mt-3 rounded-lg border border-dashed border-green-200 bg-white p-3 text-sm leading-6 text-gray-600">
          <span className="font-medium text-green-800">
            {modeDescriptions[flag].title}
          </span>
          ：{modeDescriptions[flag].description} 建議快捷鍵：
          {modeDescriptions[flag].shortcut}。
        </div>
      </div>

      {/* AI Completion Section */}
      <div className="mx-2 md:mx-10 mt-8 mb-8">
        {completion && (
          <button
            type="button"
            className="text-xs text-green-500 hover:text-green-800 underline"
            onClick={handleSave}
          >
            儲存到紀錄
          </button>
        )}
        <div className="flex whitespace-pre-wrap">
          {completion ||
            "AI 回應會顯示在這裡，方便你即時查看摘要、建議與下一步行動。"}
        </div>
      </div>
    </div>
  );
}
