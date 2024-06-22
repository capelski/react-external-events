import React, { useEffect, useState } from 'react';
import { useExternalEvents } from '../source/index';
import { ProblemDescriptionProps, ProblemDescriptionState } from './problem-description';

export const SuggestedSolution: React.FC<ProblemDescriptionProps> = (props) => {
  const [messages, setMessages] = useState<ProblemDescriptionState>([]);

  const externalMessages = useExternalEvents<string>();
  externalMessages.processNext((incomingMessage: string) => {
    const nextMessages = [...messages, incomingMessage];
    setMessages(nextMessages);

    // For testing purposes, allow the parent component to evaluate the state before and after
    props.onSocketMessageProcessed(messages, nextMessages);
  });

  useEffect(() => {
    // Subscribing to the external messages on a useEffect as an example,
    // but could be done in any other handler of the react lifecycle
    props.clientSocket.onMessage(externalMessages.registerEvent);
  }, []);

  // Keep track of the render cycles count, for testing purposes
  props.onComponentRendered();

  return (
    <div data-testid="messages">
      {messages.map((x, index) => (
        <p key={index}>{x}</p>
      ))}
    </div>
  );
};
