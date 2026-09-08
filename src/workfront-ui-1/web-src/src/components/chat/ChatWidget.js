/*
 * <license header>
 */

import { useEffect, useRef, useState } from 'react';
import { style } from '@react-spectrum/s2/style' with { type: 'macro' };
import { CloseButton, ActionButton, TextArea } from '@react-spectrum/s2';
import Send from '@react-spectrum/s2/icons/Send';
import { AIButton, Chat, Thread, ThreadItem, UserMessage } from '@react-spectrum/ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  backgroundColor: 'blue-subtle',
  borderRadius: 'lg',
  paddingX: 12,
  paddingY: 8,
  width: 'fit',
  maxWidth: '75%',
  marginStart: 'auto',
});
// Input row: the TextArea grows/wraps and the send button sits at the bottom.
const inputRow = style({ display: 'flex', alignItems: 'end', gap: 8, paddingY: 12 });
const inputField = style({ flexGrow: 1, minWidth: 0 });

let idCounter = 0;
const nextId = () => `m${(idCounter += 1)}`;

// Split an assistant reply into its markdown body and any trailing
// "Suggested questions" / "Suggested actions" list, which we render as clickable
// quick-reply chips. Returns { body, suggestions: string[] }.
function splitSuggestions(content) {
  if (!content) return { body: content, suggestions: [] };
  const marker =
    /\n[ \t]*(?:[-*][ \t]*)?(?:\*\*)?[ \t]*suggested[ \t]+(?:questions|actions)(?:\*\*)?[ \t]*:?[ \t]*\n?/i;
  const match = content.match(marker);
  if (!match) return { body: content, suggestions: [] };
  const body = content.slice(0, match.index).trimEnd();
  const rest = content.slice(match.index + match[0].length);
  const suggestions = [];
  for (const line of rest.split('\n')) {
    const item = line.match(/^[ \t]*(?:\d+[.)]|[-*])[ \t]+(.*\S)/);
    if (item) suggestions.push(item[1].trim());
  }
  return { body, suggestions };
}

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
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const authRef = useRef(null);
  const primedRef = useRef(false);
  const primePromiseRef = useRef(null);
  // The agent's conversation id, returned on each `done` event and passed back
  // in `context` so subsequent prompts continue the same thread.
  const contextIdRef = useRef(null);
  const panelRef = useRef(null);
  const scrollElRef = useRef(null);
  // Whether the user is parked at the bottom; controls streaming auto-scroll so
  // we never yank them down while they read earlier messages.
  const stickToBottomRef = useRef(true);

  // On mount, read the chat context (IMS token + project id) from the shared
  // guest connection, then invisibly prime the agent with the current project
  // id so the user's later queries are answered for this project. This priming
  // message and its response are never shown in the chat.
  useEffect(() => {
    let active = true;
    getImsAuth().then((a) => {
      if (!active) return;
      authRef.current = a;
      if (!primedRef.current && a.imsToken && a.projectId) {
        primedRef.current = true;
        // Invisible: no onToken, so the response text is discarded. Capture the
        // conversation contextId so the user's later prompts continue this
        // thread (with the project already set).
        primePromiseRef.current = streamChat({
          prompt: `project id ${a.projectId}`,
          imsToken: a.imsToken,
        })
          .then((res) => {
            if (res && res.contextId) contextIdRef.current = res.contextId;
          })
          .catch(() => {
            // Priming is best-effort; ignore failures so the user can still chat.
          });
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Locate the Thread's scroll container (the virtualized GridList) and track
  // whether the user is near the bottom.
  useEffect(() => {
    if (!open) return undefined;
    const el = panelRef.current && panelRef.current.querySelector('[role="grid"]');
    scrollElRef.current = el;
    if (!el) return undefined;
    const onScroll = () => {
      stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [open]);

  // Keep the newest content scrolled into view as the response streams in.
  useEffect(() => {
    const el = scrollElRef.current;
    if (el && stickToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, open]);

  const handleSubmit = async (text) => {
    const prompt = (text || '').trim();
    if (!prompt || busy) return;

    const botId = nextId();
    setMessages((m) => [
      ...m,
      { id: nextId(), role: 'user', content: prompt },
      { id: botId, role: 'assistant', content: '', streaming: true },
    ]);
    setInput('');
    setBusy(true);

    try {
      const auth = authRef.current || (await getImsAuth());
      authRef.current = auth;
      // Wait for the invisible project-id priming so the first prompt carries
      // the conversation contextId.
      if (primePromiseRef.current) {
        try {
          await primePromiseRef.current;
        } catch (e) {
          /* priming failure already handled */
        }
      }
      // eslint-disable-next-line no-console
      console.info('[chat] sending contextId:', contextIdRef.current);
      const result = await streamChat({
        prompt,
        imsToken: auth.imsToken,
        conversationId: contextIdRef.current || undefined,
        onToken: (t) =>
          setMessages((m) => m.map((x) => (x.id === botId ? { ...x, content: x.content + t } : x))),
      });
      // eslint-disable-next-line no-console
      console.info('[chat] contextId from response:', result && result.contextId);
      if (result && result.contextId) contextIdRef.current = result.contextId;
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

  // Render an assistant reply: markdown body plus, once streaming is done, any
  // "Suggested questions/actions" turned into clickable prompts.
  const renderAssistant = (m) => {
    if (!m.content) return m.streaming ? '…' : '';
    // While streaming, the suggestions list is incomplete — show raw markdown.
    if (m.streaming) {
      return <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>;
    }
    const { body, suggestions } = splitSuggestions(m.content);
    return (
      <>
        {body ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown> : null}
        {suggestions.length > 0 && (
          <div className="es-chat__suggestions">
            {suggestions.map((q) => (
              <button
                key={q}
                type="button"
                className="es-chat__suggestion"
                onClick={() => handleSubmit(q)}
                disabled={busy}
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </>
    );
  };

  // Enter submits; Shift+Enter inserts a newline. Handled on the wrapper so it
  // works regardless of whether TextArea forwards onKeyDown.
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!busy) handleSubmit(input);
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
        <section
          ref={panelRef}
          className="es-chat__panel"
          role="dialog"
          aria-label="AI Assistant chat"
        >
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
                    <div className={`${assistantBubble} es-chat__md`}>{renderAssistant(m)}</div>
                  )}
                </ThreadItem>
              )}
            </Thread>

            <div className={inputRow} onKeyDown={onKeyDown}>
              <TextArea
                aria-label="Message"
                placeholder="Ask a question…"
                value={input}
                onChange={setInput}
                isDisabled={busy}
                styles={inputField}
              />
              <ActionButton
                aria-label="Send message"
                isDisabled={busy || !input.trim()}
                onPress={() => handleSubmit(input)}
              >
                <Send />
              </ActionButton>
            </div>
          </Chat>
        </section>
      )}
    </div>
  );
}

export default ChatWidget;
