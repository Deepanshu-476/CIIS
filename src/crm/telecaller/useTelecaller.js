import { createContext, useContext } from "react";
export const TelecallerContext = createContext(null);
export function useTelecaller() {
  const context = useContext(TelecallerContext);
  if (!context) throw new Error("Telecaller pages require TelecallerLayout.");
  return context;
}
