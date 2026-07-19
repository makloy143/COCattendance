"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhotoUpload } from "@/components/photo-upload";
import { StudentScheduleForm } from "@/components/student-schedule-form";
import type { StudentFormValues } from "@/lib/validations";
import {
  createDefaultSchedule,
  mergeScheduleWithDefaults,
  normalizeScheduleSlots,
  type ScheduleSlot,
} from "@/lib/schedule";
import { scheduleSchema } from "@/lib/validations";
import { getStudentAssignmentLabel } from "@/lib/student-assignment";
import { STUDENT_TYPES, STUDENT_TYPE_LABELS } from "@/lib/student-type";
import {
  getDepartmentLabel,
  type Department,
} from "@/lib/departments";
import type { CatalogOption } from "@/lib/option-code";
import { enrollFaceFromFile } from "@/lib/face-recognition";

type StudentFormProps = {
  mode: "create" | "edit";
  initialValues?: Partial<StudentFormValues> & {
    photoUrl?: string | null;
    schedule?: ScheduleSlot[];
  };
  studentDbId?: string;
};

const emptyValues: StudentFormValues = {
  studentId: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  course: "",
  yearLevel: "",
  studentType: "SA",
  assignment: "REGISTRAR",
  department: "ITSD",
};

export function StudentForm({ mode, initialValues, studentDbId }: StudentFormProps) {
  const router = useRouter();
  const { schedule: initialSchedule, photoUrl, ...initialFormValues } =
    initialValues ?? {};
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [values, setValues] = useState<StudentFormValues>({
    ...emptyValues,
    ...initialFormValues,
  });
  const [schedule, setSchedule] = useState<ScheduleSlot[]>(
    initialSchedule?.length
      ? mergeScheduleWithDefaults(initialSchedule)
      : createDefaultSchedule()
  );
  const [canSelectDepartment, setCanSelectDepartment] = useState(false);
  const [fixedDepartment, setFixedDepartment] = useState<Department | null>(
    null
  );
  const [departments, setDepartments] = useState<CatalogOption[]>([]);
  const [assignments, setAssignments] = useState<CatalogOption[]>([]);

  useEffect(() => {
    async function loadFormOptions() {
      try {
        const [sessionResponse, departmentsResponse, assignmentsResponse] =
          await Promise.all([
            fetch("/api/auth"),
            fetch("/api/options/departments"),
            fetch("/api/options/assignments"),
          ]);

        if (departmentsResponse.ok) {
          const departmentsData = await departmentsResponse.json();
          setDepartments(departmentsData);
        }

        if (assignmentsResponse.ok) {
          const assignmentsData = await assignmentsResponse.json();
          setAssignments(assignmentsData);
        }

        if (!sessionResponse.ok) return;
        const data = await sessionResponse.json();
        const isSuperAdmin = data.role === "SUPER_ADMIN";
        setCanSelectDepartment(isSuperAdmin);
        if (!isSuperAdmin && data.department) {
          setFixedDepartment(data.department);
          setValues((current) => ({
            ...current,
            department: data.department,
          }));
        }
      } catch {
        // Session/options info is optional for rendering the rest of the form.
      }
    }

    void loadFormOptions();
  }, []);

  function updateField(field: keyof StudentFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const normalizedSchedule = normalizeScheduleSlots(
      schedule.length ? schedule : createDefaultSchedule()
    );
    const scheduleValidation = scheduleSchema.safeParse(normalizedSchedule);
    if (!scheduleValidation.success) {
      toast.error(
        scheduleValidation.error.issues[0]?.message ?? "Invalid schedule"
      );
      return;
    }

    setLoading(true);

    const formData = new FormData();
    (Object.keys(emptyValues) as (keyof StudentFormValues)[]).forEach((key) => {
      formData.append(key, values[key] ?? "");
    });
    formData.append("schedule", JSON.stringify(scheduleValidation.data));
    if (photoFile) {
      formData.append("photo", photoFile);
    }

    const url =
      mode === "create" ? "/api/students" : `/api/students/${studentDbId}`;
    const method = mode === "create" ? "POST" : "PUT";

    try {
      const response = await fetch(url, { method, body: formData });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Something went wrong");
        return;
      }

      if (photoFile && data.id) {
        const enroll = await enrollFaceFromFile(data.id, photoFile);
        if (enroll.ok) {
          toast.success(
            mode === "create"
              ? "Student registered and face enrolled"
              : "Student updated and face enrolled"
          );
        } else {
          toast.success(
            mode === "create"
              ? "Student registered successfully"
              : "Student updated"
          );
          toast.warning(
            enroll.error ??
              "Photo saved, but face could not be enrolled for recognition"
          );
        }
      } else {
        toast.success(
          mode === "create"
            ? "Student registered successfully"
            : "Student updated"
        );
      }

      router.push(`/students/${data.id}`);
      router.refresh();
    } catch {
      toast.error("Failed to save student");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile Photo</CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoUpload
            existingPhotoUrl={photoUrl}
            onFileChange={setPhotoFile}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Student Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="studentId">Student ID</Label>
            <Input
              id="studentId"
              value={values.studentId}
              onChange={(e) => updateField("studentId", e.target.value)}
              placeholder="2024-001"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              value={values.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              value={values.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="course">Course / Program</Label>
            <Input
              id="course"
              value={values.course}
              onChange={(e) => updateField("course", e.target.value)}
              placeholder="BS Information Technology"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="yearLevel">Year level</Label>
            <Input
              id="yearLevel"
              value={values.yearLevel}
              onChange={(e) => updateField("yearLevel", e.target.value)}
              placeholder="1st Year"
            />
          </div>
          <div className="space-y-2">
            <Label>Student type</Label>
            <Select
              value={values.studentType}
              onValueChange={(value) => {
                if (value === "SA" || value === "HK") {
                  updateField("studentType", value);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {STUDENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {STUDENT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            {canSelectDepartment ? (
              <Select
                value={values.department}
                onValueChange={(value) => {
                  if (value) {
                    updateField("department", value);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.code} value={department.code}>
                      {department.label}
                    </SelectItem>
                  ))}
                  {values.department &&
                  !departments.some(
                    (item) => item.code === values.department
                  ) ? (
                    <SelectItem value={values.department}>
                      {getDepartmentLabel(values.department)}
                    </SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={getDepartmentLabel(
                  fixedDepartment ?? values.department,
                  Object.fromEntries(
                    departments.map((item) => [item.code, item.label])
                  )
                )}
                disabled
              />
            )}
          </div>
          <div className="space-y-2">
            <Label>Assign to</Label>
            <Select
              value={values.assignment}
              onValueChange={(value) => {
                if (value) {
                  updateField("assignment", value);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select assignment" />
              </SelectTrigger>
              <SelectContent>
                {assignments.map((assignment) => (
                  <SelectItem key={assignment.code} value={assignment.code}>
                    {assignment.label}
                  </SelectItem>
                ))}
                {values.assignment &&
                !assignments.some((item) => item.code === values.assignment) ? (
                  <SelectItem value={values.assignment}>
                    {getStudentAssignmentLabel(values.assignment)}
                  </SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={values.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={values.phone}
              onChange={(e) => updateField("phone", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <StudentScheduleForm value={schedule} onChange={setSchedule} />

      <div className="flex flex-col gap-3 sm:flex-row lg:col-span-2">
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading
            ? "Saving..."
            : mode === "create"
              ? "Register student"
              : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
