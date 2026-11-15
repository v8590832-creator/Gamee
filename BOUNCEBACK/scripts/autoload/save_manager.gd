extends Node

## Persistent progression, leaderboard, cosmetics, and settings manager using Godot's user:// storage.

const SAVE_PATH := "user://save_data.json"
const BACKUP_PATH := "user://save_data_backup.json"
const SETTINGS_PATH := "user://settings.cfg"

signal save_changed
signal settings_changed

var data: Dictionary = {}
var settings: Dictionary = {}


func _ready() -> void:
	load_save()
	load_settings()


func default_save() -> Dictionary:
	return {
		"unlockedLevelIds": ["w1-l1"],
		"unlockAllShowcase": true,
		"lastPlayedLevelId": "w1-l1",
		"levelProgress": {},
		"coins": 50,
		"helmetsCollected": 0,
		"blueprintsCollected": 0,
		"signsCollected": 0,
		"unlockedCosmetics": ["ivory", "mojari", "wire_glasses", "amber_dust"],
		"loadout": {
			"kurta": "ivory",
			"footwear": "mojari",
			"headwear": "wire_glasses",
			"trail": "amber_dust"
		},
		"unlockedAchievements": [],
		"completedChallenges": [],
		"challengeProgress": {},
		"leaderboard": [],
		"totalBounces": 0,
		"totalDashes": 0,
		"totalSlides": 0,
		"totalDoubleJumps": 0,
		"totalRollerRides": 0,
		"bossesCleared": 0
	}


func default_settings() -> Dictionary:
	return {
		"graphicsQuality": "high",
		"effectsQuality": "high",
		"resolutionScale": 1.0,
		"fullscreen": false,
		"vsync": true,
		"shadowsEnabled": true,
		"masterVolume": 0.75,
		"musicVolume": 0.50,
		"sfxVolume": 0.85,
		"muted": false,
		"fahhEnabled": true,
		"mouseSensitivity": 1.0,
		"cameraSensitivity": 1.0,
		"cameraDistance": 8.5,
		"cameraSmoothing": 1.0,
		"invertY": false,
		"touchControlsMode": "auto",
		"bindings": {
			"move_forward": KEY_W,
			"move_backward": KEY_S,
			"move_left": KEY_A,
			"move_right": KEY_D,
			"jump": KEY_SPACE,
			"sprint": KEY_SHIFT,
			"slide": KEY_CTRL,
			"bounce": KEY_Q,
			"dash": KEY_V,
			"interact": KEY_E,
			"special": KEY_F,
			"pause": KEY_ESCAPE,
			"restart": KEY_R
		}
	}


func load_save() -> void:
	var base := default_save()
	var parsed: Dictionary = {}
	for path in [SAVE_PATH, BACKUP_PATH]:
		if FileAccess.file_exists(path):
			var txt := FileAccess.get_file_as_string(path)
			var res: Variant = JSON.parse_string(txt)
			if typeof(res) == TYPE_DICTIONARY:
				parsed = res
				break
	for k in parsed.keys():
		base[k] = parsed[k]
	if not (base["unlockedLevelIds"] is Array) or not base["unlockedLevelIds"].has("w1-l1"):
		base["unlockedLevelIds"] = ["w1-l1"]
	data = base


func persist_save() -> void:
	var json_str := JSON.stringify(data)
	for path in [SAVE_PATH, BACKUP_PATH]:
		var f := FileAccess.open(path, FileAccess.WRITE)
		if f:
			f.store_string(json_str)
			f.close()
	save_changed.emit()


func load_settings() -> void:
	var cfg_defaults := default_settings()
	var cfg := ConfigFile.new()
	if cfg.load(SETTINGS_PATH) == OK:
		for key in cfg_defaults.keys():
			if key == "bindings":
				var b: Dictionary = cfg_defaults["bindings"].duplicate()
				for act in b.keys():
					if cfg.has_section_key("bindings", act):
						b[act] = int(cfg.get_value("bindings", act, b[act]))
				cfg_defaults["bindings"] = b
			elif cfg.has_section_key("settings", key):
				cfg_defaults[key] = cfg.get_value("settings", key, cfg_defaults[key])
	settings = cfg_defaults
	apply_display_settings()
	apply_input_bindings()


func persist_settings() -> void:
	var cfg := ConfigFile.new()
	for key in settings.keys():
		if key == "bindings":
			var b: Dictionary = settings["bindings"]
			for act in b.keys():
				cfg.set_value("bindings", act, int(b[act]))
		else:
			cfg.set_value("settings", key, settings[key])
	cfg.save(SETTINGS_PATH)
	apply_display_settings()
	apply_input_bindings()
	settings_changed.emit()


func update_settings(patch: Dictionary) -> void:
	for k in patch.keys():
		settings[k] = patch[k]
	persist_settings()


