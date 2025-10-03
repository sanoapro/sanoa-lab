export type LooseDatabase = {
  public: {
    Tables: Record<string, {
      Row: any
      Insert: any
      Update: any
      Relationships: any[]
    }>
    Views: Record<string, {
      Row: any
      Relationships?: any[]
    }>
    Functions: Record<string, {
      Args: any
      Returns: any
    }>
    Enums: Record<string, string | number>
    CompositeTypes: Record<string, any>
  }
}
