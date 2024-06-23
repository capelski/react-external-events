import { useEffect, useMemo, useState } from 'react';

export type Handler<T> = (c: T) => void;

export type ProcessNextArguments<T> =
  | [handler: Handler<T>]
  | [
      handler: Handler<T[]>,
      {
        batch: true;
      },
    ];

/** Returns a function to register external events and a function to process them */
export function useExternalEvents<TData>() {
  const [, forceUpdate] = useState({});

  return useMemo(() => {
    const pendingEvents: TData[] = [];

    /** Function to process external events one at a time. Must be called in every render cycle. */
    function processNext(handler: Handler<TData>): void;
    /** Function to process external events in batch. Must be called in every render cycle. */
    function processNext(handler: Handler<TData[]>, options: { batch: true }): void;
    function processNext(...args: ProcessNextArguments<TData>) {
      useEffect(() => {
        if (pendingEvents.length > 0) {
          if (args[1]?.batch) {
            const handler = args[0] as Handler<TData[]>;
            handler(pendingEvents.splice(0));
          } else {
            const handler = args[0] as Handler<TData>;
            handler(pendingEvents.shift()!);
          }
        }
      }, [pendingEvents.length]);
    }

    function registerEvent(eventData: TData) {
      pendingEvents.push(eventData);
      forceUpdate({});
    }

    return {
      processNext,
      /** Function to register external events. Must be called in external event handlers. */
      registerEvent,
    };
  }, []);
}