func update_binding(action: String, keycode: int) -> void:
	if not settings.has("bindings"):
		settings["bindings"] = default_settings()["bindings"]
	settings["bindings"][action] = keycode
	persist_settings()


func reset_bindings() -> void:
	settings["bindings"] = default_settings()["bindings"]
	persist_settings()


func apply_display_settings() -> void:
	var vsync_mode := DisplayServer.VSYNC_ENABLED if bool(settings.get("vsync", true)) else DisplayServer.VSYNC_DISABLED
	DisplayServer.window_set_vsync_mode(vsync_mode)
	var win := get_window()
	if win:
		var scale := clampf(float(settings.get("resolutionScale", 1.0)), 0.5, 1.0)
		var q: String = str(settings.get("graphicsQuality", "high"))
		var q_mul := 0.75 if q == "low" else (0.9 if q == "medium" else 1.0)
		win.scaling_3d_scale = clampf(scale * q_mul, 0.5, 1.0)
		var want_fs := bool(settings.get("fullscreen", false))
		var cur_mode := DisplayServer.window_get_mode()
		if want_fs and cur_mode != DisplayServer.WINDOW_MODE_FULLSCREEN:
			DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
		elif not want_fs and cur_mode == DisplayServer.WINDOW_MODE_FULLSCREEN:
			DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)


func apply_input_bindings() -> void:
	var bindings: Dictionary = settings.get("bindings", default_settings()["bindings"])
	var secondary_keys: Dictionary = {
		"move_forward": KEY_UP,
		"move_backward": KEY_DOWN,
		"move_left": KEY_LEFT,
		"move_right": KEY_RIGHT,
		"slide": KEY_C,
		"pause": KEY_P,
		"sprint": KEY_NONE,
		"mute": KEY_M
	}
	for act in bindings.keys():
		_register_action_key(act, int(bindings[act]), int(secondary_keys.get(act, KEY_NONE)))
	_register_action_key("mute", KEY_M, KEY_NONE)


func _register_action_key(action: String, primary_key: int, alt_key: int) -> void:
	if not InputMap.has_action(action):
		InputMap.add_action(action)
	else:
		InputMap.action_erase_events(action)
	var ev1 := InputEventKey.new()
	ev1.physical_keycode = primary_key as Key
	InputMap.action_add_event(action, ev1)
	if alt_key != KEY_NONE:
		var ev2 := InputEventKey.new()
		ev2.physical_keycode = alt_key as Key
		InputMap.action_add_event(action, ev2)


func set_last_played_level(level_id: String) -> void:
	data["lastPlayedLevelId"] = level_id
	persist_save()


func get_best_score() -> int:
	var best := 0
	var prog: Dictionary = data.get("levelProgress", {})
	for entry in prog.values():
		if typeof(entry) == TYPE_DICTIONARY:
			best = maxi(best, int(entry.get("bestScore", 0)))
	return best


func get_total_stars() -> int:
	var total := 0
	var prog: Dictionary = data.get("levelProgress", {})
	for entry in prog.values():
		if typeof(entry) == TYPE_DICTIONARY:
			total += int(entry.get("stars", 0))
	return total


func is_level_unlocked(level_id: String) -> bool:
	if bool(data.get("unlockAllShowcase", false)):
		return true
	var unlocked: Array = data.get("unlockedLevelIds", ["w1-l1"])
	return unlocked.has(level_id)


func toggle_showcase_unlock_all() -> bool:
	data["unlockAllShowcase"] = not bool(data.get("unlockAllShowcase", false))
	persist_save()
	return bool(data["unlockAllShowcase"])


func is_cosmetic_unlocked(cosmetic_id: String) -> bool:
	var arr: Array = data.get("unlockedCosmetics", [])
	return arr.has(cosmetic_id)


func equip_cosmetic(category: String, cosmetic_id: String) -> bool:
	if not is_cosmetic_unlocked(cosmetic_id):
		return false
	if not data.has("loadout"):
		data["loadout"] = default_save()["loadout"]
	data["loadout"][category] = cosmetic_id
	persist_save()
	return true


func unlock_cosmetic(item: Dictionary) -> Dictionary:
	var item_id := str(item.get("id", ""))
	if is_cosmetic_unlocked(item_id):
		return {"ok": true, "reason": "Already unlocked."}
	var cost := int(item.get("costCoins", 0))
	var req_bp := int(item.get("requiresBlueprints", 0))
	if int(data.get("coins", 0)) < cost:
		return {"ok": false, "reason": "Need %d Road Coins." % cost}
	if int(data.get("blueprintsCollected", 0)) < req_bp:
		return {"ok": false, "reason": "Need %d Blueprints." % req_bp}
	data["coins"] = int(data.get("coins", 0)) - cost
	var arr: Array = data.get("unlockedCosmetics", [])
	arr.append(item_id)
	data["unlockedCosmetics"] = arr
	data["loadout"][str(item.get("category", "kurta"))] = item_id
	persist_save()
	return {"ok": true, "reason": "Unlocked and equipped!"}


