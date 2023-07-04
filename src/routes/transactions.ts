import { FastifyInstance } from "fastify";
import { z } from "zod";
import { knex } from "../database";
import { randomUUID } from "crypto";

export async function transactionsRoutes(app: FastifyInstance) {
  app.post("/", async (request, response) => {
    const createTransactionBodySchema = z.object({
      title: z.string().min(3, "The title needs at least 3 characters"),
      amount: z.number(),
      type: z.enum(["credit", "debit"]),
    });

    const { title, amount, type } = createTransactionBodySchema.parse(
      request.body
    );

    await knex("transactions").insert({
      id: randomUUID(),
      title,
      amount: type === "credit" ? amount : amount * -1,
    });

    response.status(201).send("Created transaction");
  });
  app.delete("/:id", async (request, response) => {
    const getTransactionParamsSchema = z.object({ id: z.string().uuid() });
    const { id } = getTransactionParamsSchema.parse(request.params);

    await knex("transactions").delete().where("id", id);

    response.status(201).send("Deleted transaction");
  });

  app.get("/summary", async () => {
    const credit = await knex("transactions")
      .sum("amount", { as: "credit" })
      .where("amount", ">", 0)
      .first()
      .then((value) => Number(value?.credit));

    const debit = await knex("transactions")
      .sum("amount", { as: "debit" })
      .where("amount", "<", 0)
      .first()
      .then((value) => Number(value?.debit));

    const summary = {
      amount: credit + debit,
      credit,
      debit: debit * -1,
    };

    return { summary };
  });
}