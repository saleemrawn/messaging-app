import {
  populateUser,
  populateUserAccount,
  resetDbTables,
} from "./helpers/database.ts";
import { beforeEach, describe, expect, test } from "vitest";
import { prisma } from "../src/lib/prisma.ts";
import {
  createAuthenticatedAgentAs,
  createUnauthenticatedAgent,
} from "./helpers/auth.ts";

beforeEach(async () => {
  await resetDbTables();
  await populateUser();
  await populateUserAccount();
});

const aisha = {
  id: 2,
  firstName: "Aisha",
  lastName: "Doe",
  email: "aisha.doe01@email.com",
  avatarUrl: null,
};
const phillipe = {
  id: 3,
  firstName: "Phillipe",
  lastName: "Doe",
  email: "phillipe.doe01@email.com",
  avatarUrl: null,
};
const jane = {
  id: 4,
  firstName: "Jane",
  lastName: "Doe",
  email: "jane.doe01@email.com",
  avatarUrl: null,
};

// Adds contacts for an account straight through Prisma, skipping the API.
async function addContacts(
  userAccountId: number,
  contactAccountIds: number[],
  deletedAt: Date | null = null,
) {
  await prisma.contact.createMany({
    data: contactAccountIds.map((contactAccountId) => ({
      userAccountId,
      contactAccountId,
      deletedAt,
    })),
  });
}

