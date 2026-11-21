// Fichier PROVISOIRE (Phase 0).
// Il sera écrasé par les types générés : `npm run db:types` (après la Phase 1).

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {}
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
