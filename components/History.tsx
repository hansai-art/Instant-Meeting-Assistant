"use client";

import { Card } from "@/components/ui/card";
import type { HistoryData } from "@/lib/types";
import { ContentData } from "./ui/content";

interface HistoryProps {
  data: HistoryData[];
  deleteData: (createdAt: string) => void;
}

export default function History({ data: savedData, deleteData }: HistoryProps) {
  return (
    <div className="flex flex-col w-full">
      <main className="overflow-auto p-4 space-y-4">
        {savedData.length === 0 && (
          <Card className="p-4 border-dashed bg-white">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-green-800">儲存紀錄</h3>
              <p className="text-sm text-gray-600">
                當你產生 AI 回應後，可按下「儲存到紀錄」保留重要內容，之後回到本頁即可快速複習與整理會議重點。
              </p>
            </div>
          </Card>
        )}
        {savedData.map((data) => (
            <Card key={data.createdAt} className="p-4 bg-green-100">
              <div className="flex mt-2 text-xs">
                {data.tag} • {data.createdAt} •{" "}
                <button
                  type="button"
                  className="text-xs text-red-500 hover:text-red-800 underline"
                  onClick={() => {
                    deleteData(data.createdAt);
                  }}
                >
                  刪除
                </button>
              </div>
              <ContentData className="mt-2 text-sm" contentMaxLength={100}>
                {data.data}
              </ContentData>
            </Card>
          ))}
      </main>
    </div>
  );
}
