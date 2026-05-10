"use client";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  AutoTextarea,
  MoodScale,
  PageFooter,
  PrintButton,
  ProgressBar,
  ResetButton,
  ArrowBullet,
  PillToggle,
  DayCard,
} from "../_components/primitives";
import { useChecklistState } from "../_components/useChecklistState";

// ── Уровни мышления ──────────────────────────────────────────────────────────
const LEVEL_CHILD: string[] = [
  "Жду, что само пройдёт, прячусь от ситуации.",
  "Когда мне страшно, замираю и перестаю видеть возможности.",
  "Пугаю себя мыслями о самом страшном, не могу переключиться.",
];
const LEVEL_TEEN: string[] = [
  "Злюсь, обвиняю других, сопротивляюсь реальности.",
  "Принимаю резкие решения или делаю хаотичные движения.",
  "Ставлю слишком большую цель, потом проваливаюсь в разочарование.",
];
const LEVEL_ADULT: string[] = [
  "Могу остановиться и спросить: это реальная опасность или страх, который я сам усилил(а)?",
  "Могу прожить страх, увидеть факты и только потом переходить к действиям.",
  "Готов(а) идти маленькими шагами для постепенного обретения спокойствия.",
];

const EMOTIONS = ["Паника", "Страх", "Тревога", "Растерянность", "Злость"] as const;
const JOY_OPTIONS = [
  "Чашка кофе / чая",
  "Прогулка",
  "Музыка",
  "Разговор с близким",
  "Фильм / сериал",
  "Спорт",
] as const;

type DayEntry = { situation: string; action: string; helped: string; scale: number; done: boolean };

type State = {
  // Шаг 1: Ситуация
  situation: string;
  when: string;
  whyMatters: string;
  emotions: boolean[];
  bodyLocation: string;
  scaleBefore: number | null;

  // Шаг 2: Дыхание
  afterBreathing: string;
  scaleAfterBreath: number | null;

  // Шаг 3: Называю страх
  fearStatement: string;
  fearReason: string;
  worstScenario: string;
  worstReality: string;

  // Шаг 4: Прохожу страх
  enterFear: string;
  bodyInFear: string;
  afterExiting: string;
  fearTurnedOut: string;
  scaleAfterFear: number | null;

  // Шаг 5: Уровень мышления
  levelsChild: boolean[];
  levelsTeen: boolean[];
  levelsAdult: boolean[];
  blockingBelief: string;
  adultReframe: string;

  // Шаг 6: Действую
  cash: string;
  account: string;
  income: string;
  expenses: string;
  immediateAction: string;
  sevenDaySteps: string;
  pastCrises: string;
  supports: string;

  // Шаг 7: Переключаюсь
  joyActivities: boolean[];
  joyCustom: string;
  whatChanged: string;
  finalScale: number | null;
  finalPhrase: string;

  // Трекер 7 дней
  days: DayEntry[];
};

const INITIAL: State = {
  situation: "",
  when: "",
  whyMatters: "",
  emotions: Array(EMOTIONS.length).fill(false),
  bodyLocation: "",
  scaleBefore: null,

  afterBreathing: "",
  scaleAfterBreath: null,

  fearStatement: "",
  fearReason: "",
  worstScenario: "",
  worstReality: "",

  enterFear: "",
  bodyInFear: "",
  afterExiting: "",
  fearTurnedOut: "",
  scaleAfterFear: null,

  levelsChild: Array(3).fill(false),
  levelsTeen: Array(3).fill(false),
  levelsAdult: Array(3).fill(false),
  blockingBelief: "",
  adultReframe: "",

  cash: "",
  account: "",
  income: "",
  expenses: "",
  immediateAction: "",
  sevenDaySteps: "",
  pastCrises: "",
  supports: "",

  joyActivities: Array(JOY_OPTIONS.length).fill(false),
  joyCustom: "",
  whatChanged: "",
  finalScale: null,
  finalPhrase: "",

  days: Array(7).fill(null).map(() => ({
    situation: "",
    action: "",
    helped: "",
    scale: 5,
    done: false,
  })),
};

const REQUIRED_TEXT: (keyof State)[] = [
  "situation", "fearStatement", "worstScenario", "enterFear",
  "blockingBelief", "immediateAction", "whatChanged",
];
const TOTAL = 9;

