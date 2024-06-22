# react-external-events

Simple react hook to access the current state of a React function component in external event handlers. The package contains barely 30 lines of code and is meant for illustration purposes mainly; feel free to copy and paste the code if you don't want yet another dependency in your project.

## API

### useExternalEvents\<TData\>()

React hook that returns two functions:

- **registerEvent(eventData: TData)**: Registers an event (or data from the event) that will be processed later by `processNext`. It is meant to be used in functions without access to the latest state of the component.

- **processNext(...args: ProcessNextArguments\<TData\>)**: Processes pending events if there are any. Called in every render cycle, thus the handler passed as parameter has access to the latest state of the component. It can process events one at a time or in batch.

#### Examples

```typescript
export const Component: React.FC = (props) => {
  const externalMessages = useExternalEvents<string>();

  externalMessages.processNext((message: string) => {
    /* Update state */
  });

  useEffect(() => {
    webSocket.onMessage(externalMessages.registerEvent);
  }, []);

  /* ... */
};
```

```typescript
export const Component: React.FC = (props) => {
  const externalMessages = useExternalEvents<string>();

  externalMessages.processNext((messages: string[]) => {
    /* Update state */
  }, true);

  useEffect(() => {
    webSocket.onMessage(externalMessages.registerEvent);
  }, []);

  /* ... */
};
```

## Motivation

Some browser events (e.g. web sockets, web rtc, etc.) are triggered outside React's lifecycle. Because the handlers for those events are usually defined only once, the event handlers don't have access to the latest state of the React function components. Consider the following component:

```typescript
import React, { useEffect, useState } from 'react';

export const Chat: React.FC</* ... */> = (props) => {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    props.webSocket.onMessage((message) => {
      setMessages([...messages, message]);
    });
  }, []);

  return (
    <div>
      {messages.map((x, index) => (
        <p key={index}>{x}</p>
      ))}
    </div>
  );
};
```

Every time a new message arrives the component's state is updated, returning a new `messages` variable. However, the `messages` variable in the `onMessage` event handler is a reference to the initial state of the component (i.e. an empty array). This causes the event handler to pass an empty array when updating the component's state, discarding previously received messages for each new message that arrives.

One way of solving this, for example, would be to re-define the event handler every time an event is processed. `react-external-events` takes a simpler approach: splitting the event handlers into two functions.

- The first function (i.e. `registerEvent`) is defined only once and it doesn't have access to the latest component's state. It registers the external events, without processing them, and forces a render cycle of the component.
- The second function (i.e. `processNext`) is re-defined in every render cycle, and it therefore has access to the latest component's state. It processes pending events, if there are any, and potentially updates the component's state.

A "picture" is worth a thousand words:

```typescript
import React, { useEffect, useState } from 'react';
import { useExternalEvents } from 'react-external-events';

export const Chat: React.FC</* ... */> = (props) => {
  const [messages, setMessages] = useState<string[]>([]);
  const externalMessages = useExternalEvents<string>();

  externalMessages.processNext((message: string) => {
    setMessages([...messages, message]);
  });

  useEffect(() => {
    props.webSocket.onMessage(externalMessages.registerEvent);
  }, []);

  return (
    <div>
      {messages.map((x, index) => (
        <p key={index}>{x}</p>
      ))}
    </div>
  );
};
```
