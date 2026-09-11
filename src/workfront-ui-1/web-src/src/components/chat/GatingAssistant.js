/*
 * <license header>
 */

import { useEffect, useRef, useState } from 'react';
import { style } from '@react-spectrum/s2/style' with { type: 'macro' };
import { ActionButton, TextArea } from '@react-spectrum/s2';
import Close from '@react-spectrum/s2/icons/Close';
import Maximize from '@react-spectrum/s2/icons/Maximize';
import Minimize from '@react-spectrum/s2/icons/Minimize';
import ThumbUp from '@react-spectrum/s2/icons/ThumbUp';
import ThumbDown from '@react-spectrum/s2/icons/ThumbDown';
import ArrowCurved from '@react-spectrum/s2/icons/ArrowCurved';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getImsAuth } from '../../api/imsAuth';
import { streamChat } from '../../api/chatClient';
import './gatingAssistant.css';

// TextArea fills the input box; the +/send actions sit in a row beneath it.
const inputFieldStyle = style({ width: 'full' });

// Projects in this Workfront portfolio are "event type"; any other portfolio is
// "non-event type". The classification is primed into the chat context so the
// assistant scopes its answers correctly.
const EVENT_PORTFOLIO_ID = '61fdad0600034b691cf17a0c7147ab61';

let idCounter = 0;
const nextId = () => `g${(idCounter += 1)}`;

/** Sparkle glyph for the header avatar (white on the dark header — no box). */
function SparkleIcon() {
  return (
    <svg viewBox="0 0 20 20" width="22" height="22" fill="currentColor" aria-hidden="true">
      <path d="M11.2 1.6c.22 3.2 1.4 4.38 4.6 4.6-3.2.22-4.38 1.4-4.6 4.6-.22-3.2-1.4-4.38-4.6-4.6 3.2-.22 4.38-1.4 4.6-4.6z" />
      <path d="M5.6 11.2c.14 1.86.86 2.58 2.72 2.72-1.86.14-2.58.86-2.72 2.72-.14-1.86-.86-2.58-2.72-2.72 1.86-.14 2.58-.86 2.72-2.72z" />
    </svg>
  );
}

/** Launcher sparkle (round dark toggle button) — matches the prototype's
 *  .ai-btn glyph: a large 4-point star plus a smaller faded one. */
function LauncherSparkle() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l1.8 5.4L19 12l-5.2 3.6L12 21l-1.8-5.4L5 12l5.2-3.6L12 3z" fill="#fff" />
      <path d="M19.5 4l.8 2.4 1.8 1.1-1.8 1.1L19.5 11l-.8-2.4-1.8-1.1 1.8-1.1L19.5 4z" fill="#fff" opacity=".55" />
    </svg>
  );
}

/** Filled paper-plane send glyph (matches the Figma send button). */
function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M2.3 10.9 20 3.3c.72-.3 1.42.4 1.11 1.11L13.5 22c-.3.72-1.32.62-1.5-.12l-1.77-6a1 1 0 0 0-.7-.7l-6-1.77c-.74-.18-.84-1.2-.12-1.5Z" />
    </svg>
  );
}

/**
 * Split an assistant reply into its markdown body and any trailing follow-up
 * list ("Suggested / Follow-up questions|actions"), rendered as the
 * "What would you like to do next?" quick-action chips.
 */
