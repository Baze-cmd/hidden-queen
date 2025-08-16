import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { Player } from "@/types/Player";
import styles from "./QueueList.module.css";

export const QueueList = (props: { players: Player[] }) => {
  return (
    <div className={styles.cardContentSpace}>
      <div className={styles.buttonGrid}>
        <Button className={styles.createPrivateGameButton}>
          Create private game
        </Button>
        <Button className={styles.joinQueueButton}>
          <Play className={styles.playIcon} />
          Join queue
        </Button>
      </div>

      <div className={styles.playerListContainer}>
        {props.players.map((player) => (
          <div
            key={player.id}
            className={styles.playerItem}
          >
            <div>
              <div className={styles.playerName}>{player.name}</div>
              <div className={styles.playerRating}>
                Rating: {player.rating}
              </div>
            </div>
            <Button className={styles.joinGameButton}>
              Join game
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};