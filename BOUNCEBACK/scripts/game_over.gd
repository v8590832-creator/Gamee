extends CanvasLayer

## Level Complete / Run Summary screen showing Stars, Score, Time vs Par,
## Coins, Collectibles, Newly Unlocked Achievements/Challenges, and Next Stage navigation.

var _stage_lbl: Label
var _stars_lbl: Label
var _score_lbl: Label
var _new_best_lbl: Label
var _details_lbl: Label
var _rewards_lbl: Label
var _next_btn: Button

var _next_level_id: Variant = null
var _cur_level_id := "w1-l1"


func _ready() -> void:
	layer = 20
	process_mode = Node.PROCESS_MODE_ALWAYS
	_build_ui()
	GameManager.game_state_changed.connect(_on_state_changed)
	GameManager.level_completed.connect(_on_level_completed)
	_on_state_changed(GameManager.game_state)


func _build_ui() -> void:
	var bg := ColorRect.new()
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	bg.color = Color(0.02, 0.03, 0.05, 0.78)
	add_child(bg)

	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(center)

	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(460, 0)
	GameManager.style_panel(panel, Color(0.055, 0.072, 0.105, 0.97), Color("#f5b832"), 14)
	center.add_child(panel)

	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 10)
	panel.add_child(v)

	var banner := Label.new()
	banner.text = "HIGHWAY STAGE CLEARED!"
	banner.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	banner.add_theme_font_size_override("font_size", 26)
	banner.add_theme_color_override("font_color", Color("#f8f5ee"))
	if GameManager.font_display:
		banner.add_theme_font_override("font", GameManager.font_display)
	v.add_child(banner)

	_stage_lbl = Label.new()
	_stage_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_stage_lbl.add_theme_color_override("font_color", Color("#cbd5e1"))
	v.add_child(_stage_lbl)

	_stars_lbl = Label.new()
	_stars_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_stars_lbl.add_theme_font_size_override("font_size", 36)
	_stars_lbl.add_theme_color_override("font_color", Color("#f5b832"))
	v.add_child(_stars_lbl)

	_score_lbl = Label.new()
	_score_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_score_lbl.add_theme_font_size_override("font_size", 28)
	_score_lbl.add_theme_color_override("font_color", Color("#ffffff"))
	if GameManager.font_mono:
		_score_lbl.add_theme_font_override("font", GameManager.font_mono)
	v.add_child(_score_lbl)

	_new_best_lbl = Label.new()
	_new_best_lbl.text = "NEW PERSONAL BEST!"
	_new_best_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_new_best_lbl.add_theme_color_override("font_color", Color("#4ade80"))
	_new_best_lbl.visible = false
	v.add_child(_new_best_lbl)

	v.add_child(HSeparator.new())

	_details_lbl = Label.new()
	_details_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_details_lbl.add_theme_color_override("font_color", Color("#e2e8f0"))
	if GameManager.font_mono:
		_details_lbl.add_theme_font_override("font", GameManager.font_mono)
	v.add_child(_details_lbl)

	_rewards_lbl = Label.new()
	_rewards_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_rewards_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_rewards_lbl.add_theme_color_override("font_color", Color("#fef08a"))
	_rewards_lbl.visible = false
	v.add_child(_rewards_lbl)

	v.add_child(HSeparator.new())

	_next_btn = Button.new()
	_next_btn.text = "NEXT STAGE"
	_next_btn.custom_minimum_size = Vector2(0, 44)
	GameManager.style_button(_next_btn, true)
	_next_btn.pressed.connect(func() -> void:
		AudioManager.play_ui_click()
		if _next_level_id != null and str(_next_level_id) != "":
			GameManager.start_level(str(_next_level_id))
	)
	v.add_child(_next_btn)

	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)
	v.add_child(row)

	var replay_btn := Button.new()
	replay_btn.text = "REPLAY"
	replay_btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	replay_btn.custom_minimum_size = Vector2(0, 38)
	GameManager.style_button(replay_btn, false)
	replay_btn.pressed.connect(func() -> void:
		AudioManager.play_ui_click()
		GameManager.start_level(_cur_level_id)
	)
	row.add_child(replay_btn)

	var worlds_btn := Button.new()
	worlds_btn.text = "WORLDS"
	worlds_btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	worlds_btn.custom_minimum_size = Vector2(0, 38)
	GameManager.style_button(worlds_btn, false)
	worlds_btn.pressed.connect(func() -> void:
		AudioManager.play_ui_click()
		GameManager.open_world_select_requested.emit()
	)
	row.add_child(worlds_btn)

	var menu_btn := Button.new()
	menu_btn.text = "MAIN MENU"
	menu_btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	menu_btn.custom_minimum_size = Vector2(0, 38)
	GameManager.style_button(menu_btn, false)
	menu_btn.pressed.connect(func() -> void:
		AudioManager.play_ui_click()
		GameManager.set_game_state("title")
	)
	row.add_child(menu_btn)


func _on_state_changed(state: String) -> void:
	visible = (state == "gameover")


func _on_level_completed(summary: Dictionary) -> void:
	_cur_level_id = str(summary.get("levelId", "w1-l1"))
	_next_level_id = summary.get("nextLevelId", null)
	_stage_lbl.text = "%s  ·  %s" % [str(summary.get("worldName", "")), str(summary.get("levelName", ""))]

	var stars := int(summary.get("stars", 1))
	_stars_lbl.text = ("★ ".repeat(stars)) + ("☆ ".repeat(3 - stars))
	_score_lbl.text = "SCORE: %d" % int(summary.get("score", 0))
	_new_best_lbl.visible = bool(summary.get("isNewBest", false))

	_details_lbl.text = "Time: %.2fs (Par %.0fs)  ·  Best: %d\nCoins Earned: +%d  ·  Items: %d/%d  ·  Falls: %d" % [
		float(summary.get("time", 0.0)),
		float(summary.get("parTime", 30.0)),
		int(summary.get("bestScore", 0)),
		int(summary.get("coinsEarned", 0)),
		int(summary.get("collectiblesFound", 0)),
		int(summary.get("collectiblesTotal", 0)),
		int(summary.get("fallsCount", 0))
	]

	var notes: Array[String] = []
	for a in summary.get("newlyUnlockedAchievements", []):
		notes.append("Achievement Unlocked: %s" % str(a.get("name", "")))
	for c in summary.get("newlyCompletedChallenges", []):
		notes.append("Challenge Completed: %s" % str(c.get("title", "")))
	if not notes.is_empty():
		_rewards_lbl.visible = true
		_rewards_lbl.text = "\n".join(notes)
	else:
		_rewards_lbl.visible = false

	_next_btn.visible = (_next_level_id != null and str(_next_level_id) != "")
