import {
  pgTable,
  pgEnum,
  bigserial,
  bigint,
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
 * MODELS (Prodotti/Modelli - appartengono ad UNA sola azienda)
 * - PK tecnica: id
 * - code: opzionale (nullable), ma se presente deve essere unico per azienda
 */
export const models = pgTable(
  "models",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),

    customerId: bigint("customer_id", { mode: "bigint" })
      .notNull()
      .references(() => customers.id),

    name: varchar("name", { length: 200 }).notNull(),

    // ✅ opzionale: può essere NULL
    code: varchar("code", { length: 80 }),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    // ✅ niente più unique globale sul name
    uxModelCustomerName: uniqueIndex("ux_models_customer_name").on(t.customerId, t.name),

    // ✅ code unico per customer (NULL ammessi, quindi più modelli senza code ok)
    uxModelCustomerCode: uniqueIndex("ux_models_customer_code").on(t.customerId, t.code),

    ixModelsCustomer: index("ix_models_customer").on(t.customerId),
    ixModelsCode: index("ix_models_code").on(t.code),
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

// PHASES (Fasi di produzione per azienda)
export const phases = pgTable(
  "phases",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),

    customerId: bigint("customer_id", { mode: "bigint" })
      .notNull()
      .references(() => customers.id),

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
 */

export const workLogs = pgTable(
  "work_logs",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),

    workDate: date("work_date").notNull(),

    userId: bigint("user_id", { mode: "bigint" })
      .notNull()
      .references(() => users.id),

    customerId: bigint("customer_id", { mode: "bigint" })
      .notNull()
      .references(() => customers.id),

    activityType: activityTypeEnum("activity_type").notNull(),

    modelId: bigint("model_id", { mode: "bigint" }).references(() => models.id),
    phaseId: bigint("phase_id", { mode: "bigint" }).references(() => phases.id),

    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
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

    customerId: bigint("customer_id", { mode: "bigint" })
      .notNull()
      .references(() => customers.id),

    modelId: bigint("model_id", { mode: "bigint" })
      .notNull()
      .references(() => models.id),

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
    userId: bigint("user_id", { mode: "bigint" })
      .notNull()
      .references(() => users.id),
    token: varchar("token", { length: 128 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uxSessionToken: uniqueIndex("ux_sessions_token").on(t.token),
    ixSessionUser: index("ix_sessions_user").on(t.userId),
    ixSessionExpires: index("ix_sessions_expires").on(t.expiresAt),
  })
);
