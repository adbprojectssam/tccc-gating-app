/*
 * <license header>
 */

import { useEffect, useRef, useState } from 'react';
import { style } from '@react-spectrum/s2/style' with { type: 'macro' };
import { ActionButton, TextArea } from '@react-spectrum/s2';
import Send from '@react-spectrum/s2/icons/Send';
import Add from '@react-spectrum/s2/icons/Add';
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

let idCounter = 0;
const nextId = () => `g${(idCounter += 1)}`;

/** Sparkle glyph for the header avatar. */
function SparkleIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M11.2 1.6c.22 3.2 1.4 4.38 4.6 4.6-3.2.22-4.38 1.4-4.6 4.6-.22-3.2-1.4-4.38-4.6-4.6 3.2-.22 4.38-1.4 4.6-4.6z" />
      <path d="M5.6 11.2c.14 1.86.86 2.58 2.72 2.72-1.86.14-2.58.86-2.72 2.72-.14-1.86-.86-2.58-2.72-2.72 1.86-.14 2.58-.86 2.72-2.72z" />
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
function GatingAssistant({ open, maximized, subtitle, onOpen, onClose, onToggleMaximize }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const authRef = useRef(null);
  const primedRef = useRef(false);
  const primePromiseRef = useRef(null);
  const contextIdRef = useRef(null);
  const bodyRef = useRef(null);
  const stickToBottomRef = useRef(true);
  const lastMsgRef = useRef(null);

  // Prime the agent with the current project id (invisible), capturing the
  // conversation contextId so later prompts continue the same thread.
  useEffect(() => {
    let active = true;
    getImsAuth().then((a) => {
      if (!active) return;
      authRef.current = a;
      if (!primedRef.current && a.imsToken && a.projectId) {
        primedRef.current = true;
        primePromiseRef.current = streamChat({
          prompt: `project id ${a.projectId}`,
          imsToken: a.imsToken,
        })
          .then((res) => {
            if (res && res.contextId) contextIdRef.current = res.contextId;
          })
          .catch(() => {});
      }
    });
    return () => {
      active = false;
    };
  }, []);

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
    return (
      <button type="button" className="es-ga__launcher" aria-label="Open Gating Assistant" onClick={onOpen}>
        <SparkleIcon />
        <span>Gating Assistant</span>
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
            <button type="button" className="es-ga__attach" aria-label="Add attachment">
              <Add />
            </button>
            <button
              type="button"
              className="es-ga__send"
              aria-label="Send message"
              disabled={busy || !input.trim()}
              onClick={() => handleSubmit(input)}
            >
              <Send />
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
