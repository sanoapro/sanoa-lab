// lib/reminders/scheduler.ts
/**
 * Utilidades para asignar canal, respetar ventana horaria y calcular backoff.
 * Mantiene todo sin dependencias externas (timezone simple).
 */

type WindowCfg = {
  now: Date;
  tz: string; // informativo; no aplicamos conversión compleja
  window_start: string; // "HH:MM"
  window_end: string; // "HH:MM"
  days_of_week: number[]; // 0..6 Domingo..Sábado
  channels_priority: ("whatsapp" | "sms")[];
};

export function pickChannelAndWindow(cfg: WindowCfg) {
  const channel = cfg.channels_priority[0] ?? "whatsapp";
  const now = cfg.now;
  const [sH, sM] = cfg.window_start.split(":").map((n: any) => parseInt(n, 10));
  const [eH, eM] = cfg.window_end.split(":").map((n: any) => parseInt(n, 10));

  const start = new Date(now);
  start.setHours(sH, sM, 0, 0);
  const end = new Date(now);
  end.setHours(eH, eM, 0, 0);

  const todayDow = now.getDay();
  const inDay = cfg.days_of_week.includes(todayDow);

  let firstAttemptAt = new Date(now);
  if (!inDay || now < start) {
    // mover a hoy a start si día activo; si no, saltar al próximo día activo a start
    if (inDay && now < start) {
      firstAttemptAt = start;
    } else {
      firstAttemptAt = nextActiveDayAt(cfg.days_of_week, now, sH, sM);
    }
  } else if (now > end) {
    // fuera de ventana -> próximo día activo a start
    firstAttemptAt = nextActiveDayAt(cfg.days_of_week, now, sH, sM);
  }

  return { channel, firstAttemptAt };
}

function nextActiveDayAt(days: number[], base: Date, hour: number, min: number) {
  const d = new Date(base);
  for (let i = 1; i <= 7; i++) {
    const cand = new Date(d.getTime() + i * 24 * 60 * 60 * 1000);
    if (days.includes(cand.getDay())) {
      cand.setHours(hour, min, 0, 0);
      return cand;
    }
  }
  // fallback: mañana
  const tomorrow = new Date(d.getTime() + 24 * 60 * 60 * 1000);
  tomorrow.setHours(hour, min, 0, 0);
  return tomorrow;
}

export function scheduleRetry(opts: {
  now: Date;
  attempt: number; // intento que se va a registrar (1,2,...)
  max_retries: number;
  retry_backoff_min: number;
  tz: string;
  window_start: string;
  window_end: string;
  days_of_week: number[];
}) {
  if (opts.attempt > opts.max_retries)
    return { shouldRetry: false, nextAttemptAt: new Date(opts.now) };
  // backoff exponencial suave: base * 2^(attempt-1)
  const minutes = opts.retry_backoff_min * Math.pow(2, Math.max(0, opts.attempt - 1));
  const baseNext = new Date(opts.now.getTime() + minutes * 60 * 1000);

  // Ajustar a ventana/día activo si cae fuera
  const [sH, sM] = opts.window_start.split(":").map((n: any) => parseInt(n, 10));
  const [eH, eM] = opts.window_end.split(":").map((n: any) => parseInt(n, 10));
  const start = new Date(baseNext);
  start.setHours(sH, sM, 0, 0);
  const end = new Date(baseNext);
  end.setHours(eH, eM, 0, 0);

  let next = baseNext;
  const dow = baseNext.getDay();
  const inDay = opts.days_of_week.includes(dow);

  if (!inDay) {
    next = nextActiveDayAt(opts.days_of_week, baseNext, sH, sM);
  } else if (baseNext < start) {
    next = start;
  } else if (baseNext > end) {
    next = nextActiveDayAt(opts.days_of_week, baseNext, sH, sM);
  }

  return { shouldRetry: true, nextAttemptAt: next };
}

export function buildMessage(args: {
  template_slug: "work_due" | "work_overdue";
  assignment: any;
}) {
  const a = args.assignment;
  const due = a?.due_at ? new Date(a.due_at) : null;
  if (args.template_slug === "work_overdue") {
    return `Hola 👋, te recordamos que tienes una tarea pendiente: “${a?.title ?? "Tarea"}”. Ya está vencida${due ? ` desde ${due.toLocaleString()}` : ""}. ¿Puedes completarla hoy? Gracias.`;
  }
  // work_due
  return `Hola 👋, recuerda tu tarea “${a?.title ?? "Tarea"}”${due ? ` con vencimiento ${due.toLocaleString()}` : ""}. ¡Tú puedes! ✅`;
}