func add_coins(amount: int) -> void:
	data["coins"] = int(data.get("coins", 0)) + maxi(0, amount)
	persist_save()


func increment_stat(key: String, delta := 1) -> int:
	var val := int(data.get(key, 0)) + delta
	data[key] = val
	persist_save()
	return val


func record_collectible_totals(coins_earned: int, helmets: int, blueprints: int, signs: int) -> void:
	data["coins"] = int(data.get("coins", 0)) + maxi(0, coins_earned)
	data["helmetsCollected"] = int(data.get("helmetsCollected", 0)) + maxi(0, helmets)
	data["blueprintsCollected"] = int(data.get("blueprintsCollected", 0)) + maxi(0, blueprints)
	data["signsCollected"] = int(data.get("signsCollected", 0)) + maxi(0, signs)
	persist_save()


func record_level_completion(params: Dictionary) -> Dictionary:
	var level_id := str(params.get("levelId", "w1-l1"))
	var level_name := str(params.get("levelName", ""))
	var score := int(params.get("score", 0))
	var stars := int(params.get("stars", 1))
	var elapsed := float(params.get("time", 0.0))
	var collected_ids: Array = params.get("collectedIds", [])
	var next_id: Variant = params.get("nextLevelId", null)

	var prog: Dictionary = data.get("levelProgress", {})
	var prev: Dictionary = prog.get(level_id, {})
	var prev_best := int(prev.get("bestScore", 0))
	var prev_time: Variant = prev.get("bestTime", null)
	var is_new_best := score > prev_best

	var merged_collected: Array = prev.get("collectedIds", []).duplicate()
	for cid in collected_ids:
		if not merged_collected.has(cid):
			merged_collected.append(cid)

	var new_best_time := elapsed
	if prev_time != null:
		new_best_time = minf(float(prev_time), elapsed)

	prog[level_id] = {
		"completed": true,
		"bestScore": maxi(prev_best, score),
		"bestTime": new_best_time,
		"stars": maxi(int(prev.get("stars", 0)), stars),
		"collectedIds": merged_collected
	}
	data["levelProgress"] = prog

	if next_id != null and str(next_id) != "":
		var unlocked: Array = data.get("unlockedLevelIds", ["w1-l1"])
		if not unlocked.has(str(next_id)):
			unlocked.append(str(next_id))
		data["unlockedLevelIds"] = unlocked
		data["lastPlayedLevelId"] = str(next_id)

	var lb: Array = data.get("leaderboard", [])
	lb.append({
		"levelId": level_id,
		"levelName": level_name,
		"score": score,
		"time": elapsed,
		"stars": stars,
		"dateIso": Time.get_datetime_string_from_system(true, true)
	})
	lb.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		return int(a.get("score", 0)) > int(b.get("score", 0))
	)
	if lb.size() > 25:
		lb = lb.slice(0, 25)
	data["leaderboard"] = lb
	persist_save()
	return {"isNewBest": is_new_best, "previousBest": prev_best}


func unlock_achievement(id: String, reward_coins: int) -> bool:
	var arr: Array = data.get("unlockedAchievements", [])
	if arr.has(id):
		return false
	arr.append(id)
	data["unlockedAchievements"] = arr
	data["coins"] = int(data.get("coins", 0)) + maxi(0, reward_coins)
	persist_save()
	return true


func increment_challenge(id: String, target: int, reward_coins: int, delta := 1) -> bool:
	var comp: Array = data.get("completedChallenges", [])
	if comp.has(id):
		return false
	var prog: Dictionary = data.get("challengeProgress", {})
	var cur := mini(target, int(prog.get(id, 0)) + delta)
	prog[id] = cur
	data["challengeProgress"] = prog
	if cur >= target:
		comp.append(id)
		data["completedChallenges"] = comp
		data["coins"] = int(data.get("coins", 0)) + maxi(0, reward_coins)
		persist_save()
		return true
	persist_save()
	return false


func set_challenge_progress_max(id: String, target: int, reward_coins: int, value: int) -> bool:
	var comp: Array = data.get("completedChallenges", [])
	if comp.has(id):
		return false
	var prog: Dictionary = data.get("challengeProgress", {})
	var prev := int(prog.get(id, 0))
	if value <= prev:
		return false
	var cur := mini(target, value)
	prog[id] = cur
	data["challengeProgress"] = prog
	if cur >= target:
		comp.append(id)
		data["completedChallenges"] = comp
		data["coins"] = int(data.get("coins", 0)) + maxi(0, reward_coins)
		persist_save()
		return true
	persist_save()
	return false


func reset_progress() -> void:
	data = default_save()
	persist_save()
