"use client";
import * as React from "react";

export function ArrowBullet() {
  return (
    <span className="arrow-bullet" aria-hidden>
      <img src="../arow.svg" alt="" />
    </span>
  );
}

export function SectionHeading({
  children,
  pill,
}: {
  children: React.ReactNode;
  pill?: string;
}) {
  return (
    <div>
      {pill && (
        <div className="mb-4">
          <span className="pill-gold">«{pill}»</span>
        </div>
      )}
      <h2 className="h1">{children}</h2>
    </div>
  );
}

export function SubHeading({ icon = "arrow", children }: { icon?: "arrow" | "none"; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 mt-8 mb-3">
      {icon === "arrow" && <ArrowBullet />}
      <div className="h2" style={{ paddingTop: "3px" }}>{children}</div>
    </div>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
};

export function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  rows = 1,
}: FieldProps) {
  return (
    <div className="field-row">
      <label className="label">{label}</label>
      <AutoTextarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        minRows={multiline ? Math.max(2, rows) : 1}
        className={multiline ? "field-multi" : "field-line"}
      />
    </div>
  );
}

export function AutoTextarea({
  value,
  onChange,
  placeholder,
  minRows = 2,
  className = "field-input field-input-multi",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minRows?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLTextAreaElement | null>(null);
  const resize = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, []);
  React.useEffect(() => {
    resize();
  }, [value, resize]);
  return (
    <textarea
      ref={ref}
      className={className}
      rows={minRows}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onInput={resize}
    />
  );
}

export function CheckboxItem({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="check-option"
    >
      <span className="checkbox-square" data-checked={checked}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M3 7l3 3 5-6"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="check-option-text">{children}</span>
    </button>
  );
}

export function RadioItem({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex items-start gap-3 text-left w-full py-2"
    >
      <span className="radio-circle" data-checked={checked}>
        <span className="radio-inner" />
      </span>
      <span className="flex-1 leading-snug">{children}</span>
    </button>
  );
}

export function PillToggle({
  active,
  onChange,
  children,
}: {
  active: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!active)}
      className="pill-toggle"
      data-active={active}
    >
      <span>{children}</span>
      <span className="pill-dot" />
    </button>
  );
}

