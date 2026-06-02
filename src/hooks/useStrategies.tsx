import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_STRATEGIES = ["Strategy 1", "Strategy 2", "Strategy 3"];
const MAX_STRATEGIES = 5;

export const useStrategies = () => {
  const [strategies, setStrategies] = useState<string[]>(DEFAULT_STRATEGIES);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadStrategies = useCallback(async () => {
    if (!user) {
      setStrategies(DEFAULT_STRATEGIES);
      setLoading(false);
      return;
    }
    try {
      const data = await api.get<{ strategies: string[] }>("/api/strategies");
      if (data?.strategies && data.strategies.length > 0) {
        setStrategies(data.strategies);
      } else {
        setStrategies(DEFAULT_STRATEGIES);
      }
    } catch (error) {
      console.error("Error loading strategies:", error);
      setStrategies(DEFAULT_STRATEGIES);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadStrategies();
  }, [loadStrategies]);

  const persist = async (newStrategies: string[]) => {
    await api.put("/api/strategies", { strategies: newStrategies });
  };

  const addStrategy = useCallback(
    async (strategy: string) => {
      const trimmed = strategy.trim();
      if (!trimmed) {
        toast({ variant: "destructive", title: "Invalid strategy", description: "Name cannot be empty." });
        return false;
      }
      if (strategies.includes(trimmed)) {
        toast({ variant: "destructive", title: "Duplicate strategy", description: "Already exists." });
        return false;
      }
      if (strategies.length >= MAX_STRATEGIES) {
        toast({ variant: "destructive", title: "Maximum reached", description: `Up to ${MAX_STRATEGIES}.` });
        return false;
      }
      const next = [...strategies, trimmed];
      try {
        await persist(next);
        setStrategies(next);
        toast({ title: "Strategy added", description: `"${trimmed}" added.` });
        return true;
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Failed to add strategy." });
        return false;
      }
    },
    [strategies, toast]
  );

  const removeStrategy = useCallback(
    async (strategy: string) => {
      if (strategies.length <= 1) {
        toast({ variant: "destructive", title: "Cannot remove", description: "Keep at least one." });
        return false;
      }
      const next = strategies.filter((s) => s !== strategy);
      try {
        await persist(next);
        setStrategies(next);
        toast({ title: "Strategy removed" });
        return true;
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Failed to remove." });
        return false;
      }
    },
    [strategies, toast]
  );

  const updateStrategies = useCallback(
    async (newStrategies: string[]) => {
      if (newStrategies.length > MAX_STRATEGIES) {
        toast({ variant: "destructive", title: "Too many", description: `Max ${MAX_STRATEGIES}.` });
        return false;
      }
      try {
        await persist(newStrategies);
        setStrategies(newStrategies);
        return true;
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Failed to update." });
        return false;
      }
    },
    [toast]
  );

  return {
    strategies,
    loading,
    addStrategy,
    removeStrategy,
    updateStrategies,
    maxStrategies: MAX_STRATEGIES,
    refetch: loadStrategies,
  };
};
