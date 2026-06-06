-- AlterTable
ALTER TABLE "bridge_health" ADD COLUMN     "transfers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "true_collisions" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "player_season_panel" ADD COLUMN     "multi_squad_count" SMALLINT NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "player_season_panel_season_id_multi_squad_count_idx" ON "player_season_panel"("season_id", "multi_squad_count");
