-- CreateTable
CREATE TABLE "competitions" (
    "competition_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "tier" SMALLINT,
    "fbref_comp_name" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competitions_pkey" PRIMARY KEY ("competition_id")
);

-- CreateTable
CREATE TABLE "clubs" (
    "club_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "name_norm" TEXT NOT NULL,
    "competition_id" TEXT,
    "country" TEXT,
    "stadium_name" TEXT,
    "squad_size" SMALLINT,
    "average_age" DECIMAL(4,2),
    "last_season" SMALLINT,
    "url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("club_id")
);

-- CreateTable
CREATE TABLE "seasons" (
    "season_id" TEXT NOT NULL,
    "start_year" SMALLINT NOT NULL,
    "end_year" SMALLINT NOT NULL,
    "mv_start_cutoff" DATE NOT NULL,
    "mv_end_cutoff" DATE NOT NULL,
    "is_complete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("season_id")
);

-- CreateTable
CREATE TABLE "players" (
    "tm_player_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "name_norm" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "date_of_birth" DATE,
    "dob_year" SMALLINT,
    "country_of_birth" TEXT,
    "citizenship" TEXT,
    "nation_iso" TEXT,
    "sub_position" TEXT,
    "position" TEXT,
    "pos_pool" TEXT,
    "foot" TEXT,
    "height_cm" SMALLINT,
    "current_club_id" INTEGER,
    "contract_expires" DATE,
    "agent_name" TEXT,
    "last_season" SMALLINT,
    "url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "players_pkey" PRIMARY KEY ("tm_player_id")
);

-- CreateTable
CREATE TABLE "player_valuations" (
    "tm_player_id" INTEGER NOT NULL,
    "valuation_date" DATE NOT NULL,
    "market_value_eur" BIGINT NOT NULL,
    "club_id" INTEGER,

    CONSTRAINT "player_valuations_pkey" PRIMARY KEY ("tm_player_id","valuation_date")
);

-- CreateTable
CREATE TABLE "player_id_bridge" (
    "fbref_key" TEXT NOT NULL,
    "fbref_player" TEXT NOT NULL,
    "fbref_squad" TEXT NOT NULL,
    "fbref_comp" TEXT NOT NULL,
    "fbref_born" SMALLINT,
    "fbref_nation" TEXT,
    "tm_player_id" INTEGER,
    "match_confidence" DECIMAL(3,2),
    "match_tier" SMALLINT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "matched_at" TIMESTAMPTZ,
    "notes" TEXT,

    CONSTRAINT "player_id_bridge_pkey" PRIMARY KEY ("fbref_key")
);

-- CreateTable
CREATE TABLE "player_season_stats_fbref" (
    "fbref_key" TEXT NOT NULL,
    "season_id" TEXT NOT NULL,
    "comp" TEXT,
    "squad" TEXT,
    "age" SMALLINT,
    "mp" SMALLINT,
    "starts" SMALLINT,
    "minutes" INTEGER,
    "nineties" DECIMAL(6,2),
    "gls" SMALLINT,
    "ast" SMALLINT,
    "g_pk" SMALLINT,
    "xg" DECIMAL(6,3),
    "npxg" DECIMAL(6,3),
    "xag" DECIMAL(6,3),
    "sh" SMALLINT,
    "sot" SMALLINT,
    "prgc" SMALLINT,
    "prgp" SMALLINT,
    "prgr" SMALLINT,
    "tkl" SMALLINT,
    "tklw" SMALLINT,
    "int_" SMALLINT,
    "blocks" SMALLINT,
    "clr" SMALLINT,
    "sca" SMALLINT,
    "gca" SMALLINT,
    "touches" INTEGER,
    "carries" INTEGER,
    "psxg" DECIMAL(6,3),
    "saves" SMALLINT,
    "save_pct" DECIMAL(5,2),
    "raw_json" JSONB,
    "has_opta_features" BOOLEAN,
    "ingested_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_season_stats_fbref_pkey" PRIMARY KEY ("fbref_key","season_id")
);

