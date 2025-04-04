import { getCurrentSession } from "@/auth/auth"
import H1 from "@/components/H1"
import type { TagOption } from "@/components/MultiTagSelect"
import QBAnalysisPractice from "@/components/QBAnalysisPractice"
import { sql } from "@/db/db"
import type { PlayGrouping, PlayPlayGroupingType, PlayTag } from "@/types/gameTypes"
import type { PracticeBlock, PracticeOnGame, PracticePlay } from "@/types/practiceTypes"
import type { SeasonQB, SeasonRB } from "@/types/seasonType"
import { redirect } from "next/navigation"
import AddPracticeBlock from "./AddPracticeBlock/AddPracticeBlock"
import LogPracticePlay from "./LogPracticePlay"
import PracticePlaysTable from "./PracticePlaysTable"

export default async function Page({
  params,
}: {
  params: Promise<{ practiceId: string }>
}) {
  const practiceId = Number((await params).practiceId)
  if (!practiceId) redirect("/dashboard")

  const { user } = await getCurrentSession()

  const practiceInfoQuery = await sql`
    SELECT 
      p.id,
      p.date,
      p.game_id,
      g.id as game_id,
      g.season_id
    FROM 
      practice p
    JOIN
      game g ON p.game_id = g.id
    WHERE 
      p.id = ${practiceId}
  `

  if (!practiceInfoQuery || practiceInfoQuery.length === 0) {
    redirect("/dashboard")
  }

  const { season_id: seasonId, team_id: teamId, id, date, game_id: gameId } = practiceInfoQuery[0]

  // Check if the practice's season ID matches the user's current season ID
  if (seasonId !== (user?.current_season_id as number)) {
    redirect("/dashboard")
  }

  const [seasonQBsData, seasonRBsData, playGroupingsData, tagsData, practiceBlocksData, playsData, playTagsData] =
    await Promise.all([
      // Query 1: Get season QBs
      sql`
      SELECT 
        id, name, number, year, is_active, is_starter
      FROM 
        season_qb
      WHERE 
        season_id = ${seasonId}
        AND is_active = true
      ORDER BY
        is_starter DESC, name ASC
    `,

      // Query 2: Get season RBs
      sql`
      SELECT 
        id, name, number, year, is_active, is_starter
      FROM 
        season_rb
      WHERE 
        season_id = ${seasonId}
        AND is_active = true
      ORDER BY
        is_starter DESC, name ASC
    `,

      // Query 3: Get play groupings
      sql`
      SELECT 
        id, name, type, team_id
      FROM 
        play_grouping
      WHERE 
        team_id = ${user?.team_id as number}
      ORDER BY
        name ASC
    `,

      // Query 4: Get team tags
      sql`
      SELECT 
        id, name, team_id
      FROM 
        tag
      WHERE 
        team_id = ${user?.team_id as number}
      ORDER BY
        name ASC
    `,

      // Query 5: Get practice blocks
      sql`
      SELECT 
        id, name, practice_id
      FROM 
        practice_block
      WHERE 
        practice_id = ${practiceId}
      ORDER BY 
        id ASC
    `,

      // Query 6: Get practice plays with play grouping info, QB info, and RB info
      sql`
        SELECT 
          p.*,
          p.practice_block_id, -- Explicitly select practice_block_id
          pg.id AS pg_id,
          pg.name AS pg_name,
          pg.type AS pg_type,
          pg.team_id AS pg_team_id,
          
          -- Add QB data
          qb.id AS qb_id,
          qb.name AS qb_name,
          qb.number AS qb_number,
          
          -- Add RB data
          rb.id AS rb_id,
          rb.name AS rb_name,
          rb.number AS rb_number,
          
          -- Include practice block name for each play
          pb.name AS practice_block_name
          
        FROM 
          play p
        LEFT JOIN 
          play_grouping pg ON p.play_grouping_id = pg.id
        JOIN
          practice_block pb ON p.practice_block_id = pb.id
          
        -- Join with QB data
        LEFT JOIN
          season_qb qb ON p.qb_in_id = qb.id
          
        -- Join with RB data
        LEFT JOIN
          season_rb rb ON p.rb_carry_id = rb.id
          
        WHERE 
          pb.practice_id = ${practiceId}
        ORDER BY 
          pb.id ASC,
          p.film_number ASC
      `,

      // Query 7: Get practice play tags
      sql`
        SELECT 
          pt.play_id,
          pt.tag_id,
          t.name,
          t.team_id
        FROM 
          play_tag pt
        JOIN
          tag t ON pt.tag_id = t.id
        JOIN
          play p ON pt.play_id = p.id
        JOIN
          practice_block pb ON p.practice_block_id = pb.id
        WHERE 
          pb.practice_id = ${practiceId}
      `,
    ])

  const seasonQBs: SeasonQB[] = seasonQBsData.map((qb) => ({
    id: qb.id,
    name: qb.name,
    number: qb.number,
    year: qb.year,
    is_active: qb.is_active,
    is_starter: qb.is_starter,
    season_id: seasonId,
    team_qb_id: 0,
  }))

  const seasonRBs: SeasonRB[] = seasonRBsData.map((rb) => ({
    id: rb.id,
    name: rb.name,
    number: rb.number,
    year: rb.year,
    is_active: rb.is_active,
    is_starter: rb.is_starter,
    season_id: seasonId,
    team_rb_id: 0,
  }))

  const playGroupings: PlayGrouping[] = playGroupingsData.map((pg) => ({
    id: pg.id,
    name: pg.name,
    type: pg.type,
    team_id: pg.team_id,
  }))

  const tags: TagOption[] = tagsData.map((tag) => ({
    id: tag.id,
    name: tag.name,
    team_id: tag.team_id,
  }))

  const playTagsMap: Record<number, PlayTag[]> = {}

  playTagsData.forEach((tag) => {
    if (!playTagsMap[tag.play_id]) {
      playTagsMap[tag.play_id] = []
    }

    playTagsMap[tag.play_id].push({
      play_id: tag.play_id,
      tag_id: tag.tag_id,
      name: tag.name,
      team_id: tag.team_id,
    })
  })

  const practice: PracticeOnGame = {
    id,
    date: new Date(date),
    game_id: gameId,
  }

  const practiceBlocks: PracticeBlock[] = practiceBlocksData.map((block) => ({
    id: block.id,
    name: block.name,
    practice_id: practiceId,
    plays: [], // Initialize with empty array
  }))

  const blocksMap: Record<number, PracticeBlock & { plays: PracticePlay[] }> = {}

  practiceBlocks.forEach((block) => {
    blocksMap[block.id] = {
      ...block,
      plays: [],
    }
  })

  const uniquePlayCalls = new Set<string>()

  playsData.forEach((row) => {
    if (row.play_call) {
      uniquePlayCalls.add(row.play_call)
    }

    let playGroupingType: PlayPlayGroupingType | null = null
    if (row.pg_id) {
      playGroupingType = {
        id: row.pg_id,
        name: row.pg_name,
        type: row.pg_type,
        team_id: row.pg_team_id,
      }
    }

    const qbIn = row.qb_id
      ? {
        id: row.qb_id,
        name: row.qb_name || "",
        number: row.qb_number || 0,
      }
      : null

    const rbCarry = row.rb_id
      ? {
        id: row.rb_id,
        name: row.rb_name || "",
        number: row.rb_number || 0,
      }
      : null

    const playTags = playTagsMap[row.id] || []

    const play: PracticePlay = {
      id: row.id,
      practice_block_id: row.practice_block_id,
      film_number: row.film_number,
      qb_in_id: row.qb_in_id,
      rb_carry_id: row.rb_carry_id,
      play_grouping_id: row.play_grouping_id,
      play_grouping_type: playGroupingType,
      qb_in: qbIn,
      rb_carry: rbCarry,
      play_call: row.play_call,
      play_call_tags: row.play_call_tags,
      yards_gained: row.yards_gained,
      result: row.result,
      sack_on_qb: row.sack_on_qb,
      rpo_read_keys: row.rpo_read_keys,
      read_option_read_keys: row.read_option_read_keys,
      pocket_presence: row.pocket_presence,
      pass_read: row.pass_read,
      pass_ball_placement: row.pass_ball_placement,
      scramble_execution: row.scramble_execution,
      qb_run_execution: row.qb_run_execution,
      audible_opportunity_missed: row.audible_opportunity_missed,
      audible_called: row.audible_called,
      audible_success: row.audible_success,
      rb_vision: row.rb_vision,
      rb_run_execution: row.rb_run_execution,
      notes: row.notes,
      tags: playTags,
    }

    if (blocksMap[row.practice_block_id]) {
      blocksMap[row.practice_block_id].plays.push(play)
    }
  })

  const validTags = tags.filter((tag) => tag.id !== null)
  const allPracticePlays = Object.values(blocksMap).flatMap((block) => block.plays)

  // Get the game information if this practice is associated with a game
  let gameInfo = null
  if (gameId) {
    const gameQuery = await sql`
      SELECT 
        id, date, against
      FROM 
        game
      WHERE 
        id = ${gameId}
    `
    if (gameQuery && gameQuery.length > 0) {
      gameInfo = gameQuery[0]
    }
  }

  return (
    <>
      <H1
        text={
          gameInfo
            ? `${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Practice`
            : `${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Practice`
        }
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 items-end">
        {seasonQBs.map((qb) => {
          const qbPlays = allPracticePlays.filter((play) => play.qb_in_id === qb.id)

          if (qbPlays.length === 0) return null

          return <QBAnalysisPractice key={qb.id} qb={{ name: qb.name, number: qb.number }} plays={qbPlays} />
        })}
      </div>
      <div className="mt-6">
        <AddPracticeBlock practiceId={practice.id} />
      </div>
      <div className="mt-2">
        <LogPracticePlay
          seasonQBs={seasonQBs}
          seasonRBs={seasonRBs}
          playGroupings={playGroupings}
          practiceId={practiceId}
          practiceBlocks={practiceBlocks}
          tags={tags}
        />
      </div>
      <div className="mt-3">
        <PracticePlaysTable
          blocks={Object.values(blocksMap)}
          playGroupings={playGroupings}
          tags={validTags}
          playCalls={Array.from(uniquePlayCalls)}
          seasonQBs={seasonQBs}
          seasonRBs={seasonRBs}
          practiceId={practiceId}
        />
      </div>
    </>
  )
}

