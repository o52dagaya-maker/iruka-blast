# イルカのブラスト 〜通信工事するイルカ〜 (v1.1.1)
Toon Blast-style tap puzzle (own art/names; dolphin telecom theme). Tap a group of 2+ OR swipe to swap two neighbours.
Files: index.html, style.css, engine.js (pure game logic, Node-testable), levels.js (30 hand levels + deterministic generator -> 500),
art.js (procedural canvas sprites), game.js (UI/render/audio/map/boosters), sw.js (cache iruka-blast-v2), manifest.webmanifest, icons/, img/.

v1.1.1
- Swipe input rewritten: pointer events plus a raw touch-event fallback. A swipe is decided at 0.3 cell during the move, or on release for a fast flick; a smaller wobble counts as a tap. pointercancel and lostpointercapture are handled.
- Android wrapper: no restoreState, clearCache on start, nested scrolling, long-press and scrollbars off, wide viewport. JS hooks appPause/appResume.
- Version shown on the title screen and in the menu. Service worker cache iruka-blast-v3, updateViaCache:none, network-first.
- Map ☰ menu: 設定 (効果音 / BGM + volume / バイブ (web only) / 演出 / アニメ速度), 遊び方, アイテム, 記録, エリア一覧, 現在地へ, タイトルへ, version.
- Original old-jazz BGM (music.js, WebAudio): 港の散歩道 (map), ケーブル・ラグ (levels), 夜勤ストンプ (bosses), 休憩所のブギ (breathers). See music/README.md.
- Clear bonus fires 1–3 drills at once. Tapping anywhere or the スキップ button resolves the rest instantly with the same score.
- Lose screen title: 「工事延期…」.

v1.1
- 500 levels, 10 areas x 50. Kinds: breather (n%10==1,6), boss (n%10==0), big boss (n%50==0). Board shapes with holes.
- Obstacles introduced step by step: box (L3), drum, router (collect at bottom), lamp/信号灯 (L35, colour-matched), mud/泥 (L45),
  cable-tied block/結束バンド (L63), steel crate 3 layers (L83).
- Swipe-swap: costs 1 move, specials fire where they land, otherwise the bigger group blasts; useless swaps bounce back for free.
- Boosters (earned only, no purchases): in-game ハンマー(L8) ショベル(L14) まぜる(L18); pre-level ドリル(L11) 融着キット(L16) 光ボール(L22).
  3 of each on unlock, first boss clear +1, big boss +3, every 30★ chest +2. Saved in localStorage SV.inv.
- Virtualized map (25-level chunks rendered around the viewport) with area bands and 現在地へ button.
tools/: tune500.js (bot-based move tuning, writes TUNE into levels.js), verify500.js (fresh-seed win rates -> verify500.json),
sim.js, check.js, blast_ui.js / blast_v11.js / blast_v111.js / blast_play.js (Playwright tests; SAMPLE=1 for a sampled playthrough).
Android wrapper: /home/box/iruka-blast-android (jp.nonbiri.irukablast). Site copy: /workspace/iruka-blast-site.
Preview publish info (contains claim token, keep private): /home/box/iruka-blast-dist/publish-info.txt
