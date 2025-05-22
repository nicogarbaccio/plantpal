ALTER TABLE "user_plants" ALTER COLUMN "nickname" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_plants" ALTER COLUMN "last_watered" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_plants" ALTER COLUMN "next_water_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_plants" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_plants" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "watering_history" ALTER COLUMN "watered_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_plants" ADD COLUMN "needs_initial_watering" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "watering_history" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_plants" ADD CONSTRAINT "user_plants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_plants" ADD CONSTRAINT "user_plants_plant_id_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id") ON DELETE no action ON UPDATE no action;