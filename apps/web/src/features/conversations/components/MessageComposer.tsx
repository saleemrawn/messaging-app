import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type SubmitEvent,
} from "react";
import { useFetcher } from "react-router";
import { SendHorizontal } from "lucide-react";
import type { SendMessageResult } from "../actions.ts";
import FormError from "../../../shared/components/FormError.tsx";

// Matches the API's content validator.
const MAX_MESSAGE_LENGTH = 5000;

interface MessageComposerProps {
  recipientId: number;
  // Focus the message box on mount, e.g. for a conversation just started.
  shouldAutoFocus?: boolean;
}

// Posts to the current conversation route's action. Mount it with a key per
// conversation so a draft and its error don't carry over to another one.
function MessageComposer({
  recipientId,
  shouldAutoFocus = false,
}: MessageComposerProps) {
  const fetcher = useFetcher<SendMessageResult>();
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const submittedContentRef = useRef<string | null>(null);
  const errorId = useId();
  const hintId = useId();
  const isSending = fetcher.state !== "idle";
  const result = fetcher.data;
  const error = !isSending && result && !result.ok ? result.error : undefined;

  // The action's result arrives before the page finishes revalidating, so this
  // reacts to the result rather than the click. It only clears the box if the
  // user hasn't kept typing since, then hands focus back for the next message.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!result?.ok || !textarea) return;
    if (textarea.value === submittedContentRef.current) {
      formRef.current?.reset();
    }
    submittedContentRef.current = null;
    textarea.focus();
  }, [result]);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    // aria-disabled rather than disabled keeps focus on the button while sending.
    if (isSending) {
      event.preventDefault();
      return;
    }
    submittedContentRef.current = textareaRef.current?.value ?? null;
  }

  // Enter sends and Shift + Enter falls through to the default new line. Skip
  // Enter while an IME is composing, where it confirms a character instead.
  // requestSubmit() goes through handleSubmit, so its sending guard still applies.
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }
    event.preventDefault();
    formRef.current?.requestSubmit();
  }

  return (
    <fetcher.Form
      ref={formRef}
      method="post"
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 px-4 pt-2 pb-4 sm:px-8 sm:pb-6"
    >
      <FormError id={errorId} message={error} />
      <div className="flex items-end gap-2 rounded-xl border border-line-strong bg-white p-3 focus-within:border-brand">
        <input type="hidden" name="recipientId" value={recipientId} />
        <textarea
          ref={textareaRef}
          name="content"
          aria-label="Message"
          autoFocus={shouldAutoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${errorId} ${hintId}` : hintId}
          onKeyDown={handleKeyDown}
          placeholder="Write a message…"
          rows={2}
          maxLength={MAX_MESSAGE_LENGTH}
          className="min-w-0 flex-1 resize-none px-1 py-1 text-sm leading-[1.55] text-ink outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          aria-label="Send"
          aria-disabled={isSending}
          className="flex size-11 shrink-0 items-center justify-center rounded-[9px] bg-brand text-white hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand aria-disabled:opacity-50"
        >
          <SendHorizontal aria-hidden="true" className="size-5.5" strokeWidth={1.75} />
        </button>
      </div>
      <p id={hintId} className="px-1 text-[10px] text-muted">
        Enter to send · Shift + Enter for a new line
      </p>
    </fetcher.Form>
  );
}

export default MessageComposer;
