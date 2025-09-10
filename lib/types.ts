import type { Database } from "./database.types";
type Public = Database["public"];

export type TableRow<T extends keyof Public["Tables"]>   = Public["Tables"][T]["Row"];
export type TableInsert<T extends keyof Public["Tables"]> = Public["Tables"][T]["Insert"];
export type TableUpdate<T extends keyof Public["Tables"]> = Public["Tables"][T]["Update"];
export type DbEnum<T extends keyof Public["Enums"]>       = Public["Enums"][T];
