import { createContext } from "react";
import { Session } from "@supabase/supabase-js";

export const SessionContext = createContext<{
  session: Session | null;
}>({
  session: null,
});
