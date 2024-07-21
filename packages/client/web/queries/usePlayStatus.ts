import {
  GamePlayStatusUpdate,
  GetGamePlayStatusPayload,
} from "@/generated/retrom/client-utils";
import { Game } from "@/generated/retrom/models/games";
import { IS_DESKTOP } from "@/lib/env";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { UnlistenFn } from "@tauri-apps/api/event";
import { getCurrent } from "@tauri-apps/api/webviewWindow";
import { useEffect } from "react";

const queryKey = "play-status";

export function usePlayStatusQuery(game: Game) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!IS_DESKTOP) return;

    const window = getCurrent();
    const listeners: UnlistenFn[] = [];

    async function listen() {
      listeners.push(
        await window.listen(
          "game-running",
          (event: { payload: GamePlayStatusUpdate }) => {
            if (event.payload.gameId === game.id) {
              queryClient.invalidateQueries({
                queryKey: [queryKey, game.path],
              });
            }
          },
        ),
      );

      listeners.push(
        await window.listen(
          "game-stopped",
          (event: { payload: GamePlayStatusUpdate }) => {
            if (event.payload.gameId === game.id) {
              queryClient.invalidateQueries({
                queryKey: [queryKey, game.path],
              });
            }
          },
        ),
      );
    }

    listen();

    return () => {
      listeners.forEach((unlisten) => unlisten());
    };
  }, [game, queryClient]);

  const query = useQuery({
    queryFn: async () => {
      try {
        if (!IS_DESKTOP) return;

        const payload: GetGamePlayStatusPayload = {
          game,
        };

        return await invoke<GamePlayStatusUpdate>(
          "plugin:launcher|get_game_play_status",
          { payload },
        );
      } catch (error) {
        console.error(error);
      }
    },
    throwOnError: true,
    queryKey: [queryKey, game.path],
  });

  return query;
}
