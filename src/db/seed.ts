import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./seed-db";
import { customers, phases, models, users } from "./schema";

async function main() {
  // 1) Crea azienda interna (unica)
const [internal] = await db
  .insert(customers)
  .values({
    name: "AZIENDA_INTERNA",
    isInternal: true,
    isActive: true,
  })
  .returning();

// 2) Crea due clienti demo
const [cust1] = await db
  .insert(customers)
  .values({ name: "Azienda 1", isInternal: false, isActive: true })
  .returning();

const [cust2] = await db
  .insert(customers)
  .values({ name: "Azienda 2", isInternal: false, isActive: true })
  .returning();

  // 3) Fasi per Azienda 1 (esempio 3 fasi classiche)
  await db.insert(phases).values([
    { customerId: cust1.id, name: "Assemblaggio", sortOrder: 1, isFinal: false, isActive: true },
    { customerId: cust1.id, name: "Collaudo", sortOrder: 2, isFinal: false, isActive: true },
    { customerId: cust1.id, name: "Imballo", sortOrder: 3, isFinal: true, isActive: true },
  ]);

  // 4) Fasi per Azienda 2 (esempio “complesso”)
  await db.insert(phases).values([
    { customerId: cust2.id, name: "Prog. C.S.", sortOrder: 1, isFinal: false, isActive: true },
    { customerId: cust2.id, name: "Robotest (1° collaudo)", sortOrder: 2, isFinal: false, isActive: true },
    { customerId: cust2.id, name: "Assemblaggio", sortOrder: 3, isFinal: false, isActive: true },
    { customerId: cust2.id, name: "Amplitest (2° collaudo)", sortOrder: 4, isFinal: false, isActive: true },
    { customerId: cust2.id, name: "Pulizia finale prodotto", sortOrder: 5, isFinal: false, isActive: true },
    { customerId: cust2.id, name: "Imballaggio", sortOrder: 6, isFinal: true, isActive: true },
  ]);

 // 5) Crea modelli demo (ora appartengono a UNA azienda: models.customerId)
const [m1] = await db
  .insert(models)
  .values({
    customerId: cust1.id,
    name: "Primo Prodotto",
    code: "001010",
    isActive: true,
  })
  .returning();

const [m2] = await db
  .insert(models)
  .values({
    customerId: cust1.id,
    name: "Prodotto A",
    code: "PA-001",
    isActive: true,
  })
  .returning();

const [m3] = await db
  .insert(models)
  .values({
    customerId: cust2.id,
    name: "Prodotto C",
    code: "PC-100",
    isActive: true,
  })
  .returning();

  /*
  // 6) Associa modelli alle aziende (così nei menu filtri per azienda)
  await db.insert(customerModels).values([
    { customerId: cust1.id, modelId: m1.id, isActive: true },
    { customerId: cust1.id, modelId: m2.id, isActive: true },
    { customerId: cust2.id, modelId: m3.id, isActive: true },
  ]);
*/

  // 7) Crea admin (username/password)
  const passwordHash = await bcrypt.hash("admin123", 10);

  await db.insert(users).values({
    firstName: "Admin",
    lastName: "Produzione",
    employeeCode: "ADM001",
    username: "admin",
    passwordHash,
    role: "ADMIN",
    isActive: true,
  });

  // 8) Crea un operatore demo
  const workerHash = await bcrypt.hash("operaio123", 10);

  await db.insert(users).values({
    firstName: "Mario",
    lastName: "Rossi",
    employeeCode: "OP001",
    username: "mrossi",
    passwordHash: workerHash,
    role: "WORKER",
    isActive: true,
  });

  console.log("✅ Seed completato:", {
    internalCustomerId: internal.id,
    customer1Id: cust1.id,
    customer2Id: cust2.id,
  });
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  });
