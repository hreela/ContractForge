import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  initialSupply: text("initial_supply").notNull(),
  decimals: integer("decimals").notNull().default(18),
  features: text("features").array().notNull().default([]),
  deployerAddress: text("deployer_address").notNull(),
  contractAddress: text("contract_address"),
  transactionHash: text("transaction_hash"),
  totalCost: integer("total_cost").notNull(),
  isPaid: boolean("is_paid").notNull().default(false),
  isOwnerDeployment: boolean("is_owner_deployment").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  deployedAt: timestamp("deployed_at"),
});

export const contractFeatures = pgTable("contract_features", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").references(() => contracts.id),
  featureName: text("feature_name").notNull(),
  featureConfig: text("feature_config"), // JSON string for feature-specific config
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
  deployedAt: true,
});

export const insertContractFeatureSchema = createInsertSchema(contractFeatures).omit({
  id: true,
});

export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;
export type InsertContractFeature = z.infer<typeof insertContractFeatureSchema>;
export type ContractFeature = typeof contractFeatures.$inferSelect;

// Web3 types
export const deploymentSchema = z.object({
  name: z.string().min(1, "Token name is required"),
  symbol: z.string().min(1, "Token symbol is required"),
  initialSupply: z.string().min(1, "Initial supply is required"),
  decimals: z.number().min(0).max(18).default(18),
  features: z.array(z.string()),
  featureConfig: z.record(z.any()).optional(),
  deployerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
});

export type DeploymentRequest = z.infer<typeof deploymentSchema>;
