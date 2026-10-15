import { cn } from "@alrisali/ui/lib/utils";

const Skeleton = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="skeleton"
    className={cn("bg-muted animate-pulse rounded-none", className)}
    {...props}
  />
);

export { Skeleton };