export function Scale({
  label,
  leftLabel,
  rightLabel,
  value,
  onChange,
}: {
  label?: string;
  leftLabel: string;
  rightLabel: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  const numbers = Array.from({ length: 10 }, (_, i) => i + 1);
  return (
    <div className="my-4">
      {label && <div className="label">{label}</div>}
      <div className="scale-wrap">
        <div className="scale-track">
          {numbers.map((n) => {
            const left = ((n - 1) / 9) * 100;
            const isActive = value === n;
            return (
              <button
                key={n}
                type="button"
                className={"scale-dot" + (isActive ? " active" : "")}
                style={{ left: `${left}%` }}
                onClick={() => onChange(n)}
                aria-label={String(n)}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>
      <div className="scale-labels">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={"rounded-2xl border p-5 bg-white " + (className ?? "")}
      style={{ borderColor: "var(--c-purple-line)" }}
    >
      {children}
    </div>
  );
}

export function PageFooter({ index, total }: { index: number; total: number }) {
  return (
    <div className="footer-page sans">
      <a href="https://www.instagram.com/MethodBataeva" target="_blank" rel="noopener noreferrer" style={{ fontStyle: "italic", color: "inherit", textDecoration: "none" }}>@MethodBataeva</a>
      <span>
        {index} / {total}
      </span>
    </div>
  );
}

export function ResetButton({ onReset }: { onReset: () => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (confirm("Очистить все ответы в этом чек-листе?")) onReset();
      }}
      className="no-print action-button action-button-ghost"
    >
      Очистить ответы
    </button>
  );
}

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print action-button action-button-primary"
    >
      Печать / PDF
    </button>
  );
}

function moodTone(value: number) {
  if (value <= 3) return "red";
  if (value <= 6) return "orange";
  if (value <= 8) return "yellow";
  return "green";
}

function moodText(value: number | null, mode: "before" | "after") {
  const prefix = mode === "before" ? "У вас было" : "У вас сейчас";
  if (!value) {
    return {
      title: "Выберите число",
      text: "1 - сильная паника, 10 - спокойствие и опора.",
    };
  }
  if (value <= 2) {
    return {
      title: `${prefix}: очень сильная паника`,
      text: mode === "before"
        ? "В начале состояние было очень острым. Важно увидеть это без самокритики."
        : "Важно не давить на себя. Начните с дыхания, тела и одного самого маленького действия.",
    };
  }
  if (value <= 3) {
    return {
      title: `${prefix}: высокая паника`,
      text: mode === "before"
        ? "Страх сильно захватывал внимание и мешал видеть опоры."
        : "Страх сильно захватывает внимание. Сначала верните телу ощущение безопасности.",
    };
  }
  if (value <= 6) {
    return {
      title: `${prefix}: средняя тревога`,
      text: mode === "before"
        ? "Тревога была заметной, но уже оставалось место для наблюдения."
        : "Вы уже можете наблюдать за страхом. Помогает отделить факты от фантазий.",
    };
  }
  if (value <= 8) {
    return {
      title: `${prefix}: больше спокойствия`,
      text: mode === "before"
        ? "Даже до прохождения уже была часть устойчивости, на которую можно опереться."
        : "Появляется ясность. Хороший момент, чтобы записать опоры и выбрать действие.",
    };
  }
  return {
    title: `${prefix}: спокойствие и опора`,
    text: mode === "before"
      ? "В начале уже было достаточно опоры. Можно заметить, что именно её поддерживало."
      : "Вы в устойчивом состоянии. Зафиксируйте, что помогло, чтобы вернуться к этому в следующий раз.",
  };
}

export function MoodScale({
  value,
  onChange,
  mode = "after",
}: {
  value: number | null;
  onChange: (v: number) => void;
  mode?: "before" | "after";
}) {
  const numbers = Array.from({ length: 10 }, (_, i) => i + 1);
  const feedback = moodText(value, mode);
  const tone = value ? moodTone(value) : "neutral";

  return (
    <div className="mood-scale" data-tone={tone}>
      <div className="mood-scale-grid" role="group" aria-label="Оценка состояния от 1 до 10">
        {numbers.map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              className="mood-button"
              data-tone={active ? moodTone(n) : "neutral"}
              data-active={active}
              onClick={() => onChange(n)}
              aria-pressed={active}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="mood-scale-labels sans">
        <span>1 - паника</span>
        <span>10 - спокойно</span>
      </div>
      <div className="mood-feedback">
        <strong>{feedback.title}</strong>
        <span>{feedback.text}</span>
      </div>
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="progress-row">
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="progress-label sans">
        {label ?? `${pct}%`}
      </div>
    </div>
  );
}

export function LevelBars({
  child,
  teen,
  adult,
  total = 3,
}: {
  child: number;
  teen: number;
  adult: number;
  total?: number;
}) {
  const items = [
    { key: "child", label: "Дитя", value: child, color: "var(--c-purple)" },
    { key: "teen", label: "Подросток", value: teen, color: "var(--c-gold)" },
    { key: "adult", label: "Взрослый", value: adult, color: "#2E9E6E" },
  ];
  return (
    <div className="bars-row">
      {items.map((it) => {
        const pct = Math.round((it.value / total) * 100);
        return (
          <div key={it.key} className="bar-col">
            <div className="bar-label sans">{it.label}</div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  "--bar-color": it.color,
                  "--bar-height": `${pct}%`,
                } as React.CSSProperties}
              />
            </div>
            <div className="bar-count sans">
              {it.value} / {total}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ArchetypeCard({
  variant,
  title,
  tag,
  description,
  tip,
  icon,
}: {
  variant: "child" | "teen" | "adult" | "mix";
  title: string;
  tag: string;
  description: string;
  tip: string;
  icon: string;
}) {
  return (
    <div className={`arch-card arch-${variant}`}>
      <div className="arch-head">
        <div className={`arch-icon arch-icon-${variant}`}>{icon}</div>
        <div>
          <div className="arch-name">{title}</div>
          <div className="arch-tag sans">{tag}</div>
        </div>
      </div>
      <p className="arch-desc">{description}</p>
      <div className={`arch-tip arch-tip-${variant}`}>
        <div className="arch-tip-label sans">Ваш следующий шаг</div>
        {tip}
      </div>
    </div>
  );
}

export function StepCard({
  n,
  title,
  done,
  onToggleDone,
  children,
}: {
  n: number;
  title: string;
  done?: boolean;
  onToggleDone?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`step-card${done ? " is-done" : ""}`}>
      <div className="step-head">
        <span className="num-circle">{n}</span>
        <span className="step-title">{title}</span>
        {onToggleDone && (
          <button
            type="button"
            onClick={onToggleDone}
            className="step-done sans"
            data-done={done}
          >
            {done ? "Сделано ✓" : "Отметить"}
          </button>
        )}
      </div>
      <div className="step-body">{children}</div>
    </div>
  );
}

export function DayCard({
  n,
  did,
  helped,
  done,
  onChange,
  onToggleDone,
}: {
  n: number;
  did: string;
  helped: string;
  done: boolean;
  onChange: (key: "did" | "helped", v: string) => void;
  onToggleDone: () => void;
}) {
  return (
    <div className={`day-card${done ? " is-done" : ""}`}>
      <div className="day-head">
        <span className="num-circle">{n}</span>
        <span className="day-title">День {n}</span>
        <button
          type="button"
          onClick={onToggleDone}
          className="step-done sans"
          data-done={done}
        >
          {done ? "Сделано ✓" : "Отметить"}
        </button>
      </div>
      <div className="day-body">
        <Field
          label="Что я сегодня сделал(а):"
          value={did}
          onChange={(v) => onChange("did", v)}
          multiline
        />
        <Field
          label="Что помогло мне вернуть спокойствие:"
          value={helped}
          onChange={(v) => onChange("helped", v)}
          multiline
        />
      </div>
    </div>
  );
}

export function SectionCover({
  eyebrow,
  title,
  description,
  count,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  count?: { done: number; total: number };
}) {
  return (
    <div className="section-cover">
      {eyebrow && <p className="section-eyebrow sans">{eyebrow}</p>}
      <h2 className="h1 mt-1">{title}</h2>
      {description && (
        <p className="italic mt-2" style={{ color: "var(--c-muted)" }}>
          {description}
        </p>
      )}
      {count && (
        <div className="section-count sans" style={{ color: "var(--c-muted)" }}>
          {count.done} из {count.total} заполнено
        </div>
      )}
    </div>
  );
}
