import { redirect } from "@sveltejs/kit";

// Community used to be a panel on this route (?community); old links land on its own page
export const load = ({ url }) => {
  if (url.searchParams.has("community")) redirect(307, "/community");
};
