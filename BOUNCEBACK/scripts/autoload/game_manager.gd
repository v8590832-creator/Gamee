extends Node

## Central game coordinator: loads all 10 worlds & 50 stages from game_data.json,
## manages game states, scoring, stars, achievements, challenges, and fonts.

const DATA_PATH := "res://assets/data/game_data.json"

signal game_state_changed(state: String)
signal level_load_requested(level_id: String, start_playing: bool)
signal restart_requested
signal respawn_requested
signal level_completed(summary: Dictionary)
signal hud_updated(hud: Dictionary)
signal notice_triggered(text: String)
signal open_settings_requested
signal open_world_select_requested

var game_state := "title" # "title" | "playing" | "paused" | "gameover"

var worlds: Array = []
var worlds_by_id: Dictionary = {}
var levels: Array = []
var levels_by_id: Dictionary = {}
var cosmetics: Dictionary = {}
var achievements: Array = []
var challenges: Array = []

var font_display: FontFile
var font_display_semibold: FontFile
var font_sans: FontFile
var font_sans_semibold: FontFile
var font_sans_bold: FontFile
var font_mono: FontFile

var current_level_id := "w1-l1"


func _ready() -> void:
	_load_fonts()
	_load_game_data()
	current_level_id = str(SaveManager.data.get("lastPlayedLevelId", "w1-l1"))
	if not levels_by_id.has(current_level_id) and not levels.is_empty():
		current_level_id = str(levels[0].get("id", "w1-l1"))


func _load_fonts() -> void:
	font_display_semibold = load("res://assets/fonts/ChakraPetch-SemiBold.ttf")
	font_display = load("res://assets/fonts/ChakraPetch-Bold.ttf")
	font_sans = load("res://assets/fonts/PlusJakartaSans-Regular.ttf")
	font_sans_semibold = load("res://assets/fonts/PlusJakartaSans-SemiBold.ttf")
	font_sans_bold = load("res://assets/fonts/PlusJakartaSans-Bold.ttf")
	font_mono = load("res://assets/fonts/JetBrainsMono-Medium.ttf")


func _load_game_data() -> void:
	if not FileAccess.file_exists(DATA_PATH):
		push_error("Missing game_data.json at %s" % DATA_PATH)
		return
	var txt := FileAccess.get_file_as_string(DATA_PATH)
	var parsed: Variant = JSON.parse_string(txt)
	if typeof(parsed) != TYPE_DICTIONARY:
		push_error("Failed to parse game_data.json")
		return
	var root: Dictionary = parsed
	worlds = root.get("worlds", [])
	for w in worlds:
		if typeof(w) == TYPE_DICTIONARY:
			worlds_by_id[int(w.get("id", 1))] = w
	levels = root.get("levels", [])
	for l in levels:
		if typeof(l) == TYPE_DICTIONARY:
			levels_by_id[str(l.get("id", ""))] = l
	cosmetics = root.get("cosmetics", {})
	achievements = root.get("achievements", [])
	challenges = root.get("challenges", [])


func get_world_theme(world_id: int) -> Dictionary:
	return worlds_by_id.get(world_id, worlds[0] if not worlds.is_empty() else {})


func get_level_by_id(level_id: String) -> Dictionary:
	if levels_by_id.has(level_id):
		return levels_by_id[level_id]
	return levels[0] if not levels.is_empty() else {}


func get_levels_for_world(world_id: int) -> Array:
	var list: Array = []
	for l in levels:
		if int(l.get("worldId", 0)) == world_id:
			list.append(l)
	list.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		return int(a.get("levelNumber", 0)) < int(b.get("levelNumber", 0))
	)
	return list


func get_next_level_id(level_id: String) -> Variant:
	for i in range(levels.size()):
		if str(levels[i].get("id", "")) == level_id:
			if i + 1 < levels.size():
				return str(levels[i + 1].get("id", ""))
			return null
	return null


