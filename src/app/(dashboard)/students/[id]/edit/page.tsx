"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StudentForm } from "@/components/student-form";
import { mergeScheduleWithDefaults, type ScheduleSlot } from "@/lib/schedule";
import { toast } from "sonner";

type Student = {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  course: string | null;
  yearLevel: string | null;
  studentType: "SA" | "HK";
  assignment: "COMLAB" | "ID_STATION" | "ITS_OFFICE";
  photoUrl: string | null;
  scheduleSlots: ScheduleSlot[];
};

export default function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);

  useEffect(() => {
    params.then(async ({ id }) => {
      const response = await fetch(`/api/students/${id}`);
      if (!response.ok) {
        toast.error("Student not found");
        router.push("/students");
        return;
      }
      setStudent(await response.json());
    });
  }, [params, router]);

  if (!student) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Student</h1>
        <p className="text-sm text-muted-foreground">
          Update {student.firstName} {student.lastName}&apos;s profile
        </p>
      </div>
      <StudentForm
        mode="edit"
        studentDbId={student.id}
        initialValues={{
          studentId: student.studentId,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email ?? "",
          phone: student.phone ?? "",
          course: student.course ?? "",
          yearLevel: student.yearLevel ?? "",
          studentType: student.studentType,
          assignment: student.assignment,
          photoUrl: student.photoUrl,
          schedule: mergeScheduleWithDefaults(student.scheduleSlots ?? []),
        }}
      />
    </div>
  );
}
