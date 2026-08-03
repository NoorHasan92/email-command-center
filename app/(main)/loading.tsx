import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col h-full bg-transparent p-6 lg:p-10 space-y-8 animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-[250px] bg-secondary/50 rounded-xl" />
          <Skeleton className="h-5 w-[350px] bg-secondary/30 rounded-lg" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-32 bg-secondary/20 rounded-2xl" />
          <Skeleton className="h-32 bg-secondary/20 rounded-2xl" />
          <Skeleton className="h-32 bg-secondary/20 rounded-2xl" />
          <Skeleton className="h-32 bg-secondary/20 rounded-2xl" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-[400px] bg-secondary/10 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
