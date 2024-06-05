import { describe, expect, test } from '@jest/globals';
import { act, render } from '@testing-library/react';
import React from 'react';
import { ClientSocketMock } from './client-socket.mock';
import { StateTransition } from './problem-description.test';
import { SuggestedSolution } from './suggested-solution';

describe(SuggestedSolution.name, () => {
  describe('The external event handler gets a reference to the latest React state', () => {
    test('When external events are processed in DIFFERENT threads of the event loop', async () => {
      const clientSocket = new ClientSocketMock();
      const stateTransitions: StateTransition[] = [];
      let renderCyclesCount = 0;

      render(
        <SuggestedSolution
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

      // One cycle is triggered by the internal forceUpdate setter, and an additional one
      // is triggered by the setMessages in externalMessages.processNextEvent
      expect(renderCyclesCount).toBe(3);
      expect(stateTransitions[0].current).toEqual([]);
      expect(stateTransitions[0].next).toEqual(['Message 1']);

      act(() => {
        clientSocket.sendMessage('Message 2');
      });

      expect(renderCyclesCount).toBe(5);
      expect(stateTransitions[1].current).toEqual(['Message 1']);
      expect(stateTransitions[1].next).toEqual(['Message 1', 'Message 2']);
      expect(stateTransitions[1].current).toBe(stateTransitions[0].next);
    });

    test('When external events are processed in THE SAME thread of the event loop', async () => {
      const clientSocket = new ClientSocketMock();
      const stateTransitions: StateTransition[] = [];
      let renderCyclesCount = 0;

      render(
        <SuggestedSolution
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

      // The internal forceUpdate setter will be called two times in a row,
      // causing a React render cycle. In that render cycle, the internal useEffect
      // will trigger a chain of render cycles via setMessages
      expect(renderCyclesCount).toBe(4);

      expect(stateTransitions[0].current).toEqual([]);
      expect(stateTransitions[0].next).toEqual(['Message 1']);
      expect(stateTransitions[1].current).toEqual(['Message 1']);
      expect(stateTransitions[1].next).toEqual(['Message 1', 'Message 2']);
      expect(stateTransitions[1].current).toBe(stateTransitions[0].next);
    });
  });
});
