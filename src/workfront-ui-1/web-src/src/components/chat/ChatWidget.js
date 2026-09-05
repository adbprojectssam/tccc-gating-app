/*
 * <license header>
 */

import { useEffect, useRef, useState } from "react";
import { style } from "@react-spectrum/s2/style" with { type: "macro" };
import {
  ActionButton,
  TextField,
  CloseButton,
  ProgressCircle,
} from "@react-spectrum/s2";
import Send from "@react-spectrum/s2/icons/Send";
import AiSparkles from "./AiSparkles";
import { getImsAuth } from "../../api/imsAuth";
import { streamChat } from "../../api/chatClient";
import "./chat.css";

const inputField = style({ flexGrow: 1, minWidth: 0 });

let idCounter = 0;
const nextId = () => `m${(idCounter += 1)}`;

/**
 * Floating chat assistant: a bottom-right launcher opens a right-side panel.
 * Each submit streams a response from the agent API; history is held in state
 * for the current session. User messages align left, responses right; the
 * input and send button are disabled until the response finishes.
 */
function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const authRef = useRef(null);
  const listRef = useRef(null);

  // Prefetch IMS auth (token + org) used to authorize the agent call.
  useEffect(() => {
    getImsAuth().then((a) => {
      authRef.current = a;
    });
  }, []);

  // Keep the newest message in view.
  useEffect(() => {
    if (listRef.current)
      listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  const submit = async () => {
    const prompt = input.trim();
    if (!prompt || busy) return;

    const botId = nextId();
    setMessages((m) => [
      ...m,
      { id: nextId(), role: "user", content: prompt },
      { id: botId, role: "assistant", content: "" },
    ]);
    setInput("");
    setBusy(true);

    try {
      const auth = authRef.current || (await getImsAuth());
      authRef.current = auth;
      await streamChat({
        prompt,
        imsToken: auth.imsToken,
        imsOrg: auth.imsOrg,
        onToken: (t) =>
          setMessages((m) =>
            m.map((x) =>
              x.id === botId ? { ...x, content: x.content + t } : x,
            ),
          ),
      });
      setMessages((m) =>
        m.map((x) =>
          x.id === botId && !x.content ? { ...x, content: "(no response)" } : x,
        ),
      );
    } catch (e) {
      setMessages((m) =>
        m.map((x) =>
          x.id === botId ? { ...x, content: e.message, error: true } : x,
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="es-chat">
      {!open && (
        <button
          type="button"
          className="es-chat__launcher"
          aria-label="Open assistant chat"
          onClick={() => setOpen(true)}
        >
          <AiSparkles />
        </button>
      )}

      {open && (
        <section
          className="es-chat__panel"
          role="dialog"
          aria-label="Assistant chat"
        >
          <header className="es-chat__header">
            <span className="es-chat__title">AI Assistant</span>
            <CloseButton onPress={() => setOpen(false)} />
          </header>

          <div className="es-chat__messages" ref={listRef} aria-live="polite">
            {messages.length === 0 && (
              <p className="es-chat__empty">Ask a question to get started.</p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`es-chat__row es-chat__row--${m.role}`}
              >
                <div
                  className={`es-chat__bubble es-chat__bubble--${m.role}${m.error ? " es-chat__bubble--error" : ""}`}
                >
                  {m.content ? (
                    m.content
                  ) : m.role === "assistant" && busy ? (
                    <ProgressCircle
                      size="S"
                      isIndeterminate
                      aria-label="Waiting for response"
                    />
                  ) : (
                    ""
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="es-chat__input">
            <TextField
              aria-label="Message"
              value={input}
              onChange={setInput}
              onKeyDown={onKeyDown}
              placeholder="Type a message…"
              isDisabled={busy}
              styles={inputField}
            />
            <ActionButton
              aria-label="Send message"
              onPress={submit}
              isDisabled={busy || !input.trim()}
            >
              <Send />
            </ActionButton>
          </div>
        </section>
      )}
    </div>
  );
}

export default ChatWidget;
