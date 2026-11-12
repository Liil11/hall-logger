import { useCallback, useMemo } from "react";
import type { Task } from "../types/d.type";
import { useLocalStorage } from "./useLocalStorage";

const STORAGE_KEY = "task-planner:tasks";

type NewTask = Omit<Task, "id" | "createdAt" | "completed">;

export function useTasks() {
  const [tasks, setTasks] = useLocalStorage<Task[]>(STORAGE_KEY, []);

  const addTask = useCallback(
    (data: NewTask) => {
      const task: Task = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        completed: false,
      };
      setTasks((prev) => [...prev, task]);
    },
    [setTasks]
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<Task>) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    },
    [setTasks]
  );

  const deleteTask = useCallback(
    (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    },
    [setTasks]
  );

  const toggleTask = useCallback(
    (id: string) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
      );
    },
    [setTasks]
  );

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      (map[t.dateKey] ??= []).push(t);
    }
    // sort: incomplete first, then by priority, then by creation
    const priorityRank = { high: 0, medium: 1, low: 2 } as const;
    for (const key in map) {
      map[key].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (a.priority !== b.priority)
          return priorityRank[a.priority] - priorityRank[b.priority];
        return a.createdAt - b.createdAt;
      });
    }
    return map;
  }, [tasks]);

  return { tasks, tasksByDate, addTask, updateTask, deleteTask, toggleTask };
}