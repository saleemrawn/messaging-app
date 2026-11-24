import { useEffect, useId, useRef, type SubmitEvent } from "react";
import { useFetcher } from "react-router";
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

  return (
    <fetcher.Form
      ref={formRef}
      method="post"
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 border-t border-gray-200 px-6 py-4"
    >
      <FormError id={errorId} message={error} />
      <div className="flex items-end gap-2 rounded-2xl border border-gray-300 bg-white p-2 focus-within:border-blue-600">
        <input type="hidden" name="recipientId" value={recipientId} />
        <textarea
          ref={textareaRef}
          name="content"
          aria-label="Message"
          autoFocus={shouldAutoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          placeholder="Write a message…"
          rows={2}
          maxLength={MAX_MESSAGE_LENGTH}
          className="min-w-0 flex-1 resize-none px-2 py-1 outline-none"
        />
        <button
          type="submit"
          aria-disabled={isSending}
          className="rounded-xl bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 aria-disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </fetcher.Form>
  );
}

export default MessageComposer;
