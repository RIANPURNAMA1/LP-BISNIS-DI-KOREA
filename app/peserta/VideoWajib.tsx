"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Lock, Pause, Play } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Video wajib tonton: tidak bisa di-skip maupun dipercepat.            */
/* Mendukung YouTube, Vimeo, dan file video langsung (mp4/webm/ogg).    */
/* ------------------------------------------------------------------ */

type Source =
  | { kind: "youtube"; id: string }
  | { kind: "vimeo"; id: string }
  | { kind: "file"; src: string };

/** Kenali jenis video dari URL yang diatur admin. */
function parseSource(raw: string): Source | null {
  const value = raw.trim();
  // File hasil upload admin disajikan lewat /api/video/xxx.mp4
  if (/^\/api\/video\/[A-Za-z0-9._-]+\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(value))
    return { kind: "file", src: value };
  if (/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(value)) return { kind: "file", src: value };
  try {
    const u = new URL(value);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be" && u.pathname.length > 1)
      return { kind: "youtube", id: u.pathname.slice(1) };
    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = u.pathname === "/watch" ? u.searchParams.get("v") : null;
      if (v) return { kind: "youtube", id: v };
      const m = u.pathname.match(/^\/(?:embed|shorts)\/([\w-]+)/);
      if (m) return { kind: "youtube", id: m[1] };
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const m = u.pathname.match(/(\d+)\/?$/);
      if (m) return { kind: "vimeo", id: m[1] };
    }
    if (/\.(mp4|webm|ogg|mov|m4v)$/i.test(u.pathname)) return { kind: "file", src: value };
  } catch {
    /* URL tidak valid */
  }
  return null;
}

/** Adapter tipis agar UI yang sama bisa mengendalikan ketiga jenis pemutar. */
type Engine = {
  play: () => void;
  pause: () => void;
  seek: (s: number) => void;
  resetRate: () => void;
  destroy: () => void;
};

type Callbacks = {
  onReady: (duration: number) => void;
  onTime: (t: number, duration: number) => void;
  onPlaying: (playing: boolean) => void;
  onRate: (rate: number) => void;
  onEnd: () => void;
};

/* ---- loader skrip pihak ketiga (sekali saja) ---- */
const scripts = new Map<string, Promise<void>>();
function loadScript(src: string) {
  let p = scripts.get(src);
  if (!p) {
    p = new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        scripts.delete(src);
        reject(new Error("load"));
      };
      document.head.appendChild(s);
    });
    scripts.set(src, p);
  }
  return p;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function createYouTube(host: HTMLElement, id: string, cb: Callbacks): Promise<Engine> {
  const w = window as any;
  if (!w.YT?.Player) {
    await new Promise<void>((resolve, reject) => {
      const prev = w.onYouTubeIframeAPIReady;
      w.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve();
      };
      loadScript("https://www.youtube.com/iframe_api").catch(reject);
    });
  }
  const mount = document.createElement("div");
  host.appendChild(mount);
  const player = await new Promise<any>((resolve) => {
    const p = new w.YT.Player(mount, {
      videoId: id,
      width: "100%",
      height: "100%",
      playerVars: {
        controls: 0,
        disablekb: 1,
        fs: 0,
        rel: 0,
        modestbranding: 1,
        iv_load_policy: 3,
        playsinline: 1,
      },
      events: {
        onReady: () => resolve(p),
        onStateChange: (e: any) => {
          cb.onPlaying(e.data === 1);
          if (e.data === 0) cb.onEnd();
        },
        onPlaybackRateChange: (e: any) => cb.onRate(e.data),
      },
    });
  });
  cb.onReady(player.getDuration() || 0);
  // YouTube tidak punya event seek: pantau posisi secara berkala.
  const timer = window.setInterval(() => {
    cb.onTime(player.getCurrentTime() || 0, player.getDuration() || 0);
  }, 400);
  return {
    play: () => player.playVideo(),
    pause: () => player.pauseVideo(),
    seek: (s) => player.seekTo(s, true),
    resetRate: () => player.setPlaybackRate(1),
    destroy: () => {
      window.clearInterval(timer);
      player.destroy?.();
    },
  };
}

async function createVimeo(host: HTMLElement, id: string, cb: Callbacks): Promise<Engine> {
  await loadScript("https://player.vimeo.com/api/player.js");
  const iframe = document.createElement("iframe");
  iframe.src = `https://player.vimeo.com/video/${id}?controls=0&keyboard=0&playsinline=1&pip=0`;
  iframe.allow = "autoplay; encrypted-media";
  host.appendChild(iframe);
  const player = new (window as any).Vimeo.Player(iframe);
  cb.onReady(await player.getDuration());
  player.on("timeupdate", (d: any) => cb.onTime(d.seconds, d.duration));
  player.on("play", () => cb.onPlaying(true));
  player.on("pause", () => cb.onPlaying(false));
  player.on("ended", () => cb.onEnd());
  player.on("playbackratechange", (d: any) => cb.onRate(d.playbackRate));
  return {
    play: () => void player.play(),
    pause: () => void player.pause(),
    seek: (s) => void player.setCurrentTime(s),
    resetRate: () => void player.setPlaybackRate(1),
    destroy: () => void player.destroy(),
  };
}

