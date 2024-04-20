use axum::{extract::State, routing::get, Json, Router};
use db::{models::platform::Platform, Pool};
use diesel_async::RunQueryDsl;
use serde::Serialize;

use crate::routes::utils::{define_route_handler, internal_error, StringResponse};

#[derive(Debug, Serialize)]
pub struct PlatformsData {
    platforms: Vec<Platform>,
}

pub fn get_root() -> Router<Pool> {
    async fn handler(State(pool): State<Pool>) -> Result<Json<PlatformsData>, StringResponse> {
        use db::schema::platforms::dsl::*;

        let mut conn = match pool.get().await {
            Ok(conn) => conn,
            Err(why) => return Err(internal_error(why)),
        };

        let rows: Vec<Platform> = match platforms.load(&mut conn).await {
            Ok(rows) => rows,
            Err(why) => return Err(internal_error(why)),
        };

        let response = PlatformsData { platforms: rows };

        Ok(Json(response))
    }

    define_route_handler("/", get(handler))
}
