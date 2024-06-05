import { useEffect, useMemo, useState } from 'react';

/**
 * Some events triggered outside the React render cycle need to get the latest React state.
 * However, since the event handler is only registered once, the handler doesn't have access
 * to the latest state at the moment each event is processed.
 *
 * Instead of processing each event in the event handler itself, store the event, force a new
 * render cycle and process the event via useEffect, where the latest state is available.
 */
export function useExternalEvents<TEventData>() {
  const [, forceUpdate] = useState({});

  return useMemo(() => {
    const pendingEvents: TEventData[] = [];

    return {
      registerEvent: (eventData: TEventData) => {
        pendingEvents.push(eventData);
        forceUpdate({});
      },
      processNextEvent: (handler: (c: TEventData) => void) => {
        useEffect(() => {
          if (pendingEvents.length > 0) {
            handler(pendingEvents.shift()!);
          }
        }, [pendingEvents.length]);
      },
      processNextEvents: (handler: (c: TEventData[]) => void) => {
        useEffect(() => {
          if (pendingEvents.length > 0) {
            const batch = pendingEvents.splice(0);
            handler(batch);
          }
        }, [pendingEvents.length]);
      },
    };
  }, []);
}
