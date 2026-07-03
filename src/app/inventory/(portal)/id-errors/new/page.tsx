import { IdErrorForm } from "@/components/id-error-form";

export default function NewIdErrorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Log ID Error
        </h1>
        <p className="text-sm text-muted-foreground">
          Record an ID card printing error for reprint tracking
        </p>
      </div>
      <IdErrorForm />
    </div>
  );
}
