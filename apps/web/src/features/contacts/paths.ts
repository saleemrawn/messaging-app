const CONTACTS_PATH = "/contacts";

// Resource route: its loader looks up users by email, its action adds one as
// a contact. The static segment keeps it apart from the page route.
const ADD_CONTACT_PATH = `${CONTACTS_PATH}/new`;

export { ADD_CONTACT_PATH, CONTACTS_PATH };