func get_cosmetic_by_id(category: String, item_id: String) -> Dictionary:
	var list: Array = cosmetics.get(category, [])
	for item in list:
		if str(item.get("id", "")) == item_id:
			return item
	return list[0] if not list.is_empty() else {}


func set_game_state(next_state: String) -> void:
	if game_state == next_state:
		return
	game_state = next_state
	if next_state == "playing":
		AudioManager.set_music_playing(true)
	else:
		AudioManager.silence_loops()
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	game_state_changed.emit(next_state)


func start_level(level_id: String) -> void:
	current_level_id = level_id
	SaveManager.set_last_played_level(level_id)
	level_load_requested.emit(level_id, true)


func preview_level(level_id: String) -> void:
	current_level_id = level_id
	level_load_requested.emit(level_id, false)


func restart_current_level() -> void:
	restart_requested.emit()


func respawn_at_checkpoint() -> void:
	respawn_requested.emit()


func compute_level_score(elapsed: float, par_time: float, found: int, total: int, falls: int, combo_bounces: int) -> int:
	var base := 1000
	var shard_bonus := found * 250
	var all_bonus := 500 if (total > 0 and found >= total) else 0
	var time_delta := maxf(0.0, par_time - elapsed)
	var speed_bonus := roundi(time_delta * 35.0)
	var fall_penalty := falls * 120
	var no_fall_bonus := 400 if falls == 0 else 0
	var bounce_bonus := mini(600, combo_bounces * 25)
	return maxi(100, base + shard_bonus + all_bonus + speed_bonus + no_fall_bonus + bounce_bonus - fall_penalty)


func compute_star_rating(elapsed: float, par_time: float, found: int, total: int, falls: int) -> int:
	var stars := 1
	var ratio := float(found) / float(total) if total > 0 else 1.0
	if elapsed <= par_time * 1.15 or ratio >= 0.6:
		stars = 2
	if elapsed <= par_time * 1.05 and falls <= 1 and ratio >= 0.75:
		stars = 3
	return stars


func evaluate_action(action: String) -> Dictionary:
	var result := {"achievement": null, "challenge": null}
	match action:
		"bounce":
			var tot := SaveManager.increment_stat("totalBounces", 1)
			if tot >= 20:
				result["achievement"] = _grant_achievement("super_bouncer")
		"vehicleBounce":
			result["achievement"] = _grant_achievement("traffic_acrobat")
		"rollerRide":
			SaveManager.increment_stat("totalRollerRides", 1)
			result["achievement"] = _grant_achievement("roller_rider")
			result["challenge"] = _bump_challenge("ch_roller_ride", 1)
		"doubleJump":
			result["challenge"] = _bump_challenge("ch_double_jump_5", 1)
		"slide":
			result["challenge"] = _bump_challenge("ch_slide_master", 1)
		"gravityZone":
			result["challenge"] = _bump_challenge("ch_gravity_zone", 1)
		"special":
			result["challenge"] = _bump_challenge("ch_special_surge", 1)
		"blueprint":
			result["challenge"] = _bump_challenge("ch_find_blueprint", 1)
			if int(SaveManager.data.get("blueprintsCollected", 0)) >= 3:
				result["achievement"] = _grant_achievement("blueprint_hunter")
		"helmet":
			result["challenge"] = _bump_challenge("ch_helmet_hunter", 1)
		"sign":
			result["challenge"] = _bump_challenge("ch_secret_sign", 1)
		"longJump":
			result["challenge"] = _bump_challenge("ch_long_jump", 1)
	return result