// ── Breathing timer ───────────────────────────────────────────────────────────
const BREATH_PHASES = [
  { name: "Вдох", dur: 4, cls: "expand" },
  { name: "Задержка", dur: 4, cls: "hold" },
  { name: "Выдох", dur: 4, cls: "shrink" },
  { name: "Задержка", dur: 4, cls: "" },
] as const;
const TOTAL_CYCLES = 5;

function BreathingTimer() {
  const [running, setRunning] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState(0);
  const [tick, setTick] = useState(4);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    setRunning(false);
    setCycle(0);
    setPhase(0);
    setTick(4);
    setDone(false);
  }, []);

  const start = useCallback(() => {
    if (running) { stop(); return; }
    setDone(false);
    setRunning(true);
    setCycle(0);
    setPhase(0);
    setTick(BREATH_PHASES[0].dur);

    let ph = 0, cy = 0, t = BREATH_PHASES[0].dur;
    timer.current = setInterval(() => {
      t--;
      setTick(t);
      if (t <= 0) {
        ph = (ph + 1) % 4;
        if (ph === 0) {
          cy++;
          setCycle(cy);
          if (cy >= TOTAL_CYCLES) {
            if (timer.current) clearInterval(timer.current);
            setRunning(false);
            setDone(true);
            return;
          }
        }
        setPhase(ph);
        t = BREATH_PHASES[ph].dur;
        setTick(t);
      }
    }, 1000);
  }, [running, stop]);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const ph = BREATH_PHASES[phase];
  const circleClass = ["breath-circle", ph.cls && running ? ph.cls : done ? "hold" : ""].filter(Boolean).join(" ");

  return (
    <div style={{ textAlign: "center", padding: "1.5rem 1rem" }}>
      <div className={circleClass} style={{
        width: 120, height: 120, borderRadius: "50%",
        border: "1.5px solid var(--c-purple-line)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        margin: "0 auto 14px",
        transition: "transform 0.5s, background 0.5s",
        background: done ? "var(--c-purple-soft)" : "var(--c-paper)",
      }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--c-ink)" }}>
          {done ? "Готово!" : running ? ph.name : "Готов(а)?"}
        </span>
        <span style={{ fontSize: 32, fontWeight: 300, color: "var(--c-ink)", lineHeight: 1 }}>
          {running ? tick : "4"}
        </span>
      </div>
      <div className="label" style={{ fontSize: 16, color: "var(--c-muted)", marginBottom: 14, lineHeight: 1.5 }}>
        {done
          ? `Вы сделали ${TOTAL_CYCLES} циклов. Тело успокоилось.`
          : running
          ? `Цикл ${cycle + 1} из ${TOTAL_CYCLES}`
          : "Вдох 4 · Задержка 4 · Выдох 4 · Задержка 4"}
      </div>
      <button
        type="button"
        onClick={start}
        className={running ? "action-button action-button-ghost" : "action-button action-button-primary"}
        style={{ borderRadius: 999, padding: "8px 28px", fontSize: 18 }}
      >
        {done ? "Начать снова" : running ? "Остановить" : "Начать"}
      </button>
      {/* Dots */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 14 }}>
        {Array.from({ length: TOTAL_CYCLES }).map((_, i) => (
          <div key={i} style={{
            width: 9, height: 9, borderRadius: "50%",
            background: i < cycle ? "var(--c-purple)" : "var(--c-purple-line)",
            transition: "background 0.3s",
          }} />
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DnevnikPanikiPage() {
  const { state, setState, update, reset } = useChecklistState<State>(
    "checklist:dnevnik-paniki:v1",
    INITIAL,
  );
  const [navOpen, setNavOpen] = useState(false);

  const setEmotion = (i: number, v: boolean) =>
    setState((prev) => { const e = [...prev.emotions]; e[i] = v; return { ...prev, emotions: e }; });
  const setJoy = (i: number, v: boolean) =>
    setState((prev) => { const j = [...prev.joyActivities]; j[i] = v; return { ...prev, joyActivities: j }; });
  const setLevelChild = (i: number, v: boolean) =>
    setState((prev) => { const l = [...prev.levelsChild]; l[i] = v; return { ...prev, levelsChild: l }; });
  const setLevelTeen = (i: number, v: boolean) =>
    setState((prev) => { const l = [...prev.levelsTeen]; l[i] = v; return { ...prev, levelsTeen: l }; });
  const setLevelAdult = (i: number, v: boolean) =>
    setState((prev) => { const l = [...prev.levelsAdult]; l[i] = v; return { ...prev, levelsAdult: l }; });

  const setDay = (i: number, key: keyof DayEntry, v: string | number | boolean) =>
    setState((prev) => {
      const days = prev.days.map((d, idx) => idx === i ? { ...d, [key]: v } : d);
      return { ...prev, days };
    });

  const progress = useMemo(() => {
    const textDone = REQUIRED_TEXT.reduce(
      (s, k) => s + (typeof state[k] === "string" && (state[k] as string).trim() ? 1 : 0), 0,
    );
    const breathDone = state.scaleAfterBreath !== null ? 1 : 0;
    const levelDone = (state.levelsChild.some(Boolean) || state.levelsTeen.some(Boolean) || state.levelsAdult.some(Boolean)) ? 1 : 0;
    const dayDone = state.days.some((d) => d.done) ? 1 : 0;
    const total = REQUIRED_TEXT.length + 3;
    return Math.round(((textDone + breathDone + levelDone + dayDone) / total) * 100);
  }, [state]);

  return (
    <>
      <NavBar progress={progress} open={navOpen} setOpen={setNavOpen} />
      <main className="paper-page">
        <CoverPage />

        <div className="guide-card no-print">
          <div>
            <div className="guide-kicker sans">Как проходить</div>
            <h2>Идите по шагам сверху вниз. Сайт сохраняет ответы автоматически.</h2>
          </div>
          <p>
            Не нужно заполнять идеально. Достаточно честно записывать то, что есть сейчас.
            Паника - это не слабость. Это сигнал: пора переключаться в состояние взрослого.
          </p>
          <a href="#s1" className="guide-button sans">Начать с шага 1</a>
        </div>

        {/* ── ШАГ 1: Ситуация ──────────────────────────────── */}
        <section id="s1" className="section">
          <div className="mb-4">
            <span className="pill-gold">Шаг 1</span>
          </div>
          <h2 className="h1">Ситуация</h2>
          <p className="italic" style={{ color: "var(--c-muted)", marginBottom: 28 }}>
            Что именно активировало панику или страх
          </p>

          <Field label="Что именно произошло:" value={state.situation} onChange={(v) => update("situation", v)} rows={3} />
          <Field label="Когда это произошло:" value={state.when} onChange={(v) => update("when", v)} rows={1} />
          <Field label="Почему именно это меня задело - что я могу потерять:" value={state.whyMatters} onChange={(v) => update("whyMatters", v)} rows={3} />

          <div className="field-row">
            <div className="flex items-start gap-3 mb-3">
              <ArrowBullet />
              <div className="h2">Как я бы назвал(а) это состояние:</div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {EMOTIONS.map((label, i) => (
                <PillToggle key={i} active={state.emotions[i]} onChange={(v) => setEmotion(i, v)}>
                  {label}
                </PillToggle>
              ))}
            </div>
          </div>

          <Field label="Где в теле я это чувствую:" value={state.bodyLocation} onChange={(v) => update("bodyLocation", v)} rows={1} />

          <div className="field-row">
            <div className="flex items-start gap-3 mb-3">
              <ArrowBullet />
              <div className="h2">Шкала состояния прямо сейчас:</div>
            </div>
            <MoodScale value={state.scaleBefore} onChange={(v) => update("scaleBefore", v)} mode="before" />
          </div>

          <div className="quote-card" style={{ marginTop: 24 }}>
            <div className="flex items-start gap-3">
              <ArrowBullet />
              <div className="italic">
                Паника - это не слабость. Это сигнал: пора переключаться в состояние взрослого. Начните с тела.
              </div>
            </div>
          </div>

          <PageFooter index={1} total={TOTAL} />
        </section>

        {/* ── ШАГ 2: Квадрат дыхания ───────────────────────── */}
        <section id="s2" className="section">
          <div className="mb-4">
            <span className="pill-gold">Шаг 2</span>
          </div>
          <h2 className="h1">Квадрат дыхания</h2>
          <p className="italic" style={{ color: "var(--c-muted)", marginBottom: 28 }}>
            Сначала успокоить тело - потом работать с головой
          </p>

          <div className="quote-card" style={{ marginBottom: 24 }}>
            <div className="flex items-start gap-3">
              <ArrowBullet />
              <div>
                Паника рождается в теле - в миндалевидном теле. Глубокое дыхание снижает кортизол
                и адреналин. Сядьте прямо, почувствуйте связь с полом. Сделайте 5 циклов.
              </div>
            </div>
          </div>

          <div style={{
            border: "1px solid var(--c-purple-line)",
            borderRadius: 16,
            background: "#fff",
            padding: "0 0 20px",
            marginBottom: 24,
          }}>
            <BreathingTimer />
          </div>

          <Field label="Что изменилось в теле после дыхания:" value={state.afterBreathing} onChange={(v) => update("afterBreathing", v)} rows={3} />

          <div className="field-row">
            <div className="flex items-start gap-3 mb-3">
              <ArrowBullet />
              <div className="h2">Шкала после дыхания:</div>
            </div>
            <MoodScale value={state.scaleAfterBreath} onChange={(v) => update("scaleAfterBreath", v)} mode="after" />
          </div>

          <PageFooter index={2} total={TOTAL} />
        </section>

        {/* ── ШАГ 3: Называю страх ─────────────────────────── */}
        <section id="s3" className="section">
          <div className="mb-4">
            <span className="pill-gold">Шаг 3</span>
          </div>
          <h2 className="h1">Называю страх</h2>
          <p className="italic" style={{ color: "var(--c-muted)", marginBottom: 28 }}>
            Страх выходит из тьмы - он уже не монстр
          </p>

          <div style={{
            background: "var(--c-purple-soft)",
            borderRadius: 14,
            padding: "18px 20px",
            marginBottom: 20,
          }}>
            <div className="label" style={{ color: "var(--c-purple-deep)", marginBottom: 10 }}>
              Я боюсь, что...
            </div>
            <AutoTextarea
              value={state.fearStatement}
              onChange={(v) => update("fearStatement", v)}
              minRows={2}
              className="field-input field-input-multi"
              placeholder="Закончите фразу честно. Одно предложение."
            />
          </div>

          <Field label="Почему я паникую - написать честно всё что приходит:" value={state.fearReason} onChange={(v) => update("fearReason", v)} rows={3} />

          <div className="flex items-start gap-3 mt-8 mb-3">
            <ArrowBullet />
            <div className="h2">Самый страшный сценарий</div>
          </div>

          <div className="quote-card" style={{ marginBottom: 20 }}>
            <div className="italic">
              Посмотрите в глаза своему страху. Что самое страшное может произойти, если паника сбудется?
            </div>
          </div>

          <Field label="Самое страшное, что может случиться:" value={state.worstScenario} onChange={(v) => update("worstScenario", v)} rows={3} />
          <Field label="Насколько это реально прямо сейчас - факты, а не страхи:" value={state.worstReality} onChange={(v) => update("worstReality", v)} rows={3} />

          <PageFooter index={3} total={TOTAL} />
        </section>

        {/* ── ШАГ 4: Прохожу страх ─────────────────────────── */}
        <section id="s4" className="section">
          <div className="mb-4">
            <span className="pill-gold">Шаг 4</span>
          </div>
          <h2 className="h1">Прохожу страх</h2>
          <p className="italic" style={{ color: "var(--c-muted)", marginBottom: 28 }}>
            Метод антиципации - прожить страх по-настоящему
          </p>

          <div className="quote-card" style={{ marginBottom: 24 }}>
            <div className="flex items-start gap-3">
              <ArrowBullet />
              <div>
                Мозгу всё равно - виртуально или реально вы проживёте страх. Прожив его, вы увидите:
                он не такой страшный. Он выходит из тени и становится маленьким.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4 mt-6">
            <span className="num-circle">1</span>
            <span className="h2">Вхожу в страх</span>
          </div>
          <Field label="Представляю самый страшный сценарий в деталях - что происходит:" value={state.enterFear} onChange={(v) => update("enterFear", v)} rows={4} />
          <Field label="Что я чувствую в теле, когда полностью вхожу в этот страх:" value={state.bodyInFear} onChange={(v) => update("bodyInFear", v)} rows={3} />

          <div className="flex items-center gap-3 mb-4 mt-8">
            <span className="num-circle">2</span>
            <span className="h2">Выхожу из страха</span>
          </div>
          <Field label="Что произошло с ощущением страха, когда я его прожил(а):" value={state.afterExiting} onChange={(v) => update("afterExiting", v)} rows={3} />
          <Field label="Каким оказался страх на самом деле:" value={state.fearTurnedOut} onChange={(v) => update("fearTurnedOut", v)} rows={3} />

          <div className="field-row">
            <div className="flex items-start gap-3 mb-3">
              <ArrowBullet />
              <div className="h2">Шкала после проживания страха:</div>
            </div>
            <MoodScale value={state.scaleAfterFear} onChange={(v) => update("scaleAfterFear", v)} mode="after" />
          </div>

          <PageFooter index={4} total={TOTAL} />
        </section>

        {/* ── ШАГ 5: Уровень мышления ──────────────────────── */}
        <section id="s5" className="section">
          <div className="mb-4">
            <span className="pill-gold">Шаг 5</span>
          </div>
          <h2 className="h1">Уровень мышления</h2>
          <p className="italic" style={{ color: "var(--c-muted)", marginBottom: 28 }}>
            Где я сейчас - и куда хочу перейти
          </p>

          <p className="label" style={{ marginBottom: 16 }}>
            Отметьте те фразы, которые ближе всего к вашей реакции в этой ситуации:
          </p>

          <LevelGroup
            pill="Уровень «Дитя»"
            phrases={LEVEL_CHILD}
            levels={state.levelsChild}
            setLevel={setLevelChild}
          />
          <LevelGroup
            pill="Уровень «Подросток»"
            phrases={LEVEL_TEEN}
            levels={state.levelsTeen}
            setLevel={setLevelTeen}
          />
          <LevelGroup
            pill="Уровень «Взрослый»"
            phrases={LEVEL_ADULT}
            levels={state.levelsAdult}
            setLevel={setLevelAdult}
          />

          <Field label="Что мне мешает быть Взрослым прямо сейчас - моя главная установка в этой ситуации:" value={state.blockingBelief} onChange={(v) => update("blockingBelief", v)} rows={3} />
          <Field label="Как Взрослый переформулировал бы это:" value={state.adultReframe} onChange={(v) => update("adultReframe", v)} rows={3} />

          <PageFooter index={5} total={TOTAL} />
        </section>

        {/* ── ШАГ 6: Действую ──────────────────────────────── */}
        <section id="s6" className="section">
          <div className="mb-4">
            <span className="pill-gold">Шаг 6</span>
          </div>
          <h2 className="h1">Действую</h2>
          <p className="italic" style={{ color: "var(--c-muted)", marginBottom: 28 }}>
            Позиция взрослого - «что я могу сделать прямо сейчас?»
          </p>

          <div className="flex items-start gap-3 mb-3">
            <ArrowBullet />
            <div className="h2">Аудит финансов</div>
          </div>
          <div className="quote-card" style={{ marginBottom: 20 }}>
            <div className="italic">
              Когда вы видите цифры - темнота рассеивается. Это не приговор, это карта местности.
            </div>
          </div>

          <div className="grid-2col" style={{ marginBottom: 4 }}>
            <Field label="Наличные:" value={state.cash} onChange={(v) => update("cash", v)} rows={1} />
            <Field label="На карте / счёте:" value={state.account} onChange={(v) => update("account", v)} rows={1} />
          </div>
          <div className="grid-2col">
            <Field label="Доход в этом месяце:" value={state.income} onChange={(v) => update("income", v)} rows={1} />
            <Field label="Обязательные расходы:" value={state.expenses} onChange={(v) => update("expenses", v)} rows={1} />
          </div>

          <div className="flex items-start gap-3 mb-3 mt-8">
            <ArrowBullet />
            <div className="h2">Конкретные шаги</div>
          </div>

          <Field label="Что я могу сделать прямо сейчас - одно действие:" value={state.immediateAction} onChange={(v) => update("immediateAction", v)} rows={2} />
          <Field label="Три шага в ближайшие 7 дней:" value={state.sevenDaySteps} onChange={(v) => update("sevenDaySteps", v)} rows={4} />

          <div className="flex items-start gap-3 mb-3 mt-8">
            <ArrowBullet />
            <div className="h2">Мои опоры</div>
          </div>

          <Field label="Какие кризисы я уже проходил(а) и справился(ась):" value={state.pastCrises} onChange={(v) => update("pastCrises", v)} rows={3} />
          <Field label="На что / кого я могу опереться сейчас:" value={state.supports} onChange={(v) => update("supports", v)} rows={3} />

          <PageFooter index={6} total={TOTAL} />
        </section>

        {/* ── ШАГ 7: Переключаюсь ──────────────────────────── */}
        <section id="s7" className="section">
          <div className="mb-4">
            <span className="pill-gold">Шаг 7</span>
          </div>
          <h2 className="h1">Переключаюсь</h2>
          <p className="italic" style={{ color: "var(--c-muted)", marginBottom: 28 }}>
            После проработки - направить внимание на радость
          </p>

          <div className="quote-card" style={{ marginBottom: 24 }}>
            <div className="flex items-start gap-3">
              <ArrowBullet />
              <div>
                После того как вы прошли страх - важно переключить внимание на то, что доставляет
                удовольствие. Улыбнитесь всем телом. Когда вы почувствуете удовольствие - паника
                отступит окончательно.
              </div>
            </div>
          </div>

          <div className="field-row">
            <div className="flex items-start gap-3 mb-3">
              <ArrowBullet />
              <div className="h2">Что доставит мне радость прямо сейчас:</div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
              {JOY_OPTIONS.map((label, i) => (
                <PillToggle key={i} active={state.joyActivities[i]} onChange={(v) => setJoy(i, v)}>
                  {label}
                </PillToggle>
              ))}
            </div>
          </div>

          <Field label="Что именно сделаю:" value={state.joyCustom} onChange={(v) => update("joyCustom", v)} rows={1} />

          <div className="flex items-start gap-3 mb-3 mt-8">
            <ArrowBullet />
            <div className="h2">Итог работы с паникой</div>
          </div>

          <Field label="Что изменилось после всех шагов:" value={state.whatChanged} onChange={(v) => update("whatChanged", v)} rows={4} />
          <Field label="Одна фраза о себе после этой работы:" value={state.finalPhrase} onChange={(v) => update("finalPhrase", v)} rows={1} />

          <div className="field-row">
            <div className="flex items-start gap-3 mb-3">
              <ArrowBullet />
              <div className="h2">Финальная шкала состояния:</div>
            </div>
            <MoodScale value={state.finalScale} onChange={(v) => update("finalScale", v)} mode="after" />
          </div>

          <div className="quote-card mt-10" style={{ background: "var(--c-purple-soft)" }}>
            <div className="flex items-start gap-3">
              <ArrowBullet />
              <div>
                <p className="italic" style={{ marginBottom: 6 }}>
                  «Ваша паника - не враг. Это компас, который показывает куда вам нужно расти.»
                </p>
                <p style={{ fontSize: 16, color: "var(--c-muted)" }}>- Наталья Батаева</p>
              </div>
            </div>
          </div>

          <PageFooter index={7} total={TOTAL} />
        </section>

        {/* ── ТРЕКЕР 7 ДНЕЙ ────────────────────────────────── */}
        <section id="s8" className="section">
          <div className="mb-4">
            <span className="pill-gold">Трекер</span>
          </div>
          <h2 className="h1">Ежедневный трекер</h2>
          <p className="italic" style={{ color: "var(--c-muted)", marginBottom: 28 }}>
            7 дней работы со страхом и паникой. Каждый вечер фиксируйте что произошло,
            что вы сделали и что помогло вернуть спокойствие.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {state.days.map((day, i) => (
              <TrackerDay
                key={i}
                n={i + 1}
                data={day}
                onChange={(key, v) => setDay(i, key, v)}
                onToggleDone={() => setDay(i, "done", !day.done)}
              />
            ))}
          </div>

          <PageFooter index={8} total={TOTAL} />
        </section>

        {/* ── ИТОГ ─────────────────────────────────────────── */}
        <section id="s9" className="section">
          <div className="mb-4">
            <span className="pill-gold">Итог</span>
          </div>
          <h2 className="h1">Что я понял(а) о своём страхе</h2>
          <p className="italic" style={{ color: "var(--c-muted)", marginBottom: 28 }}>
            Зафиксируйте итог после прохождения техники.
          </p>

          <div className="quote-card" style={{ background: "var(--c-purple-soft)", marginBottom: 32 }}>
            <div className="flex items-start gap-3">
              <ArrowBullet />
              <div>
                Этот чек-лист - один из инструментов возвращения спокойствия. Чтобы глубже
                разобраться в своих жизненных сценариях и способах реагирования, читайте книгу
                Натальи Батаевой «На Личность идёт НаЛичность» или проходите онлайн-курс.
              </div>
            </div>
          </div>

          <div className="cta-buttons no-print">
            <a
              href="https://na-lichnost.ru/book"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-btn cta-btn--book"
            >
              Книга «На Личность идёт НаЛичность»
            </a>
            <a
              href="https://na-lichnost.ru/"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-btn cta-btn--course"
            >
              Онлайн-курс
            </a>
          </div>

          <div className="final-actions no-print">
            <PrintButton />
            <ResetButton onReset={reset} />
          </div>

          <PageFooter index={9} total={TOTAL} />
        </section>
      </main>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NavBar({
  progress,
  open,
  setOpen,
}: {
  progress: number;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  return (
    <nav className="top-dock no-print">
      <div className="top-dock-inner">
        <div className="top-dock-head sans">
          <a href="#cover" className="toc-link brand-link">«Дневник паники и страха»</a>
          <div className="top-dock-actions">
            <span>{progress}% заполнено</span>
            <button
              type="button"
              className="menu-toggle"
              aria-label={open ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
        <ProgressBar value={progress} />
        <div className="section-tabs" data-open={open} style={{ justifyContent: "center", flexWrap: "wrap", overflowX: "visible", gap: "6px 8px" }}>
          <a href="#s1" className="toc-link" onClick={() => setOpen(false)}>1. Ситуация</a>
          <a href="#s2" className="toc-link" onClick={() => setOpen(false)}>2. Дыхание</a>
          <a href="#s3" className="toc-link" onClick={() => setOpen(false)}>3. Страх</a>
          <a href="#s4" className="toc-link" onClick={() => setOpen(false)}>4. Прохожу</a>
          <a href="#s5" className="toc-link" onClick={() => setOpen(false)}>5. Мышление</a>
          <a href="#s6" className="toc-link" onClick={() => setOpen(false)}>6. Действую</a>
          <a href="#s7" className="toc-link" onClick={() => setOpen(false)}>7. Переключаюсь</a>
          <a href="#s8" className="toc-link" onClick={() => setOpen(false)}>Трекер</a>
          <a href="#s9" className="toc-link" onClick={() => setOpen(false)}>Итог</a>
        </div>
      </div>
    </nav>
  );
}

function CoverPage() {
  return (
    <section
      id="cover"
      className="cover-page rounded-2xl overflow-hidden mb-10"
      style={{
        background: "radial-gradient(ellipse at 30% 20%, #5e2a91 0%, #3b1768 55%, #2a0e52 100%)",
        color: "#fff",
        padding: "60px 40px",
        textAlign: "center",
      }}
    >
      <div className="mb-7" style={{ display: "flex", justifyContent: "center" }}>
        <img
          src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/logo-nalich.png`}
          alt="НаЛичность"
          className="cover-logo"
        />
      </div>
      <div style={{ marginBottom: "20px", marginTop: "36px" }}>
        <span className="pill-gold" style={{ fontSize: "20px", padding: "10px 32px" }}>
          «Чек-лист»
        </span>
      </div>
      <h1
        style={{
          fontFamily: "var(--font-forum), serif",
          fontSize: "clamp(36px, 5vw, 54px)",
          lineHeight: 1.05,
          fontWeight: 400,
          margin: "0",
          maxWidth: "720px",
          marginInline: "auto",
        }}
      >
        «Дневник паники и страха»
      </h1>
      <p
        className="sans mt-4 opacity-80"
        style={{ fontSize: "18px", maxWidth: "36rem", margin: "1rem auto 0" }}
      >
        Этот дневник поможет вам пройти через панику и страх шаг за шагом, вернуть контроль над состоянием и принять решения из позиции взрослого.
      </p>
      <p className="sans italic mt-12 opacity-80">
        <a href="https://na-lichnost.ru/" target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>
          @MethodBataeva
        </a>
      </p>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  rows = 2,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div className="field-row">
      <label className="label">{label}</label>
      <AutoTextarea
        value={value}
        onChange={onChange}
        minRows={rows}
        placeholder={placeholder}
        className={rows === 1 ? "field-input field-input-single" : "field-input field-input-multi"}
      />
    </div>
  );
}

function LevelGroup({
  pill,
  phrases,
  levels,
  setLevel,
}: {
  pill: string;
  phrases: string[];
  levels: boolean[];
  setLevel: (i: number, v: boolean) => void;
}) {
  return (
    <div className="mt-7">
      <div className="mb-3">
        <span className="pill-gold">{pill}</span>
      </div>
      <div className="grid gap-1">
        {phrases.map((phrase, idx) => (
          <button
            key={idx}
            type="button"
            className="level-option flex items-center gap-3 text-left w-full py-2"
            onClick={() => setLevel(idx, !levels[idx])}
          >
            <span className="radio-circle" data-checked={levels[idx]}>
              <span className="radio-inner" />
            </span>
            <span className="level-option-text flex-1">{phrase}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TrackerDay({
  n,
  data,
  onChange,
  onToggleDone,
}: {
  n: number;
  data: DayEntry;
  onChange: (key: keyof DayEntry, v: string | number) => void;
  onToggleDone: () => void;
}) {
  return (
    <div className={`day-card${data.done ? " is-done" : ""}`}>
      <div className="day-head">
        <span className="num-circle">{n}</span>
        <span className="day-title">День {n}</span>
        <button
          type="button"
          onClick={onToggleDone}
          className="step-done sans"
          data-done={data.done}
        >
          {data.done ? "Сделано ✓" : "Отметить"}
        </button>
      </div>
      <div className="day-body">
        <div className="field-row" style={{ margin: "0 0 12px" }}>
          <label className="label" style={{ fontSize: 18 }}>Что активировало страх или панику сегодня:</label>
          <AutoTextarea
            value={data.situation}
            onChange={(v) => onChange("situation", v)}
            minRows={2}
            className="field-input field-input-multi"
            placeholder="Событие, мысль, новость..."
          />
        </div>
        <div className="field-row" style={{ margin: "0 0 12px" }}>
          <label className="label" style={{ fontSize: 18 }}>Как я работал(а) со страхом сегодня:</label>
          <AutoTextarea
            value={data.action}
            onChange={(v) => onChange("action", v)}
            minRows={2}
            className="field-input field-input-multi"
            placeholder="Подышал(а), написал(а), позвонил(а)..."
          />
        </div>
        <div className="field-row" style={{ margin: 0 }}>
          <label className="label" style={{ fontSize: 18 }}>Что помогло вернуть спокойствие:</label>
          <AutoTextarea
            value={data.helped}
            onChange={(v) => onChange("helped", v)}
            minRows={2}
            className="field-input field-input-multi"
            placeholder="Конкретно что помогло..."
          />
        </div>
        <div className="field-row" style={{ margin: "12px 0 0" }}>
          <label className="label" style={{ fontSize: 18 }}>Уровень страха в конце дня (0–10):</label>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            <span className="label" style={{ fontSize: 15, color: "var(--c-muted)" }}>0</span>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={data.scale}
              onChange={(e) => onChange("scale", Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ minWidth: 28, textAlign: "center", fontWeight: 600, color: "var(--c-purple-deep)" }}>
              {data.scale}
            </span>
            <span className="label" style={{ fontSize: 15, color: "var(--c-muted)" }}>10</span>
          </div>
        </div>
      </div>
    </div>
  );
}
