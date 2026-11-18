"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EVENT_OPTIONS } from "@/lib/event";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  CalendarRange,
  Loader2,
  MessageCircle,
  Minus,
  RefreshCw,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type ChartItem = { label: string; value: number };
type Day = { date: string; count: number };

type Stats = {
  total: number;
  today: number;
  week: number;
  month: number;
  prev: { today: number; week: number; month: number };
  daily: Day[];
  byProvinsi: ChartItem[];
  byStatus: ChartItem[];
  byIde: ChartItem[];
  bySumber: ChartItem[];
  byEvent: ChartItem[];
  eventPeople: Record<
    string,
    {
      count: number;
      people: { id: number; nama: string; whatsapp: string; domisili: string; createdAt?: string }[];
    }
  >;
  recent: {
    id: number;
    nama: string;
    email: string;
    provinsi: string;
    kabupaten: string;
    status: string;
    createdAt?: string;
    created_at?: string;
  }[];
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const BRAND = "#0052A4";
// Palet kategori: satu keluarga warna biru + abu, agar tenang dan konsisten.
const PALETTE = ["#0052A4", "#3B82C4", "#7FB0DD", "#B7D2EC", "#64748B", "#CBD5E1"];

const card = "rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60";

function fmtDay(dateStr: string, withYear = false) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

function timeAgo(iso?: string) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (isNaN(t)) return "";
  const diff = Math.max(0, Date.now() - t);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

/** Angka naik perlahan dari 0 saat pertama tampil. */
function useCountUp(target: number, duration = 700) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setVal(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/* ------------------------------------------------------------------ */
/* KPI card                                                            */
/* ------------------------------------------------------------------ */

function Sparkline({ data }: { data: number[] }) {
  const w = 96;
  const h = 32;
  const max = Math.max(...data, 1);
  const step = w / Math.max(data.length - 1, 1);
  const pts = data.map((v, i) => [i * step, h - 3 - (v / max) * (h - 6)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0" aria-hidden>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={BRAND} opacity={0.08} />
      <path d={line} fill="none" stroke={BRAND} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function Delta({ cur, prev, label }: { cur: number; prev: number; label: string }) {
  const diff = cur - prev;
  const Icon = diff > 0 ? ArrowUpRight : diff < 0 ? ArrowDownRight : Minus;
  const tone =
    diff > 0 ? "text-emerald-700 bg-emerald-50" : diff < 0 ? "text-rose-700 bg-rose-50" : "text-slate-500 bg-slate-100";
  const pct = prev > 0 ? Math.round((Math.abs(diff) / prev) * 100) : null;
  return (
    <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
      <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-semibold ${tone}`}>
        <Icon className="h-3 w-3" />
        {diff === 0 ? "0" : `${diff > 0 ? "+" : "−"}${Math.abs(diff)}`}
        {pct !== null && diff !== 0 ? ` (${pct}%)` : ""}
      </span>
      {label}
    </p>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  spark,
  delta,
  delay = 0,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  spark: number[];
  delta?: { prev: number; label: string };
  delay?: number;
}) {
  const shown = useCountUp(value);
  return (
    <div
      className={`${card} reveal p-5 transition-shadow hover:shadow-md`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#0052A4]/10 text-[#0052A4]">
              <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
            </span>
            {label}
          </p>
          <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-slate-900">{shown}</p>
        </div>
        <Sparkline data={spark} />
      </div>
      {delta ? (
        <Delta cur={value} prev={delta.prev} label={delta.label} />
      ) : (
        <p className="mt-3 text-xs text-slate-400">Seluruh waktu</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Area chart (interaktif)                                             */
/* ------------------------------------------------------------------ */

const RANGES = [
  { key: 7, label: "7 hari" },
  { key: 14, label: "14 hari" },
  { key: 30, label: "30 hari" },
] as const;

function TrendChart({ daily, delay = 0 }: { daily: Day[]; delay?: number }) {
  const [range, setRange] = useState<7 | 14 | 30>(14);
  const [hover, setHover] = useState<number | null>(null);
  const [ref, width] = useWidth<HTMLDivElement>();

  const data = useMemo(() => daily.slice(-range), [daily, range]);
  const total = data.reduce((a, d) => a + d.count, 0);
  const avg = data.length ? total / data.length : 0;

  const H = 240;
  const pad = { l: 34, r: 12, t: 16, b: 28 };
  const innerW = Math.max(width - pad.l - pad.r, 10);
  const innerH = H - pad.t - pad.b;
  const rawMax = Math.max(...data.map((d) => d.count), 1);
  const niceMax = rawMax <= 4 ? 4 : Math.ceil(rawMax / 4) * 4;
  const x = (i: number) => pad.l + (data.length > 1 ? (i / (data.length - 1)) * innerW : innerW / 2);
  const y = (v: number) => pad.t + innerH - (v / niceMax) * innerH;

  const pts = data.map((d, i) => [x(i), y(d.count)] as const);
  // kurva halus (Catmull-Rom → Bezier) agar tidak patah-patah
  const clamp = (v: number) => Math.min(Math.max(v, y(niceMax)), y(0));
  const line = pts
    .map(([px, py], i) => {
      if (i === 0) return `M${px},${py}`;
      const [x0, y0] = pts[i - 1];
      const [xm, ym] = pts[i - 2] ?? pts[i - 1];
      const [xn, yn] = pts[i + 1] ?? pts[i];
      const c1x = x0 + (px - xm) / 6;
      const c1y = y0 + (py - ym) / 6;
      const c2x = px - (xn - x0) / 6;
      const c2y = py - (yn - y0) / 6;
      return `C${c1x},${clamp(c1y)} ${c2x},${clamp(c2y)} ${px},${py}`;
    })
    .join(" ");
  const area = pts.length ? `${line} L${pts[pts.length - 1][0]},${y(0)} L${pts[0][0]},${y(0)} Z` : "";

  const ticks = [0, 1, 2, 3, 4].map((i) => Math.round((niceMax / 4) * i));
  const labelEvery = Math.ceil(data.length / (width < 480 ? 4 : 7));

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = e.clientX - rect.left - pad.l;
    const idx = Math.round((rel / innerW) * (data.length - 1));
    setHover(Math.min(Math.max(idx, 0), data.length - 1));
  }

  const hovered = hover !== null ? data[hover] : null;

  return (
    <section className={`${card} reveal p-5`} style={{ animationDelay: `${delay}ms` }}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Tren pendaftaran</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{total}</span> pendaftar dalam {range} hari · rata-rata{" "}
            <span className="font-semibold text-slate-700">{avg.toFixed(1)}</span> per hari
          </p>
        </div>
        <div className="inline-flex rounded-full bg-slate-100 p-0.5 text-xs font-medium">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-full px-3 py-1 transition-colors ${
                range === r.key ? "bg-white text-[#0052A4] shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      <div ref={ref} className="relative mt-4">
        {width > 0 && (
          <svg
            width={width}
            height={H}
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
            className="block cursor-crosshair"
          >
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={BRAND} stopOpacity={0.22} />
                <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
              </linearGradient>
            </defs>

            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={pad.l}
                  x2={width - pad.r}
                  y1={y(t)}
                  y2={y(t)}
                  stroke="#E2E8F0"
                  strokeDasharray={t === 0 ? "0" : "3 4"}
                />
                <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#94A3B8">
                  {t}
                </text>
              </g>
            ))}

            {data.map((d, i) =>
              i % labelEvery === 0 || i === data.length - 1 ? (
                <text key={d.date} x={x(i)} y={H - 8} textAnchor="middle" fontSize={11} fill="#94A3B8">
                  {fmtDay(d.date)}
                </text>
              ) : null
            )}

            <path key={`a-${range}`} d={area} fill="url(#trendFill)" className="fade-in" />
            <path
              key={`l-${range}`}
              d={line}
              pathLength={1}
              className="draw-line"
              fill="none"
              stroke={BRAND}
              strokeWidth={2.25}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {hover !== null && (
              <g>
                <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={y(0)} stroke={BRAND} strokeOpacity={0.35} />
                <circle cx={x(hover)} cy={y(data[hover].count)} r={5} fill="#fff" stroke={BRAND} strokeWidth={2.5} />
              </g>
            )}
          </svg>
        )}

        {hovered && hover !== null && width > 0 && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg"
            style={{
              left: Math.min(Math.max(x(hover), 56), width - 56),
              top: Math.max(y(hovered.count) - 58, 0),
            }}
          >
            <p className="text-slate-300">{fmtDay(hovered.date, true)}</p>
            <p className="mt-0.5 font-semibold">{hovered.count} pendaftar</p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Donut (interaktif)                                                  */
/* ------------------------------------------------------------------ */

const DONUT_TOP = 5;

function Donut({
  data: allData,
  title,
  delay = 0,
  top = DONUT_TOP,
}: {
  data: ChartItem[];
  title: string;
  delay?: number;
  top?: number;
}) {
  const [active, setActive] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Tampilkan hanya yang terbanyak; sisanya digabung jadi satu irisan "Lainnya".
  const sorted = [...allData].sort((a, b) => b.value - a.value);
  const rest = sorted.slice(top);
  const data: ChartItem[] =
    rest.length > 0
      ? [
          ...sorted.slice(0, top),
          { label: `Lainnya (${rest.length})`, value: rest.reduce((s, d) => s + d.value, 0) },
        ]
      : sorted;
  const total = data.reduce((s, d) => s + d.value, 0);

  const R = 56;
  const C = 2 * Math.PI * R;
  let offset = 0;
  const arcs = data.map((d, i) => {
    const frac = total ? d.value / total : 0;
    const len = frac * C;
    const arc = { ...d, i, len, offset, frac, color: PALETTE[i % PALETTE.length] };
    offset += len;
    return arc;
  });

  const cur = active !== null ? arcs[active] : null;

  return (
    <section className={`${card} reveal p-5`} style={{ animationDelay: `${delay}ms` }}>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      {total === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">Belum ada data</p>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row xl:flex-col 2xl:flex-row">
          <div className="relative h-40 w-40 shrink-0">
            <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
              <circle cx="70" cy="70" r={R} fill="none" stroke="#F1F5F9" strokeWidth="18" />
              {arcs.map((a) => (
                <circle
                  key={a.label}
                  cx="70"
                  cy="70"
                  r={R}
                  fill="none"
                  stroke={a.color}
                  strokeWidth={active === a.i ? 22 : 18}
                  strokeDasharray={`${mounted ? Math.max(a.len - (arcs.length > 1 ? 2 : 0), 0) : 0} ${C}`}
                  strokeDashoffset={-a.offset}
                  opacity={active === null || active === a.i ? 1 : 0.35}
                  className="cursor-pointer"
                  style={{
                    transition: `stroke-dasharray 900ms cubic-bezier(0.16,1,0.3,1) ${delay + 200 + a.i * 90}ms, stroke-width 200ms, opacity 200ms`,
                  }}
                  onMouseEnter={() => setActive(a.i)}
                  onMouseLeave={() => setActive(null)}
                />
              ))}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold tabular-nums text-slate-900">
                {cur ? `${Math.round(cur.frac * 100)}%` : total}
              </span>
              <span className="max-w-[88px] truncate text-[11px] text-slate-500">{cur ? cur.label : "Total"}</span>
            </div>
          </div>

          <ul className="w-full min-w-0 flex-1 space-y-1">
            {arcs.map((a) => (
              <li
                key={a.label}
                onMouseEnter={() => setActive(a.i)}
                onMouseLeave={() => setActive(null)}
                className={`flex cursor-default items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                  active === a.i ? "bg-slate-100" : ""
                }`}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: a.color }} />
                <span className="min-w-0 flex-1 truncate text-slate-700" title={a.label}>
                  {a.label}
                </span>
                <span className="font-semibold tabular-nums text-slate-900">{a.value}</span>
                <span className="w-10 text-right text-xs tabular-nums text-slate-400">
                  {Math.round(a.frac * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Ranking bars                                                        */
/* ------------------------------------------------------------------ */

function RankBars({
  data,
  title,
  unit,
  delay = 0,
}: {
  data: ChartItem[];
  title: string;
  unit: string;
  delay?: number;
}) {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const max = Math.max(...data.map((d) => d.value), 1);
  const rows = data.slice(0, 8);

  return (
    <section className={`${card} reveal p-5`} style={{ animationDelay: `${delay}ms` }}>
      <header className="flex items-baseline justify-between">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <span className="text-xs text-slate-400">{unit}</span>
      </header>
      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">Belum ada data</p>
      ) : (
        <ul className="mt-4 space-y-1">
          {rows.map((d, i) => (
            <li
              key={d.label}
              onMouseEnter={() => setActive(d.label)}
              onMouseLeave={() => setActive(null)}
              className={`rounded-lg px-2 py-1.5 transition-colors ${active === d.label ? "bg-slate-50" : ""}`}
            >
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-slate-700" title={d.label}>
                  {d.label}
                </span>
                <span className="shrink-0 tabular-nums">
                  <span className="font-semibold text-slate-900">{d.value}</span>
                  <span className="ml-1.5 text-xs text-slate-400">{Math.round((d.value / total) * 100)}%</span>
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-[width] duration-700 ease-out"
                  style={{
                    width: mounted ? `${(d.value / max) * 100}%` : "0%",
                    transitionDelay: `${delay + 250 + i * 60}ms`,
                    backgroundColor: BRAND,
                    opacity: active === null || active === d.label ? 1 : 0.35,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Pendaftar terbaru                                                   */
/* ------------------------------------------------------------------ */

function Recent({ items, delay = 0 }: { items: Stats["recent"]; delay?: number }) {
  return (
    <section className={`${card} reveal flex flex-col overflow-hidden`} style={{ animationDelay: `${delay}ms` }}>
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-bold text-slate-900">Pendaftar terbaru</h3>
        <Link
          href="/admin/pendaftaran"
          className="group inline-flex items-center gap-1 text-xs font-medium text-[#0052A4] hover:underline"
        >
          Lihat semua
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </header>
      {items.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-slate-400">Belum ada pendaftar.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((r, idx) => {
            const domisili = r.provinsi === "Luar Negeri" ? r.kabupaten : r.provinsi || r.kabupaten;
            return (
              <li key={r.id} className="reveal" style={{ animationDelay: `${delay + 150 + idx * 70}ms` }}>
                <Link
                  href={`/admin/pendaftaran/${r.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{r.nama}</p>
                    <p className="truncate text-xs text-slate-500">
                      {[domisili, r.status].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{timeAgo(r.createdAt || r.created_at)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Peserta per status event                                            */
/* ------------------------------------------------------------------ */

const EVENT_DOT: Record<string, string> = {
  "": "bg-slate-400",
  webinar: "bg-sky-500",
  seminar: "bg-emerald-500",
  keduanya: "bg-[#0052A4]",
};

function waHref(raw: string) {
  let n = raw.replace(/\D/g, "");
  if (!n) return "";
  if (n.startsWith("00")) n = n.slice(2);
  else if (n.startsWith("0")) n = "62" + n.slice(1);
  return `https://wa.me/${n}`;
}

function EventPeople({ data, delay = 0 }: { data: Stats["eventPeople"]; delay?: number }) {
  const [tab, setTab] = useState<string>("webinar");
  const current = data?.[tab] ?? { count: 0, people: [] };
  const option = EVENT_OPTIONS.find((o) => o.value === tab) ?? EVENT_OPTIONS[0];
  // "belum ikut" dipakai sebagai filter khusus di halaman data pendaftar
  const filterParam = tab === "" ? "belum" : tab;

  return (
    <section className={`${card} reveal overflow-hidden`} style={{ animationDelay: `${delay}ms` }}>
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Peserta berdasarkan status event</h3>
          <p className="mt-0.5 text-xs text-slate-500">Pendaftar terbaru di setiap kelompok.</p>
        </div>
        <Link
          href={`/admin/pendaftaran?event=${filterParam}`}
          className="group inline-flex items-center gap-1 text-xs font-medium text-[#0052A4] hover:underline"
        >
          Lihat semua ({current.count})
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </header>

      <div className="mt-4 flex gap-1 overflow-x-auto px-5">
        {EVENT_OPTIONS.map((o) => {
          const active = tab === o.value;
          return (
            <button
              key={o.value || "belum"}
              onClick={() => setTab(o.value)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                active ? "bg-[#0052A4] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-white" : EVENT_DOT[o.value]}`} />
              {o.label}
              <span
                className={`rounded-full px-1.5 py-px text-[10px] tabular-nums ${
                  active ? "bg-white/20 text-white" : "bg-white text-slate-500"
                }`}
              >
                {data?.[o.value]?.count ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {current.people.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-slate-400">
          Belum ada pendaftar dengan status &ldquo;{option.label}&rdquo;.
        </p>
      ) : (
        <ul key={tab} className="mt-4 grid divide-y divide-slate-100 border-t border-slate-100 md:grid-cols-2 md:divide-y-0">
          {current.people.map((p, i) => {
            const wa = waHref(p.whatsapp);
            return (
              <li
                key={p.id}
                className="reveal flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-slate-50 md:border-b md:border-slate-100"
                style={{ animationDelay: `${i * 40}ms`, animationDuration: "0.4s" }}
              >
                <Link href={`/admin/pendaftaran/${p.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{p.nama}</p>
                  <p className="truncate text-xs text-slate-500">
                    {[p.domisili, timeAgo(p.createdAt)].filter(Boolean).join(" · ")}
                  </p>
                </Link>
                {wa && (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Chat ${p.whatsapp}`}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{p.whatsapp}</span>
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(
    (silent = false) => {
      if (silent) setRefreshing(true);
      return fetch("/api/pendaftaran/stats", { cache: "no-store" })
        .then((r) => {
          if (r.status === 401) {
            router.replace("/admin/login");
            throw new Error("Sesi berakhir. Silakan login kembali.");
          }
          if (!r.ok) throw new Error("Gagal memuat statistik");
          return r.json();
        })
        .then((json) => {
          setStats(json.data);
          setUpdatedAt(new Date());
          setError("");
        })
        .catch((e) => setError(e.message))
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        });
    },
    [router]
  );

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#0052A4]" />
          <p className="mt-3 text-sm text-slate-500">Memuat statistik...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-8 py-6 text-center">
          <AlertCircle className="mx-auto mb-2 h-6 w-6 text-red-500" />
          <p className="text-sm font-medium text-red-700">{error}</p>
          <button
            onClick={() => load()}
            className="mt-3 text-sm font-medium text-red-600 underline hover:text-red-800"
          >
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const last14 = stats.daily.slice(-14);
  const spark = last14.map((d) => d.count);
  // total kumulatif 14 hari terakhir untuk sparkline "Total"
  let run = stats.total - spark.reduce((a, b) => a + b, 0);
  const sparkTotal = spark.map((v) => (run += v));

  return (
    <div className="space-y-6">
      <div className="reveal flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Ringkasan</h2>
          <p className="text-sm text-slate-500">Pantau pendaftaran program secara ringkas.</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {updatedAt && (
            <span>
              Diperbarui {updatedAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 font-medium text-slate-700 shadow-sm ring-1 ring-slate-200/60 transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Muat ulang
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* KPI */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Users} label="Total pendaftar" value={stats.total} spark={sparkTotal} delay={80} />
        <KpiCard
          icon={CalendarCheck}
          label="Hari ini"
          value={stats.today}
          spark={spark}
          delta={{ prev: stats.prev.today, label: "dibanding kemarin" }}
          delay={150}
        />
        <KpiCard
          icon={CalendarRange}
          label="Minggu ini"
          value={stats.week}
          spark={spark}
          delta={{ prev: stats.prev.week, label: "dibanding minggu lalu" }}
          delay={220}
        />
        <KpiCard
          icon={TrendingUp}
          label="Bulan ini"
          value={stats.month}
          spark={spark}
          delta={{ prev: stats.prev.month, label: "dibanding bulan lalu" }}
          delay={290}
        />
      </div>

      {/* Tren + terbaru */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <TrendChart daily={stats.daily} delay={360} />
        </div>
        <Recent items={stats.recent} delay={430} />
      </div>

      {/* Sebaran */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Donut data={stats.byStatus} title="Status pendaftar" delay={500} />
        <Donut data={stats.byIde} title="Kesiapan bisnis" delay={570} />
        <Donut data={stats.byEvent ?? []} title="Keikutsertaan event" delay={640} />
      </div>
      <EventPeople data={stats.eventPeople} delay={700} />

      <div className="grid gap-6 lg:grid-cols-2">
        <RankBars data={stats.byProvinsi} title="Asal daerah / negara" unit="pendaftar" delay={640} />
        <RankBars data={stats.bySumber} title="Sumber informasi" unit="pendaftar" delay={710} />
      </div>
    </div>
  );
}
