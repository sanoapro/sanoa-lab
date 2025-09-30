export type EqModule = "equilibrio" | "pulso" | "sonrisa" | "mente" | "general";

export type TaskKind =
  | "exercise" // ejercicio físico
  | "breathing" // respiración/relajación
  | "hydration" // hidratación
  | "medication" // toma de medicamento (recordatorio complementario)
  | "habit" // hábito general
  | "custom"; // libre

export interface LibraryTask {
  id: string;
  org_id: string;
  module: EqModule;
  kind: TaskKind;
  title: string;
  description?: string | null;
  active: boolean;
  default_goal?: string | null; // ej. "10 min", "2 L", "x repeticiones"
}
