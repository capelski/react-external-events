import { useEffect, useMemo, useState } from 'react';

export type ProcessNextArguments<TData> =
  | [handler: (c: TData) => void, batch?: false]
  | [handler: (c: TData[]) => void, batch: true];

export type ExternalEventsFunctions<TData> = {
  /** Function to process external events, one at a time or in batch. Must be called in
   * every render cycle. */
  processNext: (...args: ProcessNextArguments<TData>) => void;
  /** Function to register external events. Must be called in external event handlers. */
  registerEvent: (eventData: TData) => void;
};

/** Returns a function to register external events and a function to process them */
export function useExternalEvents<TData>(): ExternalEventsFunctions<TData> {
  const [, forceUpdate] = useState({});

  return useMemo(() => {
    const pendingEvents: TData[] = [];

    return {
      processNext: (...[handler, batch]: ProcessNextArguments<TData>) => {
        useEffect(() => {
          if (pendingEvents.length > 0) {
            if (batch) {
              handler(pendingEvents.splice(0));
            } else {
              handler(pendingEvents.shift()!);
            }
          }
        }, [pendingEvents.length]);
      },
      registerEvent: (eventData: TData) => {
        pendingEvents.push(eventData);
        forceUpdate({});
      },
    };
  }, []);
}
