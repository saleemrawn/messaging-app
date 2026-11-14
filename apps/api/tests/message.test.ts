import message from "../src/message/message-routes.ts";
import express, { type Express } from "express";
import request from "supertest";
import {
  populateConversation,
  populateMessage,
  populateUser,
  populateUserAccount,
  populateUserConversation,
  resetDbTables,
} from "./helpers/database.ts";
import { beforeEach, describe, expect, test } from "vitest";
import { anyString } from "./helpers/types.ts";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/messages", message);

beforeEach(async () => {
  await resetDbTables();
  await populateUser();
  await populateUserAccount();
  await populateConversation();
  await populateUserConversation();
  await populateMessage();
});

describe("message route", () => {
  describe("delete message route", () => {
    test("delete message", async () => {
      const res = await request(app).delete("/api/messages/1");

      expect(res.status).toBe(200);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: true,
        data: { id: 1, deletedAt: anyString() },
      });
    });

    test("returns validation error for message ID type", async () => {
      const res = await request(app).delete("/api/messages/abc");

      expect(res.status).toBe(400);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        errors: [
          {
            type: "field",
            value: "abc",
            msg: "Invalid param message ID, expected number",
            path: "id",
            location: "params",
          },
        ],
      });
    });
  });
});