func finalize_level_complete(run_stats: Dictionary) -> void:
	var level_id := str(run_stats.get("levelId", current_level_id))
	var lvl := get_level_by_id(level_id)
	var world_id := int(lvl.get("worldId", 1))
	var theme := get_world_theme(world_id)
	var par_time := float(lvl.get("parTime", 30.0))
	var elapsed := float(run_stats.get("elapsedTime", 0.0))
	var found := int(run_stats.get("collectiblesFound", 0))
	var total := int(run_stats.get("collectiblesTotal", 0))
	var falls := int(run_stats.get("fallsCount", 0))
	var bounces := int(run_stats.get("comboBounces", 0))

	var score := compute_level_score(elapsed, par_time, found, total, falls, bounces)
	var stars := compute_star_rating(elapsed, par_time, found, total, falls)
	var stage_coins := 20 + stars * 10
	var total_coins := int(run_stats.get("coinsRun", 0)) + stage_coins

	SaveManager.record_collectible_totals(
		total_coins,
		int(run_stats.get("helmetsRun", 0)),
		int(run_stats.get("blueprintsRun", 0)),
		int(run_stats.get("signsRun", 0))
	)

	var next_id: Variant = get_next_level_id(level_id)
	var save_res := SaveManager.record_level_completion({
		"levelId": level_id,
		"levelName": str(lvl.get("name", "")),
		"score": score,
		"stars": stars,
		"time": elapsed,
		"collectedIds": run_stats.get("collectedIds", []),
		"nextLevelId": next_id
	})

	var new_ach: Array = []
	if level_id == "w1-l1":
		_append_if_valid(new_ach, _grant_achievement("first_road"))
	if elapsed <= par_time:
		_append_if_valid(new_ach, _grant_achievement("speedrunner"))
	if falls == 0 and int(run_stats.get("damageTakenRun", 0)) == 0:
		_append_if_valid(new_ach, _grant_achievement("no_fall_run"))
	if world_id == 8:
		_append_if_valid(new_ach, _grant_achievement("monsoon_survivor"))
	if level_id == "w10-l5":
		_append_if_valid(new_ach, _grant_achievement("ultimate_bounceback"))

	var prog: Dictionary = SaveManager.data.get("levelProgress", {})
	var w1_done := true
	for wid in ["w1-l1", "w1-l2", "w1-l3", "w1-l4", "w1-l5"]:
		if not bool(prog.get(wid, {}).get("completed", false)):
			w1_done = false
			break
	if w1_done:
		_append_if_valid(new_ach, _grant_achievement("world1_cleared"))
	if int(SaveManager.data.get("blueprintsCollected", 0)) >= 3:
		_append_if_valid(new_ach, _grant_achievement("blueprint_hunter"))

	var new_ch: Array = []
	if falls == 0:
		_append_if_valid(new_ch, _bump_challenge("ch_no_fall", 1))
	if total > 0 and found >= total:
		_append_if_valid(new_ch, _bump_challenge("ch_all_coins", 1))
	if elapsed <= par_time:
		_append_if_valid(new_ch, _bump_challenge("ch_under_par", 1))
	if int(run_stats.get("dashesUsedRun", 0)) == 0:
		_append_if_valid(new_ch, _bump_challenge("ch_no_dash", 1))
	if bounces >= 10:
		_append_if_valid(new_ch, _bump_challenge("ch_ten_bounces", 1))
	if bool(run_stats.get("hasTraffic", false)) and int(run_stats.get("trafficHitsRun", 0)) == 0:
		_append_if_valid(new_ch, _bump_challenge("ch_no_traffic_hit", 1))
	if stars == 3:
		_append_if_valid(new_ch, _bump_challenge("ch_perfect_score", 1))
	if world_id == 8:
		_append_if_valid(new_ch, _bump_challenge("ch_monsoon_clear", 1))
	if world_id == 6:
		_append_if_valid(new_ch, _bump_challenge("ch_tunnel_clear", 1))
	if bool(run_stats.get("hasBoss", false)):
		SaveManager.increment_stat("bossesCleared", 1)
		_append_if_valid(new_ch, _bump_challenge("ch_boss_conquer", 1))
	_append_if_valid(new_ch, _bump_challenge_max("ch_3_stars", SaveManager.get_total_stars()))

	set_game_state("gameover")
	level_completed.emit({
		"levelId": level_id,
		"levelName": str(lvl.get("name", "")),
		"worldName": str(theme.get("name", "")),
		"score": score,
		"bestScore": maxi(int(save_res.get("previousBest", 0)), score),
		"isNewBest": bool(save_res.get("isNewBest", false)),
		"stars": stars,
		"time": elapsed,
		"parTime": par_time,
		"coinsEarned": total_coins,
		"collectiblesFound": found,
		"collectiblesTotal": total,
		"fallsCount": falls,
		"nextLevelId": next_id,
		"newlyUnlockedAchievements": new_ach,
		"newlyCompletedChallenges": new_ch
	})