async function createFile(host: HTMLElement, src: string, cb: Callbacks): Promise<Engine> {
  const v = document.createElement("video");
  v.src = src;
  v.playsInline = true;
  v.preload = "metadata";
  v.disablePictureInPicture = true;
  v.setAttribute("controlsList", "nodownload noplaybackrate noremoteplayback");
  v.className = "h-full w-full bg-black";
  v.oncontextmenu = (e) => e.preventDefault();
  host.appendChild(v);
  v.onloadedmetadata = () => cb.onReady(v.duration || 0);
  v.ontimeupdate = () => cb.onTime(v.currentTime, v.duration || 0);
  v.onplay = () => cb.onPlaying(true);
  v.onpause = () => cb.onPlaying(false);
  v.onended = () => cb.onEnd();
  v.onratechange = () => cb.onRate(v.playbackRate);
  v.onerror = () => cb.onReady(-1);
  return {
    play: () => void v.play(),
    pause: () => v.pause(),
    seek: (s) => {
      v.currentTime = s;
    },
    resetRate: () => {
      v.playbackRate = 1;
    },
    destroy: () => {
      v.pause();
      v.removeAttribute("src");
      v.load();
      v.remove();
    },
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const fmt = (s: number) => {
  const t = Math.max(0, Math.floor(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

export default function VideoWajib({
  url,
  onDone,
}: {
  url: string;
  /** Dipanggil sekali ketika video diputar sampai habis. */
  onDone: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const maxRef = useRef(0); // posisi terjauh yang sudah ditonton
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [warn, setWarn] = useState("");

  useEffect(() => {
    const host = hostRef.current;
    const source = parseSource(url);
    if (!host || !source) {
      setStatus("error");
      return;
    }
    let cancelled = false;
    let warnTimer: number | undefined;
    const flash = (msg: string) => {
      setWarn(msg);
      window.clearTimeout(warnTimer);
      warnTimer = window.setTimeout(() => setWarn(""), 2500);
    };

    const cb: Callbacks = {
      onReady: (d) => {
        if (d < 0) return setStatus("error");
        setDuration(d);
        setStatus("ready");
      },
      onTime: (t, d) => {
        if (d) setDuration(d);
        // Loncat maju melewati batas tonton: kembalikan ke posisi terjauh.
        if (t > maxRef.current + 2) {
          engineRef.current?.seek(maxRef.current);
          flash("Video tidak dapat dilewati. Tonton sampai selesai.");
          return;
        }
        if (t > maxRef.current) maxRef.current = t;
        setCurrent(maxRef.current);
      },
      onPlaying: setPlaying,
      onRate: (r) => {
        if (r !== 1) {
          engineRef.current?.resetRate();
          flash("Kecepatan video tidak dapat diubah.");
        }
      },
      onEnd: () => {
        if (doneRef.current) return;
        doneRef.current = true;
        setPlaying(false);
        onDoneRef.current();
      },
    };

    const make =
      source.kind === "youtube"
        ? createYouTube(host, source.id, cb)
        : source.kind === "vimeo"
          ? createVimeo(host, source.id, cb)
          : createFile(host, source.src, cb);

    make
      .then((engine) => {
        if (cancelled) engine.destroy();
        else engineRef.current = engine;
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      window.clearTimeout(warnTimer);
      engineRef.current?.destroy();
      engineRef.current = null;
      host.innerHTML = "";
    };
  }, [url]);

  const toggle = () => (playing ? engineRef.current?.pause() : engineRef.current?.play());
  const pct = duration ? Math.min(100, (current / duration) * 100) : 0;

  return (
    <div>
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        <div
          ref={hostRef}
          className="absolute inset-0 [&>div]:h-full [&>div]:w-full [&_iframe]:h-full [&_iframe]:w-full"
        />

        {/* Lapisan penghalang: pemutar tidak bisa diklik/diseret langsung. */}
        <button
          type="button"
          aria-label={playing ? "Jeda video" : "Putar video"}
          disabled={status !== "ready"}
          onClick={toggle}
          className="absolute inset-0 grid place-items-center focus:outline-none"
        >
          {status === "loading" && <Loader2 className="h-9 w-9 animate-spin text-white" />}
          {status === "ready" && !playing && (
            <span className="grid h-16 w-16 place-items-center rounded-full bg-white/90 text-slate-900 shadow-lg">
              <Play className="ml-1 h-7 w-7" />
            </span>
          )}
          {status === "error" && (
            <span className="px-6 text-center text-sm text-white">
              Video tidak dapat dimuat. Muat ulang halaman atau hubungi admin.
            </span>
          )}
        </button>

        {warn && (
          <div
            role="status"
            className="pointer-events-none absolute inset-x-3 top-3 rounded-lg bg-slate-900/90 px-3 py-2 text-center text-xs font-medium text-white"
          >
            {warn}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 bg-slate-900 px-4 py-2.5 text-white">
        <button
          type="button"
          aria-label={playing ? "Jeda" : "Putar"}
          disabled={status !== "ready"}
          onClick={toggle}
          className="shrink-0 disabled:opacity-40"
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20"
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full bg-[#4da3ff] transition-[width] duration-300" style={{ width: `${pct}%` }} />
        </div>
        <span className="shrink-0 text-xs tabular-nums text-white/80">
          {fmt(current)} / {fmt(duration)}
        </span>
        <Lock className="h-3.5 w-3.5 shrink-0 text-white/50" aria-label="Tidak dapat di-skip" />
      </div>
    </div>
  );
}
