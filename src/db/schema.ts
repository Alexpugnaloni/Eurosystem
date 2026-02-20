import {
  pgTable,
  pgEnum,
  bigserial,
  varchar,
  text,
  boolean,
  integer,
  date,
  time,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/**
 * ENUM
 */
export const roleEnum = pgEnum("role", ["ADMIN", "WORKER"]);
export const activityTypeEnum = pgEnum("activity_type", ["PRODUCTION", "CLEANING"]);

/**
 * USERS (Dipendenti / Admin)
 */
export const users = pgTable(
  "users",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),

    firstName: varchar("first_name", { length: 80 }).notNull(),
    lastName: varchar("last_name", { length: 80 }).notNull(),

    employeeCode: varchar("employee_code", { length: 50 }).notNull(), // codice identificativo interno
    username: varchar("username", { length: 80 }).notNull(), // login
    passwordHash: text("password_hash").notNull(),

    role: roleEnum("role").notNull().default("WORKER"),
    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uxEmployeeCode: uniqueIndex("ux_users_employee_code").on(t.employeeCode),
    uxUsername: uniqueIndex("ux_users_username").on(t.username),
  })
);

/**
 * CUSTOMERS (Aziende per cui lavorate + Azienda interna)
 */
export const customers = pgTable(
  "customers",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    isInternal: boolean("is_internal").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uxCustomerName: uniqueIndex("ux_customers_name").on(t.name),
  })
);

/**
 * MODELS (Prodotti/Modelli - gestiti dall'admin)
 * Nota: anagrafica generale, poi li "colleghi" alle aziende tramite customer_models
 */
export const models = pgTable(
  "models",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),

    name: varchar("name", { length: 200 }).notNull(),
    code: varchar("code", { length: 80 }).notNull(),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uxModelName: uniqueIndex("ux_models_name").on(t.name),
    ixModelCode: index("ix_models_code").on(t.code),
  })
);

/**
 * CUSTOMER_MODELS (Associazione modelli <-> aziende)
 * Serve per far vedere all’operatore solo i modelli dell’azienda selezionata
 */
export const customerModels = pgTable(
  "customer_models",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),

    customerId: bigserial("customer_id", { mode: "bigint" }).notNull(),
    modelId: bigserial("model_id", { mode: "bigint" }).notNull(),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uxCustomerModel: uniqueIndex("ux_customer_models_customer_model").on(t.customerId, t.modelId),
    ixCustomerModelsCustomer: index("ix_customer_models_customer").on(t.customerId),
    ixCustomerModelsModel: index("ix_customer_models_model").on(t.modelId),
  })
);

/**
 * PHASES (Fasi di produzione per azienda)
 */
export const phases = pgTable(
  "phases",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),

    customerId: bigserial("customer_id", { mode: "bigint" }).notNull(),

    name: varchar("name", { length: 120 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(1),
    isFinal: boolean("is_final").notNull().default(false),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uxPhaseCustomerName: uniqueIndex("ux_phases_customer_name").on(t.customerId, t.name),
    ixPhasesCustomer: index("ix_phases_customer").on(t.customerId),
    ixPhasesFinal: index("ix_phases_is_final").on(t.isFinal),
  })
);

/**
 * WORK_LOGS (Scheda lavoro compilata dai dipendenti)
 *
 * - workDate: data lavorazione (può essere passata/oggi)
 * - startTime / endTime: orari inseriti dall’operatore
 * - durationMinutes: calcolato dal server (end - start), NO mezzanotte
 * - activityType:
 *    - PRODUCTION: richiede modelId e phaseId, qtyOk/qtyKo hanno senso
 *    - CLEANING: imputabile a customerId (cliente o interna), modelId/phaseId possono essere null
 */
export const workLogs = pgTable(
  "work_logs",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),

    workDate: date("work_date").notNull(),

    userId: bigserial("user_id", { mode: "bigint" }).notNull(),
    customerId: bigserial("customer_id", { mode: "bigint" }).notNull(),
    activityType: activityTypeEnum("activity_type").notNull(),

    modelId: bigserial("model_id", { mode: "bigint" }),
    phaseId: bigserial("phase_id", { mode: "bigint" }),

    startTime: time("start_time"), // HH:MM:SS
    endTime: time("end_time"),
    durationMinutes: integer("duration_minutes").notNull(),

    qtyOk: integer("qty_ok").notNull().default(0),
    qtyKo: integer("qty_ko").notNull().default(0),

    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    ixWorkDate: index("ix_work_logs_work_date").on(t.workDate),
    ixWorkUser: index("ix_work_logs_user").on(t.userId),
    ixWorkCustomer: index("ix_work_logs_customer").on(t.customerId),
    ixWorkModel: index("ix_work_logs_model").on(t.modelId),
    ixWorkPhase: index("ix_work_logs_phase").on(t.phaseId),
    ixWorkActivity: index("ix_work_logs_activity_type").on(t.activityType),
  })
);

/**
 * DELIVERIES (Consegne)
 * Serve per scalare la disponibilità "pronta" (fase finale) quando consegni
 */
export const deliveries = pgTable(
  "deliveries",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),

    deliveryDate: date("delivery_date").notNull(),

    customerId: bigserial("customer_id", { mode: "bigint" }).notNull(),
    modelId: bigserial("model_id", { mode: "bigint" }).notNull(),

    quantity: integer("quantity").notNull(),
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    ixDeliveriesCustomerModelDate: index("ix_deliveries_customer_model_date").on(
      t.customerId,
      t.modelId,
      t.deliveryDate
    ),
  })
);

export const sessions = pgTable(
  "sessions",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    userId: bigserial("user_id", { mode: "bigint" }).notNull(),
    token: varchar("token", { length: 128 }).notNull(), // token random
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uxSessionToken: uniqueIndex("ux_sessions_token").on(t.token),
    ixSessionUser: index("ix_sessions_user").on(t.userId),
    ixSessionExpires: index("ix_sessions_expires").on(t.expiresAt),
  })
);
