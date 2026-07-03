import { StudentForm } from "@/components/student-form";

export default function NewStudentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Register Student</h1>
        <p className="text-sm text-muted-foreground">
          Add a new student with profile information and photo
        </p>
      </div>
      <StudentForm mode="create" />
    </div>
  );
}
