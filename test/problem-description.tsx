import React, { useEffect, useState } from 'react';
import { ClientSocketMock } from './client-socket.mock';

export type ProblemDescriptionState = string[];

export type ProblemDescriptionProps = {
  clientSocket: ClientSocketMock;
  // Functions for testing purposes
  onComponentRendered: () => void;
  onSocketMessageProcessed: (
    currentState: ProblemDescriptionState,
    nextState: ProblemDescriptionState,
  ) => void;
};

export const ProblemDescription: React.FC<ProblemDescriptionProps> = (props) => {
  const [messages, setMessages] = useState<ProblemDescriptionState>([]);

  useEffect(() => {
    // Subscribing to the external messages on a useEffect as an example,
    // but could be done in any other handler of the react lifecycle
    props.clientSocket.onMessage((message) => {
      const nextMessages = [...messages, message];
      setMessages(nextMessages);

      // For testing purposes, allow the parent component to evaluate the state before and after
      props.onSocketMessageProcessed(messages, nextMessages);
    });
  }, []);

  // For testing purposes, keep track of the render cycles count
  props.onComponentRendered();

  return (
    <div data-testid="messages">
      {messages.map((x, index) => (
        <p key={index}>{x}</p>
      ))}
    </div>
  );
};
