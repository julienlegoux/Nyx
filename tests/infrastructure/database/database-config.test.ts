import { describe, expect, it } from "bun:test";
import { connectDatabase, runMigrations } from "@nyx/infrastructure/database/index.ts";

describe("database.config", () => {
	it("connectDatabase is a function", () => {
		expect(typeof connectDatabase).toBe("function");
	});

	it("runMigrations is a function", () => {
		expect(typeof runMigrations).toBe("function");
	});

	it("connectDatabase returns DatabaseConnection with db and pool (lazy pool)", () => {
		const mockConfig = {
			host: "localhost",
			port: 5432,
			name: "test_db",
			user: "test_user",
			password: "test_pass",
		};

		const connection = connectDatabase(mockConfig);
		expect(connection.db).toBeDefined();
		expect(connection.pool).toBeDefined();
		expect(typeof connection.pool.end).toBe("function");
	});
});