func _grant_achievement(id: String) -> Variant:
	for a in achievements:
		if str(a.get("id", "")) == id:
			if SaveManager.unlock_achievement(id, int(a.get("rewardCoins", 0))):
				return a
			return null
	return null


func _bump_challenge(id: String, delta: int) -> Variant:
	for c in challenges:
		if str(c.get("id", "")) == id:
			if SaveManager.increment_challenge(id, int(c.get("targetCount", 1)), int(c.get("rewardCoins", 0)), delta):
				return c
			return null
	return null


func _bump_challenge_max(id: String, val: int) -> Variant:
	for c in challenges:
		if str(c.get("id", "")) == id:
			if SaveManager.set_challenge_progress_max(id, int(c.get("targetCount", 1)), int(c.get("rewardCoins", 0)), val):
				return c
			return null
	return null


func _append_if_valid(arr: Array, item: Variant) -> void:
	if item != null:
		arr.append(item)


func style_panel(ctrl: Control, bg := Color(0.059, 0.075, 0.102, 0.94), border := Color(0.898, 0.604, 0.235, 0.35), radius := 10) -> void:
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.border_color = border
	sb.set_border_width_all(1)
	sb.set_corner_radius_all(radius)
	sb.set_content_margin_all(12)
	ctrl.add_theme_stylebox_override("panel", sb)


func style_button(btn: Button, accent := false, danger := false) -> void:
	var normal := StyleBoxFlat.new()
	var hover := StyleBoxFlat.new()
	var pressed := StyleBoxFlat.new()
	if accent:
		normal.bg_color = Color("#e59a3c")
		hover.bg_color = Color("#f0aa4d")
		pressed.bg_color = Color("#cc8329")
		btn.add_theme_color_override("font_color", Color("#11151d"))
		btn.add_theme_color_override("font_hover_color", Color("#11151d"))
		btn.add_theme_color_override("font_pressed_color", Color("#11151d"))
	elif danger:
		normal.bg_color = Color(0.55, 0.16, 0.16, 0.9)
		hover.bg_color = Color(0.68, 0.2, 0.2, 0.95)
		pressed.bg_color = Color(0.45, 0.12, 0.12, 0.95)
		btn.add_theme_color_override("font_color", Color("#f3efe6"))
	else:
		normal.bg_color = Color(0.09, 0.115, 0.155, 0.92)
		hover.bg_color = Color(0.14, 0.175, 0.23, 0.96)
		pressed.bg_color = Color(0.07, 0.09, 0.12, 0.96)
		normal.border_color = Color(1, 1, 1, 0.16)
		hover.border_color = Color(0.898, 0.604, 0.235, 0.65)
		pressed.border_color = Color(0.898, 0.604, 0.235, 0.85)
		normal.set_border_width_all(1)
		hover.set_border_width_all(1)
		pressed.set_border_width_all(1)
		btn.add_theme_color_override("font_color", Color("#f3efe6"))
		btn.add_theme_color_override("font_hover_color", Color("#ffffff"))

	for sb in [normal, hover, pressed]:
		sb.set_corner_radius_all(8)
		sb.set_content_margin_all(10)
	btn.add_theme_stylebox_override("normal", normal)
	btn.add_theme_stylebox_override("hover", hover)
	btn.add_theme_stylebox_override("pressed", pressed)
	if font_display_semibold:
		btn.add_theme_font_override("font", font_display_semibold)
