import { useMatch } from "react-router";
import { useMediaQuery } from "../../shared/hooks/use-media-query.ts";
import { matchesMediaQuery } from "../../shared/utils/media-query.ts";
import { CONVERSATION_PATH } from "./paths.ts";

// Where the messages page shows the conversation list and viewer side by side:
// desktop, or a landscape tablet. The min-height keeps landscape phones (about
// 430px tall) single-column, where the list and viewer are separate screens.
const SPLIT_VIEW_QUERY =
  "(min-width: 80rem), (min-width: 48rem) and (min-height: 40rem) and (orientation: landscape)";

function isSplitView(): boolean {
  return matchesMediaQuery(SPLIT_VIEW_QUERY);
}

function useIsSplitView(): boolean {
  return useMediaQuery(SPLIT_VIEW_QUERY);
}

// Whether an open conversation has the whole screen to itself, which is the
// case in single-column view. The app hides its top bar then.
function useIsConversationFullScreen(): boolean {
  const isSplit = useIsSplitView();
  const isConversationOpen = useMatch(CONVERSATION_PATH) !== null;
  return isConversationOpen && !isSplit;
}

export {
  SPLIT_VIEW_QUERY,
  isSplitView,
  useIsConversationFullScreen,
  useIsSplitView,
};
