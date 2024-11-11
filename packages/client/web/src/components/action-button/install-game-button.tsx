import { useInstallationQuery } from "@/queries/useInstallationQuery";
import { Button } from "../ui/button";
import {
  CircleAlertIcon,
  DownloadCloudIcon,
  LoaderCircleIcon,
} from "lucide-react";
import { useInstallGame } from "@/mutations/useInstallGame";
import { InstallationStatus } from "@/generated/retrom/client/client-utils";
import { Progress } from "../ui/progress";
import { ComponentProps, ForwardedRef, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { useGameDetail } from "@/providers/game-details";
import { FocusableElement } from "../fullscreen/focus-container";

export const InstallGameButton = forwardRef(
  (
    props: ComponentProps<typeof Button>,
    forwardedRef: ForwardedRef<HTMLButtonElement>,
  ) => {
    const { game, gameFiles: files } = useGameDetail();
    const { className, ...rest } = props;

    const installationQuery = useInstallationQuery(game);
    const installationRequest = useInstallGame(game, files);

    const installState = installationQuery.data;
    const installProgress = installationRequest.progress;
    const install = installationRequest.mutate;

    const error =
      installationQuery.status === "error" ||
      installationRequest.status === "error";

    const pending =
      installationQuery.status === "pending" ||
      installationRequest.status === "pending";

    const disabled = error || pending;

    const Content = () => {
      if (error) {
        return (
          <>
            <CircleAlertIcon />
            Error
          </>
        );
      }

      if (pending) {
        return (
          <>
            <LoaderCircleIcon className="animate-spin" />
          </>
        );
      }

      if (installState === InstallationStatus.INSTALLING) {
        return (
          <div className="absolute inset-0 grid place-items-center px-2">
            <Progress value={installProgress} className="h-2" />
          </div>
        );
      }

      return (
        <>
          <DownloadCloudIcon className="h-[1.2rem] 1-[1.2rem]" />
          Install
        </>
      );
    };

    return (
      <FocusableElement
        ref={forwardedRef}
        initialFocus
        opts={{ focusKey: "install-game-button" }}
      >
        <Button
          {...rest}
          disabled={disabled || rest.disabled}
          className={cn(className, "relative")}
          onClick={async () => void install(undefined)}
        >
          <Content />
        </Button>
      </FocusableElement>
    );
  },
);
