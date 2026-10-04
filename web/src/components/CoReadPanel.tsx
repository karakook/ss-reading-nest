import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useState } from "react";
import type { ReadingCommentMode } from "@ss/shared";
import {
  DEFAULT_READING_PARTNER_COPY,
  type ReadingPartnerCopy
} from "../features/reading-partner/config.js";

type CoReadMode = {
  id: ReadingCommentMode;
  label: string;
  hint: string;
};

const MODES: CoReadMode[] = [
  { id: "light_chat", label: "抱着读", hint: "轻轻聊两句" },
  { id: "cp_talk", label: "一起嗑", hint: "贴着人物关系聊" },
  { id: "plot_guess", label: "巴巴来猜", hint: "猜猜后面会怎样" },
  { id: "deep_analysis", label: "认真拆一拆", hint: "需要时再深入分析" }
];

export function CoReadPanel(props: {
  open: boolean;
  pageLabel: string;
  title: string;
  thoughtCount: number;
  actionInFlight?: boolean;
  onClose: () => void;
  onShare: (mode: ReadingCommentMode) => void;
  onShowThoughts: () => void;
  partner?: ReadingPartnerCopy;
}) {
  const partner = props.partner ?? DEFAULT_READING_PARTNER_COPY;
  const [selectedMode, setSelectedMode] = useState<ReadingCommentMode>("light_chat");

  if (!props.open) return null;

  return (
    <div className="co-read-backdrop" role="presentation" onClick={props.onClose}>
      <section
        className="co-read-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`${partner.companionName}来陪${partner.viewerName}读`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-grip" aria-hidden="true" />
        <header className="co-read-header">
          <div>
            <span>{props.title} · {props.pageLabel}</span>
            <h2>{partner.companionName}来陪{partner.viewerName}读</h2>
          </div>
          <button type="button" className="co-read-close" aria-label="关闭共读面板" onClick={props.onClose}>
            <X aria-hidden="true" strokeWidth={1.8} />
          </button>
        </header>

        <p className="co-read-opening">
          这页我也觉得不对劲。{partner.viewerName}想先听我猜，还是先说你的？
        </p>

        <div className="co-read-modes" role="group" aria-label="共读方式">
          {MODES.map((mode) => (
            <button
              type="button"
              key={mode.id}
              aria-pressed={selectedMode === mode.id}
              onClick={() => setSelectedMode(mode.id)}
            >
              <strong>{mode.id === "plot_guess" ? `${partner.companionName}来猜` : mode.label}</strong>
              <small>{mode.hint}</small>
            </button>
          ))}
        </div>

        <p className="co-read-scope">
          <MessageCircle aria-hidden="true" strokeWidth={1.8} />
          只分享当前页、选中文字和本页想法
        </p>

        <button
          type="button"
          className="action-primary co-read-primary"
          disabled={props.actionInFlight}
          onClick={() => props.onShare(selectedMode)}
        >
          <Sparkles aria-hidden="true" strokeWidth={1.8} />
          {props.actionInFlight ? `正在叫${partner.companionName}…` : `${partner.companionName}，陪我读这一页`}
        </button>
        <button type="button" className="co-read-thoughts" onClick={props.onShowThoughts}>
          <Send aria-hidden="true" strokeWidth={1.8} />
          给{partner.companionName}看我的想法{props.thoughtCount > 0 ? ` · ${props.thoughtCount} 条` : ""}
        </button>
      </section>
    </div>
  );
}
