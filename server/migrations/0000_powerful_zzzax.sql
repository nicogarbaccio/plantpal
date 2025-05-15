CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text,
	"plant_count" integer DEFAULT 0,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "plants" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"botanical_name" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text,
	"watering_frequency" integer NOT NULL,
	"light_requirements" text NOT NULL,
	"difficulty" text NOT NULL,
	"category" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_plants" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"plant_id" integer NOT NULL,
	"nickname" text,
	"location" text,
	"last_watered" date,
	"watering_frequency" integer NOT NULL,
	"next_water_date" date,
	"image_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "watering_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_plant_id" integer NOT NULL,
	"watered_date" date NOT NULL,
	"notes" text
);