describe("contact route", () => {
  describe("authentication", () => {
    test("rejects unauthenticated requests with 401", async () => {
      const agent = createUnauthenticatedAgent();

      await agent.get("/api/contacts").expect(401);
      await agent.post("/api/contacts").send({ contactId: 2 }).expect(401);
      await agent.delete("/api/contacts/2").expect(401);
    });
  });

  describe("get contacts route", () => {
    test("returns an empty list when the user has no contacts", async () => {
      const res = await createAuthenticatedAgentAs(1)
        .get("/api/contacts")
        .expect(200);

      expect(res.body).toEqual({ success: true, data: [] });
    });

    test("returns the caller's contacts sorted by name", async () => {
      await addContacts(1, [3, 4, 2]);

      const res = await createAuthenticatedAgentAs(1)
        .get("/api/contacts")
        .expect(200);

      expect(res.body).toEqual({ success: true, data: [aisha, jane, phillipe] });
    });

    test("leaves out removed contacts", async () => {
      await addContacts(1, [2]);
      await addContacts(1, [3], new Date());

      const res = await createAuthenticatedAgentAs(1)
        .get("/api/contacts")
        .expect(200);

      expect(res.body).toEqual({ success: true, data: [aisha] });
    });

    test("leaves out contacts whose account has been deleted", async () => {
      await addContacts(1, [2, 3]);
      await createAuthenticatedAgentAs(3).delete("/api/users/3").expect(200);

      const res = await createAuthenticatedAgentAs(1)
        .get("/api/contacts")
        .expect(200);

      expect(res.body).toEqual({ success: true, data: [aisha] });
    });

    test("doesn't include other users' contacts", async () => {
      await addContacts(2, [3, 4]);

      const res = await createAuthenticatedAgentAs(1)
        .get("/api/contacts")
        .expect(200);

      expect(res.body).toEqual({ success: true, data: [] });
    });
  });

  describe("add contact route", () => {
    test("adds a contact with 201 and returns them", async () => {
      const agent = createAuthenticatedAgentAs(1);

      const res = await agent
        .post("/api/contacts")
        .send({ contactId: 2 })
        .expect(201);

      expect(res.body).toEqual({ success: true, data: aisha });
      const list = await agent.get("/api/contacts").expect(200);
      expect(list.body).toEqual({ success: true, data: [aisha] });
    });

    test("answers 200 without a duplicate when already a contact", async () => {
      const agent = createAuthenticatedAgentAs(1);
      await agent.post("/api/contacts").send({ contactId: 2 }).expect(201);

      const res = await agent
        .post("/api/contacts")
        .send({ contactId: 2 })
        .expect(200);

      expect(res.body).toEqual({ success: true, data: aisha });
      expect(await prisma.contact.count()).toBe(1);
    });

    test("restores a removed contact with 201", async () => {
      await addContacts(1, [2], new Date());

      const res = await createAuthenticatedAgentAs(1)
        .post("/api/contacts")
        .send({ contactId: 2 })
        .expect(201);

      expect(res.body).toEqual({ success: true, data: aisha });
      expect(await prisma.contact.count()).toBe(1);
      const row = await prisma.contact.findFirstOrThrow();
      expect(row.deletedAt).toBeNull();
    });

    test("is one-way: the added user's list is unchanged", async () => {
      await createAuthenticatedAgentAs(1)
        .post("/api/contacts")
        .send({ contactId: 2 })
        .expect(201);

      const res = await createAuthenticatedAgentAs(2)
        .get("/api/contacts")
        .expect(200);

      expect(res.body).toEqual({ success: true, data: [] });
    });

    test("rejects adding yourself with 400", async () => {
      const res = await createAuthenticatedAgentAs(1)
        .post("/api/contacts")
        .send({ contactId: 1 })
        .expect(400);

      expect(res.body).toEqual({
        success: false,
        message: "You can't add yourself as a contact",
      });
      expect(await prisma.contact.count()).toBe(0);
    });

    test("returns 404 for an unknown user", async () => {
      const res = await createAuthenticatedAgentAs(1)
        .post("/api/contacts")
        .send({ contactId: 999 })
        .expect(404);

      expect(res.body).toEqual({ success: false, message: "User not found" });
    });

    test("returns 404 for a deleted user", async () => {
      await createAuthenticatedAgentAs(3).delete("/api/users/3").expect(200);

      await createAuthenticatedAgentAs(1)
        .post("/api/contacts")
        .send({ contactId: 3 })
        .expect(404);
    });

    test("returns 400 when contactId is missing or not a number", async () => {
      const agent = createAuthenticatedAgentAs(1);

      const missing = await agent.post("/api/contacts").send({}).expect(400);
      expect(missing.body).toMatchObject({
        success: false,
        errors: expect.arrayContaining([
          expect.objectContaining({ path: "contactId" }),
        ]) as unknown,
      });

      await agent.post("/api/contacts").send({ contactId: "abc" }).expect(400);
    });
  });

  describe("remove contact route", () => {
    test("removes the contact from the caller's list", async () => {
      await addContacts(1, [2, 3]);
      const agent = createAuthenticatedAgentAs(1);

      const res = await agent.delete("/api/contacts/2").expect(200);

      expect(res.body).toEqual({ success: true, data: { id: 2 } });
      const list = await agent.get("/api/contacts").expect(200);
      expect(list.body).toEqual({ success: true, data: [phillipe] });
      // Soft delete: the row is kept.
      expect(await prisma.contact.count()).toBe(2);
    });

    test("returns 404 when the user isn't a contact", async () => {
      const res = await createAuthenticatedAgentAs(1)
        .delete("/api/contacts/2")
        .expect(404);

      expect(res.body).toEqual({ success: false, message: "Contact not found" });
    });

    test("returns 404 when the contact was already removed", async () => {
      await addContacts(1, [2], new Date());

      await createAuthenticatedAgentAs(1).delete("/api/contacts/2").expect(404);
    });

    test("only changes the caller's list", async () => {
      await addContacts(1, [2]);
      await addContacts(2, [1]);

      await createAuthenticatedAgentAs(1).delete("/api/contacts/2").expect(200);

      const res = await createAuthenticatedAgentAs(2)
        .get("/api/contacts")
        .expect(200);
      expect(res.body).toEqual({
        success: true,
        data: [
          {
            id: 1,
            firstName: "John",
            lastName: "Doe",
            email: "john.doe01@email.com",
            avatarUrl: null,
          },
        ],
      });
    });

    test("returns 400 for a non-numeric id", async () => {
      await createAuthenticatedAgentAs(1).delete("/api/contacts/abc").expect(400);
    });
  });
});
