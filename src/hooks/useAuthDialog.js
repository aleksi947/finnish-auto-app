import { useContext } from "react";
import { AuthDialogContext } from "../contexts/AuthDialogContext";

export function useAuthDialog() {
  const context = useContext(AuthDialogContext);

  if (!context) {
    throw new Error("useAuthDialog должен использоваться внутри AuthDialogProvider");
  }

  return context;
}
