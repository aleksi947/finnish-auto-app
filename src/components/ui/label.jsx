import { forwardRef } from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "./utils";


export const Label = forwardRef(({ className, ...props }, ref) => (
<LabelPrimitive.Root ref={ref} className={cn("text-sm font-medium", className)} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;
