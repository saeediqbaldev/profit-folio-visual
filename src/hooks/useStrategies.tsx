import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

// Default strategies for new users
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
      const { data, error } = await supabase
        .from('profiles')
        .select('strategies')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading strategies:', error);
        setStrategies(DEFAULT_STRATEGIES);
      } else if (data?.strategies && data.strategies.length > 0) {
        setStrategies(data.strategies);
      } else {
        // Set default strategies for new users
        setStrategies(DEFAULT_STRATEGIES);
        // Save default strategies to profile
        await supabase
          .from('profiles')
          .update({ strategies: DEFAULT_STRATEGIES })
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error loading strategies:', error);
      setStrategies(DEFAULT_STRATEGIES);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadStrategies();
  }, [loadStrategies]);

  const addStrategy = useCallback(async (strategy: string) => {
    if (!user) return false;
    
    const trimmedStrategy = strategy.trim();
    if (!trimmedStrategy) {
      toast({
        variant: "destructive",
        title: "Invalid strategy",
        description: "Strategy name cannot be empty.",
      });
      return false;
    }

    if (strategies.includes(trimmedStrategy)) {
      toast({
        variant: "destructive",
        title: "Duplicate strategy",
        description: "This strategy already exists.",
      });
      return false;
    }

    if (strategies.length >= MAX_STRATEGIES) {
      toast({
        variant: "destructive",
        title: "Maximum reached",
        description: `You can only have up to ${MAX_STRATEGIES} strategies.`,
      });
      return false;
    }

    const newStrategies = [...strategies, trimmedStrategy];
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ strategies: newStrategies })
        .eq('user_id', user.id);

      if (error) throw error;

      setStrategies(newStrategies);
      toast({
        title: "Strategy added",
        description: `"${trimmedStrategy}" has been added to your strategies.`,
      });
      return true;
    } catch (error) {
      console.error('Error adding strategy:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add strategy.",
      });
      return false;
    }
  }, [user, strategies, toast]);

  const removeStrategy = useCallback(async (strategy: string) => {
    if (!user) return false;

    if (strategies.length <= 1) {
      toast({
        variant: "destructive",
        title: "Cannot remove",
        description: "You must have at least one strategy.",
      });
      return false;
    }

    const newStrategies = strategies.filter(s => s !== strategy);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ strategies: newStrategies })
        .eq('user_id', user.id);

      if (error) throw error;

      setStrategies(newStrategies);
      toast({
        title: "Strategy removed",
        description: `"${strategy}" has been removed.`,
      });
      return true;
    } catch (error) {
      console.error('Error removing strategy:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove strategy.",
      });
      return false;
    }
  }, [user, strategies, toast]);

  const updateStrategies = useCallback(async (newStrategies: string[]) => {
    if (!user) return false;

    if (newStrategies.length > MAX_STRATEGIES) {
      toast({
        variant: "destructive",
        title: "Too many strategies",
        description: `Maximum ${MAX_STRATEGIES} strategies allowed.`,
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ strategies: newStrategies })
        .eq('user_id', user.id);

      if (error) throw error;

      setStrategies(newStrategies);
      return true;
    } catch (error) {
      console.error('Error updating strategies:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update strategies.",
      });
      return false;
    }
  }, [user, toast]);

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
