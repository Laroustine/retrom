use std::collections::HashMap;

use axum::{
    extract::{Path, Query, State},
    routing::get,
    Json, Router,
};
use db::{
    models::{game::Game, platform::Platform},
    schema::{games, platforms},
    Pool,
};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde::Serialize;
use uuid::Uuid;

use crate::routes::utils::{define_route_handler, internal_error, StringResponse};

#[derive(Debug, Serialize)]
pub struct PlatformData {
    platform: Platform,
    games: Option<Vec<Game>>,
}

pub fn get_platform() -> Router<Pool> {
    async fn handler(
        State(pool): State<Pool>,
        Path(path_id): Path<String>,
        Query(params): Query<HashMap<String, String>>,
    ) -> Result<Json<PlatformData>, StringResponse> {
        let mut conn = match pool.get().await {
            Ok(conn) => conn,
            Err(why) => return Err(internal_error(why)),
        };

        let platform_id = match Uuid::parse_str(&path_id) {
            Ok(platform_id) => platform_id,
            Err(why) => return Err(internal_error(why)),
        };

        let row: Platform = match platforms::table
            .filter(platforms::id.eq(platform_id))
            .first(&mut conn)
            .await
        {
            Ok(row) => row,
            Err(why) => return Err(internal_error(why)),
        };

        let mut response = PlatformData {
            platform: row,
            games: None,
        };

        if let Some(_) = params.get("with_games") {
            let games: Vec<Game> = match games::table
                .filter(games::platform_id.eq(platform_id))
                .load(&mut conn)
                .await
            {
                Ok(games) => games,
                Err(why) => return Err(internal_error(why)),
            };

            response.games = Some(games);
        }

        Ok(Json(response))
    }

    define_route_handler("/:id", get(handler))
}
