"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  ListTodo,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, getTodayStart } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import {
  TODO_PRIORITIES,
  TODO_PRIORITY_LABELS,
  type TodoPriority,
} from "@/lib/todo";

type Todo = {
  id: string;
  title: string;
  description: string | null;
  priority: TodoPriority;
  isDone: boolean;
  dueDate: string | null;
  createdAt: string;
};

type Filter = "all" | "pending" | "done";

const priorityRank: Record<TodoPriority, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

const priorityBadgeClass: Record<TodoPriority, string> = {
  HIGH: "border-transparent bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  MEDIUM:
    "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  LOW: "border-transparent bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

function isOverdue(todo: Todo): boolean {
  if (!todo.dueDate || todo.isDone) return false;
  return new Date(todo.dueDate) < getTodayStart();
}

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TodoPriority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadTodos() {
    setLoading(true);
    try {
      const response = await fetch("/api/todos");
      if (!response.ok) throw new Error();
      setTodos(await response.json());
    } catch {
      toast.error("Failed to load to-dos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTodos();
  }, []);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          priority,
          dueDate,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to add to-do");
      }

      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setDueDate("");
      toast.success("To-do added");
      await loadTodos();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add to-do");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleDone(todo: Todo) {
    setBusyId(todo.id);
    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDone: !todo.isDone }),
      });
      if (!response.ok) throw new Error();
      await loadTodos();
    } catch {
      toast.error("Failed to update to-do");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteTodo(todo: Todo) {
    setBusyId(todo.id);
    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();
      toast.success("To-do deleted");
      await loadTodos();
    } catch {
      toast.error("Failed to delete to-do");
    } finally {
      setBusyId(null);
    }
  }

  const stats = useMemo(() => {
    const done = todos.filter((t) => t.isDone).length;
    const overdue = todos.filter(isOverdue).length;
    return {
      total: todos.length,
      pending: todos.length - done,
      done,
      overdue,
    };
  }, [todos]);

  const visible = useMemo(() => {
    const list = todos.filter((todo) => {
      if (filter === "pending") return !todo.isDone;
      if (filter === "done") return todo.isDone;
      return true;
    });

    return [...list].sort((a, b) => {
      if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
      if (a.priority !== b.priority) {
        return priorityRank[a.priority] - priorityRank[b.priority];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [todos, filter]);

  const statCards = [
    { title: "Total", value: stats.total, icon: ListTodo },
    { title: "Pending", value: stats.pending, icon: Circle },
    { title: "Completed", value: stats.done, icon: CheckCircle2 },
    { title: "Overdue", value: stats.overdue, icon: Clock },
  ];

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "done", label: "Completed" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">To-Do List</h1>
        <p className="text-sm text-muted-foreground">
          Track tasks and reminders for the team
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add a task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="flex-1"
                maxLength={200}
              />
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as TodoPriority)}
              >
                <SelectTrigger className="sm:w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {TODO_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {TODO_PRIORITY_LABELS[p]} priority
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="sm:w-44"
              />
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details (optional)"
              rows={2}
              maxLength={1000}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Add task
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="rounded-xl border bg-card py-10 text-center text-sm text-muted-foreground">
          Loading to-dos...
        </p>
      ) : visible.length === 0 ? (
        <p className="rounded-xl border bg-card py-10 text-center text-sm text-muted-foreground">
          {filter === "done"
            ? "No completed tasks yet."
            : filter === "pending"
              ? "No pending tasks. Nicely done!"
              : "No tasks yet. Add your first one above."}
        </p>
      ) : (
        <div className="space-y-2">
          {visible.map((todo) => {
            const overdue = isOverdue(todo);
            return (
              <div
                key={todo.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border bg-card p-3 sm:p-4",
                  todo.isDone && "opacity-60"
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleDone(todo)}
                  disabled={busyId === todo.id}
                  className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
                  aria-label={todo.isDone ? "Mark as pending" : "Mark as done"}
                >
                  {todo.isDone ? (
                    <CheckCircle2 className="size-5 text-primary" />
                  ) : (
                    <Circle className="size-5" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "font-medium break-words",
                      todo.isDone && "line-through"
                    )}
                  >
                    {todo.title}
                  </p>
                  {todo.description && (
                    <p className="mt-0.5 text-sm break-words text-muted-foreground">
                      {todo.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={priorityBadgeClass[todo.priority]}
                    >
                      {TODO_PRIORITY_LABELS[todo.priority]}
                    </Badge>
                    {todo.dueDate && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-xs text-muted-foreground",
                          overdue && "font-medium text-red-600 dark:text-red-400"
                        )}
                      >
                        <CalendarDays className="size-3.5" />
                        {formatDate(todo.dueDate)}
                        {overdue && " · overdue"}
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteTodo(todo)}
                  disabled={busyId === todo.id}
                  aria-label="Delete to-do"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
