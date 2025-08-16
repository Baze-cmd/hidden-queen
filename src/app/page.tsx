"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Crown, Users } from "lucide-react"
import { QueueList } from "@/components/QueueList/QueueList"
import { Player } from "@/types/Player"
import { BoardComponent } from "@/components/BoardComponent/BoardComponent"
import { Board } from "@/types/Board"
import styles from './page.module.css'

export default function HiddenQueenPage() {
  const [queuedPlayers, setQueuedPlayers] = useState<Player[]>([
    { id: 1, name: "ChessMaster2024", rating: 1850 },
    { id: 2, name: "QueenHunter", rating: 1720 },
    { id: 3, name: "PawnPromoter", rating: 1950 },
    { id: 4, name: "KnightRider88", rating: 1680 },
    { id: 5, name: "RookiePlayer", rating: 1420 },
    { id: 6, name: "GrandmasterGarry", rating: 2800 },
    { id: 7, name: "CheckmateCharlie", rating: 1500 },
    { id: 8, name: "BishopBob", rating: 1600 },
    { id: 9, name: "EnPassantEric", rating: 2100 },
    { id: 10, name: "FischerFan", rating: 1990 },
  ]);

  const boardStates: Board[] = [
    {
      tiles: [
        "bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR",
        "bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP",
        "wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"
      ],
      width: 8,
      height: 8,
    },
    {
      tiles: [
        "bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR",
        "bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "wP", "wP", "wP", "wP", "wH", "wP", "wP", "wP",
        "wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"
      ],
      width: 8,
      height: 8,
    },
    {
      tiles: [
        "bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR",
        "bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "ci", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "ci", "  ", "  ", "  ", "  ",
        "wP", "wP", "wP", "wP", "wH", "wP", "wP", "wP",
        "wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"
      ],
      width: 8,
      height: 8,
    },
    {
      tiles: [
        "bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR",
        "bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "wP", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "wP", "wP", "wP", "  ", "wH", "wP", "wP", "wP",
        "wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"
      ],
      width: 8,
      height: 8,
    },
    {
      tiles: [
        "bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR",
        "bP", "bP", "bP", "bP", "  ", "bP", "bP", "bP",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "bP", "  ", "  ", "  ",
        "  ", "  ", "  ", "wP", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "wP", "wP", "wP", "  ", "wH", "wP", "wP", "wP",
        "wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"
      ],
      width: 8,
      height: 8,
    },
    {
      tiles: [
        "bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR",
        "bP", "bP", "bP", "bP", "  ", "bP", "bP", "bP",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "bP", "  ", "  ", "  ",
        "  ", "  ", "  ", "wP", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "  ", "ci", "  ", "ci",
        "wP", "wP", "wP", "  ", "wH", "wP", "wP", "wP",
        "wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"
      ],
      width: 8,
      height: 8,
    },
    {
      tiles: [
        "bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR",
        "bP", "bP", "bP", "bP", "  ", "bP", "bP", "bP",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "bP", "  ", "  ", "  ",
        "  ", "  ", "  ", "wP", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "  ", "wN", "  ", "  ",
        "wP", "wP", "wP", "  ", "wH", "wP", "wP", "wP",
        "wR", "wN", "wB", "wQ", "wK", "wB", "  ", "wR"
      ],
      width: 8,
      height: 8,
    },
    {
      tiles: [
        "bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR",
        "bP", "bP", "bP", "bP", "  ", "bP", "bP", "bP",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "bP", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "  ", "wN", "  ", "  ",
        "wP", "wP", "wP", "  ", "wH", "wP", "wP", "wP",
        "wR", "wN", "wB", "wQ", "wK", "wB", "  ", "wR"
      ],
      width: 8,
      height: 8,
    },
    {
      tiles: [
        "bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR",
        "bP", "bP", "bP", "bP", "ci", "bP", "bP", "bP",
        "ci", "  ", "  ", "  ", "ci", "  ", "  ", "  ",
        "  ", "ci", "  ", "  ", "ci", "  ", "  ", "  ",
        "  ", "  ", "ci", "bP", "ci", "  ", "  ", "  ",
        "  ", "  ", "  ", "ci", "ci", "wN", "  ", "  ",
        "wP", "wP", "wP", "  ", "wH", "wP", "wP", "wP",
        "wR", "wN", "wB", "wQ", "wK", "wB", "  ", "wR"
      ],
      width: 8,
      height: 8,
    },
    {
      tiles: [
        "bR", "bN", "bB", "bQ", "wH", "bB", "bN", "bR",
        "bP", "bP", "bP", "bP", "  ", "bP", "bP", "bP",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "bP", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "  ", "wN", "  ", "  ",
        "wP", "wP", "wP", "  ", "  ", "wP", "wP", "wP",
        "wR", "wN", "wB", "wQ", "wK", "wB", "  ", "wR"
      ],
      width: 8,
      height: 8,
    },
  ];


  const [currentBoardIndex, setCurrentStateIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStateIndex((prev) => (prev + 1) % boardStates.length)
    }, 1000)

    return () => clearInterval(timer)
  }, [boardStates.length])

  const currentBoard = boardStates[currentBoardIndex]

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerIcons}>
            <Crown className={styles.iconYellow} />
            <h1 className={styles.title}>Hidden Queen</h1>
            <Crown className={styles.iconYellow} />
          </div>
          <p className={styles.subtitle}>
            Choose a pawn to be your secret queen. Keep it hidden until the perfect moment to strike!
          </p>
        </div>

        <div className={styles.grid}>
          <div className={styles.col1}>
            <Card className={styles.cardDark}>
              <CardHeader>
                <CardTitle className={styles.cardTitle}>
                  <Users className={styles.iconSmall} />
                  Queued Players ({queuedPlayers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className={styles.cardContent}>
                <QueueList players={queuedPlayers} />
              </CardContent>
            </Card>
          </div>

          <div className={styles.col2}>
            <Card className={styles.cardDark}>
              <CardContent className={styles.cardContent}>
                <BoardComponent board={currentBoard} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
