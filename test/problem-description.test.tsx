import { describe, expect, test } from '@jest/globals';
import { act, render } from '@testing-library/react';
import React from 'react';
import { ClientSocketMock } from './client-socket.mock';
import { ProblemDescription, ProblemDescriptionState } from './problem-description';

export type StateTransition = {
  current: ProblemDescriptionState;
  next: ProblemDescriptionState;
};

describe(ProblemDescription.name, () => {
  describe('The external event handler uses an outdated reference of the React state', () => {
    test('When external events are processed in DIFFERENT threads of the event loop', async () => {
      const clientSocket = new ClientSocketMock();
      const stateTransitions: StateTransition[] = [];
      let renderCyclesCount = 0;

      render(
        <ProblemDescription
          clientSocket={clientSocket}
          onComponentRendered={() => {
            renderCyclesCount++;
          }}
          onSocketMessageProcessed={(current, next) => {
            stateTransitions.push({ current, next });
          }}
        />,
      );
      expect(renderCyclesCount).toBe(1);

      act(() => {
        clientSocket.sendMessage('Message 1');
      });

      expect(renderCyclesCount).toBe(2);
      expect(stateTransitions[0].current).toEqual([]);
      expect(stateTransitions[0].next).toEqual(['Message 1']);

      act(() => {
        clientSocket.sendMessage('Message 2');
      });

      expect(renderCyclesCount).toBe(3);
      expect(stateTransitions[1].current).toEqual([]);
      expect(stateTransitions[1].next).toEqual(['Message 2']);
      expect(stateTransitions[1].current).toBe(stateTransitions[0].current);
    });

    test('When external events are processed in THE SAME thread of the event loop', async () => {
      const clientSocket = new ClientSocketMock();
      const stateTransitions: StateTransition[] = [];
      let renderCyclesCount = 0;

      render(
        <ProblemDescription
          clientSocket={clientSocket}
          onComponentRendered={() => {
            renderCyclesCount++;
          }}
          onSocketMessageProcessed={(current, next) => {
            stateTransitions.push({ current, next });
          }}
        />,
      );
      expect(renderCyclesCount).toBe(1);

      act(() => {
        clientSocket.sendMessage('Message 1');
        clientSocket.sendMessage('Message 2');
      });

      // The setMessages setter will be called three times in a row,
      // causing a single React render cycle
      expect(renderCyclesCount).toBe(2);

      expect(stateTransitions[0].current).toEqual([]);
      expect(stateTransitions[0].next).toEqual(['Message 1']);
      expect(stateTransitions[1].current).toBe(stateTransitions[0].current);
      expect(stateTransitions[1].current).toEqual([]);
      expect(stateTransitions[1].next).toEqual(['Message 2']);
    });
  });
});
