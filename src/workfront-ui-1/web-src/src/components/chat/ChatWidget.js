/*
 * <license header>
 */

import { useEffect, useRef, useState } from 'react';
import { style } from '@react-spectrum/s2/style' with { type: 'macro' };
import { CloseButton } from '@react-spectrum/s2';
import {
  AIButton,
  Chat,
  Thread,
  ThreadItem,
  UserMessage,
  PromptField,
  PromptTokenField,
  PromptFieldSubmitButton,
} from '@react-spectrum/ai';
import { getImsAuth } from '../../api/imsAuth';
import { streamChat } from '../../api/chatClient';
import './chat.css';

// Chat fills the panel as a column so the PromptField stays pinned at the
// bottom and the Thread (chats) scrolls above it.
const chatStyles = style({ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column', paddingX: 12 });
// The chats section takes the remaining height and scrolls on overflow.
const threadStyles = style({ flexGrow: 1, minHeight: 0, overflowY: 'auto' });
// Assistant ("received") replies are app-rendered content in a ThreadItem.
// Give them a distinct tinted bubble aligned to the right (marginStart: 'auto'
// pushes a fit-content block to the end) so they read apart from the
// left-aligned UserMessage bubbles.
const assistantBubble = style({
  font: 'body',
  color: 'neutral',
  whiteSpace: 'pre-wrap',
  backgroundColor: 'blue-subtle',
  borderRadius: 'lg',
  paddingX: 12,
  paddingY: 8,
  width: 'fit',
  maxWidth: '75%',
  marginStart: 'auto',
});

let idCounter = 0;
const nextId = () => `m${(idCounter += 1)}`;

/**
 * Floating AI chat assistant, built on @react-spectrum/ai (Spectrum 2 AI
 * components): an `AIButton` launcher opens a right-side panel containing a
 * `Chat` (`Thread` of messages + `PromptField`). Each submit streams a response
 * from the agent API; history is held in state for the current session, and the
 * input is disabled (generating) until the response finishes.
 */
function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const authRef = useRef(null);

  // Prefetch IMS auth (token + org) used to authorize the agent call.
  useEffect(() => {
    getImsAuth().then((a) => {
      authRef.current = a;
    });
  }, []);

  const handleSubmit = async (text) => {
    const prompt = (text || '').trim();
    if (!prompt || busy) return;

    const botId = nextId();
    setMessages((m) => [
      ...m,
      { id: nextId(), role: 'user', content: prompt },
      { id: botId, role: 'assistant', content: '', streaming: true },
    ]);
    setBusy(true);

    try {
      const auth = authRef.current || (await getImsAuth());
      authRef.current = auth;
      await streamChat({
        prompt,
        imsToken: auth.imsToken,
        imsOrg: auth.imsOrg,
        onToken: (t) =>
          setMessages((m) => m.map((x) => (x.id === botId ? { ...x, content: x.content + t } : x))),
      });
      setMessages((m) =>
        m.map((x) =>
          x.id === botId ? { ...x, content: x.content || '(no response)', streaming: false } : x,
        ),
      );
    } catch (e) {
      setMessages((m) =>
        m.map((x) => (x.id === botId ? { ...x, content: e.message, streaming: false } : x)),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="es-chat">
      {!open && (
        <span className="es-chat__launcher">
          <AIButton size="L" aria-label="Open AI assistant" onPress={() => setOpen(true)}>
            AI Assistant
          </AIButton>
        </span>
      )}

      {open && (
        <section className="es-chat__panel" role="dialog" aria-label="AI Assistant chat">
          <header className="es-chat__header">
            <span className="es-chat__title">AI Assistant</span>
            <CloseButton onPress={() => setOpen(false)} />
          </header>

          <Chat styles={chatStyles}>
            <Thread items={messages} aria-label="Conversation" styles={threadStyles}>
              {(m) => (
                <ThreadItem id={m.id} textValue={m.content} isStreaming={m.streaming}>
                  {m.role === 'user' ? (
                    <UserMessage>{m.content}</UserMessage>
                  ) : (
                    <div className={assistantBubble}>{m.content || (m.streaming ? '…' : '')}</div>
                  )}
                </ThreadItem>
              )}
            </Thread>

            <PromptField
              aria-label="Message"
              isGenerating={busy}
              onSubmit={(value) => handleSubmit(value && value.toString ? value.toString() : String(value || ''))}
            >
              <PromptTokenField placeholder="Ask a question…" />
              <PromptFieldSubmitButton />
            </PromptField>
          </Chat>
        </section>
      )}
    </div>
  );
}

export default ChatWidget;