function splitSuggestions(content) {
  if (!content) return { body: content, suggestions: [] };
  const marker =
    /\n[ \t]*(?:[-*][ \t]*)?(?:\*\*)?[ \t]*(?:suggested|follow[-\s]?up)[ \t]+(?:questions|actions)(?:\*\*)?[ \t]*:?[ \t]*\n?/i;
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
 * Gating Assistant — the Figma docked side panel (right rail). Opening it pushes
 * the dashboard (the shell adds right padding); a Maximize toggle grows it from
 * 350px to 500px. Streams from the agent API (shared with the legacy
 * ChatWidget's clients); the response markdown drives the panel content.
 */
function GatingAssistant({ open, maximized, subtitle, portfolioId, onOpen, onClose, onToggleMaximize }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  // Priming (project id + event/non-event classification) runs before the
  // launcher is shown; `ready` flips true once that priming call completes.
  const [ready, setReady] = useState(false);
  const authRef = useRef(null);
  const primedRef = useRef(false);
  const primePromiseRef = useRef(null);
  const contextIdRef = useRef(null);
  const bodyRef = useRef(null);
  const stickToBottomRef = useRef(true);
  const lastMsgRef = useRef(null);

  // Once the project has loaded (get-project completed), show the launcher
  // right away and prime the conversation in the background: send the project id
  // (invisible), then classify the project as event / non-event by its
  // portfolio. Both messages thread the same contextId so later prompts inherit
  // the context (user prompts await primePromiseRef, so they still wait for it).
  useEffect(() => {
    if (primedRef.current) return;
    // `undefined` means the project hasn't loaded (or failed) — wait; a string
    // or `null` portfolioId means get-project completed and we can prime.
    if (portfolioId === undefined) return;
    primedRef.current = true;
    // get-project is done — reveal the chat icon immediately.
    setReady(true);
    primePromiseRef.current = (async () => {
      const auth = await getImsAuth();
      authRef.current = auth;
      if (!auth || !auth.imsToken) return; // no session (e.g. local dev)
      try {
        if (auth.projectId) {
          const r1 = await streamChat({
            prompt: `project id ${auth.projectId}`,
            imsToken: auth.imsToken,
          });
          if (r1 && r1.contextId) contextIdRef.current = r1.contextId;
        }
        // Classify using the first prime's contextId (kept canonical — we don't
        // overwrite it with this call's result).
        const isEvent = portfolioId === EVENT_PORTFOLIO_ID;
        await streamChat({
          prompt: isEvent ? 'the project is an event type' : 'the project is non-event type',
          imsToken: auth.imsToken,
          conversationId: contextIdRef.current || undefined,
        });
      } catch (e) {
        /* priming is best-effort */
      }
    })();
  }, [portfolioId]);

  // Track whether the user is near the bottom of the scroll body.
  useEffect(() => {
    if (!open) return undefined;
    const el = bodyRef.current;
    if (!el) return undefined;
    const onScroll = () => {
      stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [open]);

  // Follow the newest response into view as it streams (unless scrolled up).
  useEffect(() => {
    if (stickToBottomRef.current && lastMsgRef.current) {
      lastMsgRef.current.scrollIntoView({ block: 'end' });
    }
  }, [messages, open, maximized]);

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
    stickToBottomRef.current = true;

    try {
      const auth = authRef.current || (await getImsAuth());
      authRef.current = auth;
      if (primePromiseRef.current) {
        try {
          await primePromiseRef.current;
        } catch (e) {
          /* priming failure already handled */
        }
      }
      const result = await streamChat({
        prompt,
        imsToken: auth.imsToken,
        conversationId: contextIdRef.current || undefined,
        onToken: (t) =>
          setMessages((m) => m.map((x) => (x.id === botId ? { ...x, content: x.content + t } : x))),
      });
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

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!busy) handleSubmit(input);
    }
  };

  const renderAssistant = (m) => {
    if (!m.content) {
      return m.streaming ? (
        <span className="es-ga__typing" role="status" aria-label="Generating response">
          <span className="es-ga__dot" />
          <span className="es-ga__dot" />
          <span className="es-ga__dot" />
          <span className="es-ga__typing-text">Generating response</span>
        </span>
      ) : null;
    }
    if (m.streaming) {
      return <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>;
    }
    const { body, suggestions } = splitSuggestions(m.content);
    return (
      <>
        {body ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown> : null}
        <div className="es-ga__feedback">
          <ActionButton isQuiet size="S" aria-label="Good response">
            <ThumbUp />
          </ActionButton>
          <ActionButton isQuiet size="S" aria-label="Bad response">
            <ThumbDown />
          </ActionButton>
        </div>
        {suggestions.length > 0 && (
          <div className="es-ga__next">
            <div className="es-ga__next-title">What would you like to do next?</div>
            <div className="es-ga__chips">
              {suggestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  className="es-ga__chip"
                  onClick={() => handleSubmit(q)}
                  disabled={busy}
                >
                  <ArrowCurved aria-hidden="true" />
                  <span>{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  const lastId = messages.length > 0 ? messages[messages.length - 1].id : null;

  if (!open) {
    // Keep the launcher hidden until get-project has completed (see the priming
    // effect); user prompts still await priming to thread the primed context.
    if (!ready) return null;
    return (
      <button type="button" className="es-ga__launcher" aria-label="Open Gating Assistant" onClick={onOpen}>
        <LauncherSparkle />
      </button>
    );
  }

  return (
    <aside
      className={maximized ? 'es-ga es-ga--max' : 'es-ga'}
      role="dialog"
      aria-label="Gating Assistant"
    >
      <header className="es-ga__header">
        <span className="es-ga__avatar">
          <SparkleIcon />
        </span>
        <div className="es-ga__titles">
          <div className="es-ga__title">Gating Assistant</div>
          {subtitle && <div className="es-ga__subtitle">{subtitle}</div>}
        </div>
        <div className="es-ga__header-actions">
          <button
            type="button"
            className="es-ga__icon-btn"
            aria-label={maximized ? 'Restore panel width' : 'Maximize panel'}
            onClick={onToggleMaximize}
          >
            {maximized ? <Minimize /> : <Maximize />}
          </button>
          <button type="button" className="es-ga__icon-btn" aria-label="Close" onClick={onClose}>
            <Close />
          </button>
        </div>
      </header>

      <div className="es-ga__body" ref={bodyRef} aria-live="polite">
        {messages.map((m) => (
          <div
            key={m.id}
            ref={m.id === lastId ? lastMsgRef : undefined}
            className={`es-ga__msg es-ga__msg--${m.role}`}
          >
            {m.role === 'user' ? (
              <div className="es-ga__user">{m.content}</div>
            ) : (
              <div className="es-ga__assistant es-ga__md">{renderAssistant(m)}</div>
            )}
          </div>
        ))}
      </div>

      <div className="es-ga__footer">
        <div className="es-ga__inputbox" onKeyDown={onKeyDown}>
          <TextArea
            aria-label="Message"
            placeholder="Prompt text goes here"
            value={input}
            onChange={setInput}
            isDisabled={busy}
            styles={inputFieldStyle}
          />
          <div className="es-ga__input-actions">
            <button
              type="button"
              className="es-ga__send"
              aria-label="Send message"
              disabled={busy || !input.trim()}
              onClick={() => handleSubmit(input)}
            >
              <SendIcon />
            </button>
          </div>
        </div>
        <p className="es-ga__disclaimer">
          Responses are generated using AI, and may be inaccurate. Check before using.{' '}
          <a href="https://www.adobe.com/legal/licenses-terms/adobe-gen-ai-user-guidelines.html" target="_blank" rel="noreferrer">
            AI User Guidelines
          </a>
        </p>
      </div>
    </aside>
  );
}

export default GatingAssistant;
