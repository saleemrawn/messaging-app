import { Router } from "express";
import { handleValidationErrors } from "../middleware/validation-error-middleware.ts";
import { requireAuth } from "../auth/require-auth.ts";
import {
  addContactValidators,
  removeContactValidators,
} from "./contact-validators.ts";
import {
  getContacts,
  addContact,
  removeContact,
} from "./contact-controllers.ts";

const router = Router();

router.use(requireAuth);
router.get("/", getContacts);
router.post("/", addContactValidators, handleValidationErrors, addContact);
router.delete(
  "/:contactId",
  removeContactValidators,
  handleValidationErrors,
  removeContact,
);

export default router;