-- CreateTable
CREATE TABLE "player_season_panel" (
    "tm_player_id" INTEGER NOT NULL,
    "season_id" TEXT NOT NULL,
    "comp" TEXT,
    "squad" TEXT,
    "age_at_season_start" SMALLINT NOT NULL,
    "pos_pool" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "mv_start_eur" BIGINT,
    "mv_end_eur" BIGINT,
    "mv_start_date" DATE,
    "mv_end_date" DATE,
    "dlog_mv" DECIMAL(8,5),
    "features" JSONB NOT NULL,
    "percentile_in_pool" JSONB,
    "has_opta_features" BOOLEAN,
    "match_confidence" DECIMAL(3,2),
    "built_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_season_panel_pkey" PRIMARY KEY ("tm_player_id","season_id")
);

-- CreateTable
CREATE TABLE "bridge_health" (
    "season_id" TEXT NOT NULL,
    "checked_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fbref_rows" INTEGER NOT NULL,
    "matched_rows" INTEGER NOT NULL,
    "verified_rows" INTEGER NOT NULL,
    "coverage_pct" DECIMAL(5,2) NOT NULL,
    "collisions" INTEGER NOT NULL,
    "drift_flags" INTEGER NOT NULL,

    CONSTRAINT "bridge_health_pkey" PRIMARY KEY ("season_id","checked_at")
);

-- CreateIndex
CREATE INDEX "clubs_name_norm_idx" ON "clubs"("name_norm");

-- CreateIndex
CREATE INDEX "players_name_norm_dob_year_idx" ON "players"("name_norm", "dob_year");

-- CreateIndex
CREATE INDEX "players_nation_iso_idx" ON "players"("nation_iso");

-- CreateIndex
CREATE INDEX "players_pos_pool_idx" ON "players"("pos_pool");

-- CreateIndex
CREATE INDEX "player_valuations_tm_player_id_valuation_date_idx" ON "player_valuations"("tm_player_id", "valuation_date" DESC);

-- CreateIndex
CREATE INDEX "player_id_bridge_tm_player_id_idx" ON "player_id_bridge"("tm_player_id");

-- CreateIndex
CREATE INDEX "player_id_bridge_verified_match_confidence_idx" ON "player_id_bridge"("verified", "match_confidence");

-- CreateIndex
CREATE INDEX "player_season_stats_fbref_season_id_idx" ON "player_season_stats_fbref"("season_id");

-- CreateIndex
CREATE INDEX "player_season_panel_season_id_pos_pool_idx" ON "player_season_panel"("season_id", "pos_pool");

-- AddForeignKey
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "competitions"("competition_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_current_club_id_fkey" FOREIGN KEY ("current_club_id") REFERENCES "clubs"("club_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_valuations" ADD CONSTRAINT "player_valuations_tm_player_id_fkey" FOREIGN KEY ("tm_player_id") REFERENCES "players"("tm_player_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_valuations" ADD CONSTRAINT "player_valuations_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("club_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_id_bridge" ADD CONSTRAINT "player_id_bridge_tm_player_id_fkey" FOREIGN KEY ("tm_player_id") REFERENCES "players"("tm_player_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_season_stats_fbref" ADD CONSTRAINT "player_season_stats_fbref_fbref_key_fkey" FOREIGN KEY ("fbref_key") REFERENCES "player_id_bridge"("fbref_key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_season_stats_fbref" ADD CONSTRAINT "player_season_stats_fbref_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("season_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_season_panel" ADD CONSTRAINT "player_season_panel_tm_player_id_fkey" FOREIGN KEY ("tm_player_id") REFERENCES "players"("tm_player_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_season_panel" ADD CONSTRAINT "player_season_panel_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("season_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bridge_health" ADD CONSTRAINT "bridge_health_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("season_id") ON DELETE RESTRICT ON UPDATE CASCADE;
