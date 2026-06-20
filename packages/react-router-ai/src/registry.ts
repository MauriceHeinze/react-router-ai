import { useLayoutEffect, useRef, useSyncExternalStore } from "react";
import type { AICommandItem, AICommandRegistry, AICommandRegistryEntry } from "./types";

export function createCommandRegistry(): AICommandRegistry {
  const entries = new Map<string, AICommandRegistryEntry>();
  const listeners = new Set<() => void>();
  let snapshot: AICommandItem[] = [];

  function getSnapshot(): AICommandItem[] {
    const next = [...entries.values()].map((entry) => entry.getItem());
    if (
      next.length !== snapshot.length ||
      next.some((item, index) => item.id !== snapshot[index]?.id)
    ) {
      snapshot = next;
    }
    return snapshot;
  }

  function notify() {
    for (const listener of listeners) {
      listener();
    }
  }

  return {
    register(entry) {
      entries.set(entry.id, entry);
      notify();
      return () => {
        entries.delete(entry.id);
        notify();
      };
    },
    getItems: getSnapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function useCommandRegistry(): AICommandRegistry {
  const registryRef = useRef<AICommandRegistry | null>(null);

  if (!registryRef.current) {
    registryRef.current = createCommandRegistry();
  }

  useLayoutEffect(() => {
    return () => {
      registryRef.current = null;
    };
  }, []);

  return registryRef.current;
}

export function useRegisteredItems(registry: AICommandRegistry): AICommandItem[] {
  return useSyncExternalStore(
    (callback) => registry.subscribe(callback),
    () => registry.getItems(),
    () => registry.getItems(),
  );
}
