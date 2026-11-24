// Status Join Program pendaftar (diisi manual) (diatur admin).
export const EVENT_OPTIONS = [
  { value: "", label: "Belum ikut" },
  { value: "join", label: "Sudah join bisnis" },
  { value: "webinar", label: "Ikut webinar" },
  { value: "seminar", label: "Ikut seminar" },
  { value: "keduanya", label: "Webinar & seminar" },
] as const;

export type EventStatus = (typeof EVENT_OPTIONS)[number]["value"];

export const EVENT_VALUES: string[] = EVENT_OPTIONS.map((o) => o.value);

export function eventLabel(value: string | null | undefined) {
  return EVENT_OPTIONS.find((o) => o.value === (value ?? ""))?.label ?? "Belum ikut";
}

/**
 * Filter event dari query string: "" = semua, "belum" = belum ikut,
 * selain itu harus salah satu nilai event yang valid.
 */
export function eventWhere(filter: string | null | undefined) {
  const f = (filter ?? "").trim();
  if (!f) return {};
  if (f === "belum") return { eventStatus: "" };
  if (EVENT_VALUES.includes(f)) return { eventStatus: f };
  return {};
}
