extends Node3D

## Main 3D orchestrator connecting Sky/Lights, Road, Obstacles, Collectibles, PowerUps, Scenery,
## PlayerController3D, Camera3D, HUD, Pause, Victory, and Main Menu.

@onready var world_env: WorldEnvironment = $WorldEnvironment
@onready var key_light: DirectionalLight3D = $KeyLight
@onready var rim_light: DirectionalLight3D = $RimLight
@onready var camera: Camera3D = $Camera3D
@onready var player: PlayerController3D = $Player
@onready var road_sys: RoadSystem = $WorldRoot/RoadSystem
@onready var obstacle_sys: ObstacleSystem = $WorldRoot/ObstacleSystem
@onready var collectible_sys: CollectibleSystem = $WorldRoot/CollectibleSystem
@onready var powerup_sys: PowerUpSystem = $WorldRoot/PowerUpSystem
@onready var scenery_sys: SceneryBuilder = $WorldRoot/SceneryBuilder
@onready var particles_burst: CPUParticles3D = $WorldRoot/BurstParticles

var _current_level: Dictionary = {}
var _current_theme: Dictionary = {}

var _real_time := 0.0
var _world_time := 0.0
var _elapsed_run := 0.0
var _hud_accum := 0.0
var _hitstop_timer := 0.0
var _thunder_timer := 7.0

# Run stats
var _falls_count := 0
var _damage_taken := 0
var _dashes_used := 0
var _traffic_hits := 0
var _coins_run := 0
var _helmets_run := 0
var _blueprints_run := 0
var _signs_run := 0
var _roller_triggered := false
var _gravity_triggered := false

# Camera state
var _cam_yaw := 0.0
var _cam_pitch := 0.28
var _air_pitch := 0.0
var _cam_dist := 8.5
var _cam_pos := Vector3(0.0, 5.0, 9.0)
var _cam_look := Vector3(0.0, 1.5, -4.0)
var _cam_trauma := 0.0
var _cam_bank := 0.0
var _dragging_cam := false

# HUD transient notices
var _notice_text: Variant = null
var _notice_timer := 0.0
var _interact_prompt: Variant = null

# Touch input bridge from GameHud
var touch_move := Vector2.ZERO
var touch_actions := {
	"jump": false,
	"sprint": false,
	"slide": false,
	"bounce": false,
	"dash": false,
	"special": false,
	"interact": false
}
var _prev_touch_pressed := {
	"jump": false,
	"slide": false,
	"bounce": false,
	"dash": false,
	"special": false,
	"interact": false
}


func _ready() -> void:
	randomize()
	GameManager.level_load_requested.connect(_on_level_load_requested)
	GameManager.restart_requested.connect(func() -> void:
		load_level(str(_current_level.get("id", "w1-l1")), true)
	)
	GameManager.respawn_requested.connect(_respawn_at_checkpoint)
	SaveManager.settings_changed.connect(_apply_settings)

	_apply_settings()
	load_level(GameManager.current_level_id, false)


func _apply_settings() -> void:
	var s := SaveManager.settings
	_cam_dist = float(s.get("cameraDistance", 8.5))
	key_light.shadow_enabled = bool(s.get("shadowsEnabled", true)) and str(s.get("graphicsQuality", "high")) != "low"


func _on_level_load_requested(level_id: String, start_playing: bool) -> void:
	load_level(level_id, start_playing)


func load_level(level_id: String, start_playing: bool) -> void:
	_current_level = GameManager.get_level_by_id(level_id)
	var world_id := int(_current_level.get("worldId", 1))
	_current_theme = GameManager.get_world_theme(world_id)

	_configure_environment(_current_theme)
	road_sys.build_platforms(_current_level, _current_theme)
	obstacle_sys.build_obstacles(_current_level)
	collectible_sys.build_collectibles(_current_level)
	powerup_sys.build_level_features(_current_level, _current_theme)
	scenery_sys.build_scenery(_current_level, _current_theme)

	AudioManager.set_world_profile(float(_current_theme.get("ambientBaseHz", 55.0)))
	_reset_run_state()

	if start_playing:
		GameManager.set_game_state("playing")
	else:
		_emit_hud()


func _configure_environment(theme: Dictionary) -> void:
	var sky_mat := ProceduralSkyMaterial.new()
	sky_mat.sky_top_color = Color.html(str(theme.get("skyTop", "#2d6ea3")))
	sky_mat.sky_horizon_color = Color.html(str(theme.get("skyHorizon", "#e8c49a")))
	sky_mat.ground_horizon_color = Color.html(str(theme.get("fogColor", "#d9bfa1")))
	sky_mat.ground_bottom_color = Color.html(str(theme.get("hemiGroundColor", "#5c4b3b")))
	var sky := Sky.new()
	sky.sky_material = sky_mat

	var env := Environment.new()
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_color = Color.html(str(theme.get("hemiSkyColor", "#90c2eb")))
	env.ambient_light_energy = float(theme.get("hemiIntensity", 1.15)) * 0.72
	env.fog_enabled = true
	env.fog_light_color = Color.html(str(theme.get("fogColor", "#d9bfa1")))
	env.fog_density = float(theme.get("fogDensity", 0.0055)) * 0.8
	env.tonemap_mode = Environment.TONE_MAPPER_ACES
	world_env.environment = env

	key_light.light_color = Color.html(str(theme.get("keyLightColor", "#fff0d1")))
	key_light.light_energy = float(theme.get("keyLightIntensity", 2.5)) * 0.65


func _reset_run_state() -> void:
	var sp: Dictionary = _current_level.get("spawn", {})
	var spawn := Vector3(float(sp.get("x", 0.0)), float(sp.get("y", 1.0)), float(sp.get("z", 0.0)))
	var yaw := float(_current_level.get("spawnYaw", 0.0))

	road_sys.reset_platforms()
	collectible_sys.reset_collectibles()
	powerup_sys.reset_state(_current_level)
	player.reset_player(spawn, yaw, road_sys.platforms)

	_elapsed_run = 0.0
	_world_time = 0.0
	_falls_count = 0
	_damage_taken = 0
	_dashes_used = 0
	_traffic_hits = 0
	_coins_run = 0
	_helmets_run = 0
	_blueprints_run = 0
	_signs_run = 0
	_roller_triggered = false
	_gravity_triggered = false
	_hitstop_timer = 0.0
	_cam_trauma = 0.0
	_notice_text = null
	_notice_timer = 0.0
	_interact_prompt = null

	_cam_yaw = yaw
	_cam_pitch = 0.28
	_air_pitch = 0.0
	_cam_pos = Vector3(spawn.x + sin(_cam_yaw) * _cam_dist, spawn.y + 3.6, spawn.z + cos(_cam_yaw) * _cam_dist)
	_cam_look = Vector3(spawn.x, spawn.y + 1.1, spawn.z - 5.0)
	camera.position = _cam_pos
	camera.look_at(_cam_look, Vector3.UP)


func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if Input.is_action_just_pressed("mute"):
			AudioManager.set_muted(not AudioManager.is_muted())
		if Input.is_action_just_pressed("pause"):
			if GameManager.game_state == "playing":
				GameManager.set_game_state("paused")
			elif GameManager.game_state == "paused":
				GameManager.set_game_state("playing")
		if Input.is_action_just_pressed("respawn") and GameManager.game_state == "playing":
			_respawn_at_checkpoint()

	if GameManager.game_state != "playing":
		return

	if event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_LEFT:
			_dragging_cam = mb.pressed
		elif mb.button_index == MOUSE_BUTTON_WHEEL_UP and mb.pressed:
			_cam_dist = clampf(_cam_dist - 0.55, 5.5, 15.0)
		elif mb.button_index == MOUSE_BUTTON_WHEEL_DOWN and mb.pressed:
			_cam_dist = clampf(_cam_dist + 0.55, 5.5, 15.0)
	elif event is InputEventMouseMotion and _dragging_cam:
		var mm := event as InputEventMouseMotion
		var s := SaveManager.settings
		var sens := 0.0028 * float(s.get("mouseSensitivity", 1.0)) * float(s.get("cameraSensitivity", 1.0))
		var y_sign := -1.0 if bool(s.get("invertY", false)) else 1.0
		_cam_yaw -= mm.relative.x * sens
		_cam_pitch = clampf(_cam_pitch + mm.relative.y * sens * y_sign, -0.25, 1.1)


func _physics_process(dt: float) -> void:
	var clamp_dt := minf(dt, 0.05)
	_real_time += clamp_dt

	if GameManager.game_state == "title":
		_update_title_flyover(clamp_dt)
	elif GameManager.game_state == "playing":
		_update_playing(clamp_dt)


func _update_title_flyover(dt: float) -> void:
	_world_time += dt
	road_sys.update_animations(_world_time, _real_time, dt)
	obstacle_sys.update_obstacles(dt)
	collectible_sys.update_animations(_real_time)
	powerup_sys.update_animations(_real_time)

	var sp: Dictionary = _current_level.get("spawn", {})
	var spawn := Vector3(float(sp.get("x", 0.0)), float(sp.get("y", 1.0)), float(sp.get("z", 0.0)))
	player.update_title_showcase(dt, spawn)
	scenery_sys.update_scenery(spawn)

	var sway := sin(_real_time * 0.25) * 1.4
	camera.position = Vector3(-1.5 + sway, 3.2, 4.8)
	camera.look_at(Vector3(0.2, 1.8, -14.0), Vector3.UP)


func _update_playing(dt: float) -> void:
	if _hitstop_timer > 0.0:
		_hitstop_timer = maxf(0.0, _hitstop_timer - dt)
		_update_camera(dt, false)
		return

	var inp := _sample_player_input()
	var special_active := player.special_active_timer > 0.0
	var world_dt := dt * (0.55 if special_active else 1.0)
	_world_time += world_dt
	_elapsed_run += dt

	if float(_current_theme.get("rainIntensity", 0.0)) > 0.5:
		_thunder_timer -= dt
		if _thunder_timer <= 0.0:
			_thunder_timer = randf_range(9.0, 17.0)
			AudioManager.play_thunder()

	road_sys.update_animations(_world_time, _real_time, world_dt)
	obstacle_sys.update_obstacles(world_dt)
	collectible_sys.update_animations(_real_time)
	powerup_sys.update_animations(_real_time)

	var res := player.step_simulation(dt, world_dt, inp, _cam_yaw, bool(_current_level.get("allowDash", true)), road_sys)
	scenery_sys.update_scenery(player.pos)

	if player.in_gravity_zone and not _gravity_triggered:
		_gravity_triggered = true
		var gr := GameManager.evaluate_action("gravityZone")
		if gr["challenge"] != null:
			_show_notice("Challenge · %s" % str(gr["challenge"].get("title", "")))

	if bool(res["jumped"]):
		AudioManager.play_jump(false)
		player.trigger_oneshot("jump", 0.25)
	if bool(res["doubleJumped"]):
		AudioManager.play_jump(true)
		player.trigger_oneshot("doubleJump", 0.42)
		SaveManager.increment_stat("totalDoubleJumps", 1)
		var dj := GameManager.evaluate_action("doubleJump")
		if dj["challenge"] != null:
			_show_notice("Challenge · %s" % str(dj["challenge"].get("title", "")))
	if bool(res["superBounced"]):
		AudioManager.play_bounce(1.2)
		player.trigger_oneshot("bounce", 0.42)
		player.trigger_shockwave("#f28c28", 2.3)
		var sb := GameManager.evaluate_action("bounce")
		if sb["achievement"] != null:
			_show_notice("Achievement · %s" % str(sb["achievement"].get("name", "")))
	if bool(res["slid"]):
		AudioManager.play_slide()
		SaveManager.increment_stat("totalSlides", 1)
		var sl := GameManager.evaluate_action("slide")
		if sl["challenge"] != null:
			_show_notice("Challenge · %s" % str(sl["challenge"].get("title", "")))
	if bool(res["dashed"]):
		_dashes_used += 1
		SaveManager.increment_stat("totalDashes", 1)
		AudioManager.play_dash()
		player.trigger_oneshot("dash", 0.28)
		_cam_trauma = minf(1.0, _cam_trauma + 0.3)
	if bool(res["specialActivated"]):
		AudioManager.play_special()
		player.trigger_oneshot("special", 0.45)
		var sp_r := GameManager.evaluate_action("special")
		if sp_r["challenge"] != null:
			_show_notice("Challenge · %s" % str(sp_r["challenge"].get("title", "")))

	if bool(res["ridingRoller"]) and not _roller_triggered:
		_roller_triggered = true
		var rr := GameManager.evaluate_action("rollerRide")
		if rr["achievement"] != null:
			_show_notice("Achievement · %s" % str(rr["achievement"].get("name", "")))

	var impact := float(res["landedImpact"])
	if impact > 5.0:
		player.trigger_land_squash(impact)
		player.trigger_oneshot("land", 0.16)
		player.trigger_shockwave("#e59a3c", 1.4)
		if impact > 16.5:
			_cam_trauma = minf(1.0, _cam_trauma + 0.28)
			AudioManager.play_fahh("hardLand", 0.035)

	for pb in res["padBounces"]:
		AudioManager.play_bounce(float(pb["impact"]) / 14.0)
		_hitstop_timer = 0.03
		_cam_trauma = minf(1.0, _cam_trauma + 0.4)
		player.trigger_oneshot("bounce", 0.4)
		player.trigger_shockwave("#e59a3c", 2.5)
		_spawn_burst(pb["pos"], Color("#e59a3c"))
		var ab := GameManager.evaluate_action("bounce")
		if ab["achievement"] != null:
			_show_notice("Achievement · %s" % str(ab["achievement"].get("name", "")))
		var lj := GameManager.evaluate_action("longJump")
		if lj["challenge"] != null:
			_show_notice("Challenge · %s" % str(lj["challenge"].get("title", "")))

	# Traffic Collisions
	for tv in obstacle_sys.traffic_list:
		var t_pos: Vector3 = tv["pos"]
		if Vector2(player.pos.x - t_pos.x, player.pos.z - t_pos.z).length() < 6.0 and float(tv["honkedCooldown"]) <= 0.0:
			tv["honkedCooldown"] = 3.5
			AudioManager.play_horn()
		var hit := ObstacleSystem.intersect_vehicle(player.pos, PlayerController3D.RADIUS, t_pos, tv["size"])
		if bool(hit["hit"]):
			player.pos += hit["pushOut"]
			if bool(hit["isTopLanding"]) and bool(tv["bounceTop"]):
				player.vel.y = 20.5
				player.double_jump_available = true
				AudioManager.play_bounce(1.3)
				player.trigger_oneshot("bounce", 0.4)
				player.trigger_shockwave("#f5b832", 2.4)
				var va := GameManager.evaluate_action("vehicleBounce")
				if va["achievement"] != null:
					_show_notice("Achievement · %s" % str(va["achievement"].get("name", "")))
			elif player.invuln_timer <= 0.0:
				var l_dir := int(tv["lane"].get("direction", 1))
				_apply_damage(Vector3(float(l_dir) * 6.5, 6.5, 6.0), "trafficHit")
				_traffic_hits += 1

	# Boss Collision
	if not obstacle_sys.boss_data.is_empty():
		var b_hit := ObstacleSystem.intersect_vehicle(player.pos, PlayerController3D.RADIUS, obstacle_sys.boss_data["pos"], obstacle_sys.boss_data["size"])
		if bool(b_hit["hit"]):
			player.pos += b_hit["pushOut"]
			if bool(b_hit["isTopLanding"]):
				player.vel.y = 22.0
				player.double_jump_available = true
				AudioManager.play_bounce(1.4)
				player.trigger_shockwave("#ef4444", 2.8)
			elif player.invuln_timer <= 0.0:
				_apply_damage(Vector3(0.0, 7.0, 9.0), "bossHit")

	# Portals
	var pt_res := powerup_sys.check_portals(dt, player.pos, player.vel)
	if bool(pt_res["teleported"]):
		player.pos = pt_res["pos"]
		player.vel = pt_res["vel"]
		AudioManager.play_portal()
		_cam_trauma = minf(1.0, _cam_trauma + 0.35)

	# Switches [E]
	var sw_res := powerup_sys.check_switches(player.pos, bool(inp.get("interactPressed", false)))
	_interact_prompt = sw_res["prompt"]
	if str(sw_res["activatedId"]) != "":
		AudioManager.play_switch()
		road_sys.activate_bridges_for_switch(str(sw_res["activatedId"]))

	# Checkpoints
	var cp_lbl: Variant = powerup_sys.check_checkpoints(player.pos, player.player_gravity_inverted, str(_current_theme.get("accentColor", "#e59a3c")))
	if cp_lbl != null:
		AudioManager.play_checkpoint()
		player.health = mini(player.max_health, player.health + 1)
		_show_notice("Checkpoint · %s" % str(cp_lbl))

	# Collectibles
	var picked: Variant = collectible_sys.check_pickups(player.pos)
	if picked != null:
		var def: Dictionary = picked["def"]
		var kind := str(picked["kind"])
		var is_rare := kind != "coin"
		AudioManager.play_collectible(collectible_sys.collected_ids.size() - 1, is_rare)
		player.trigger_oneshot("pickup", 0.25)
		_spawn_burst(picked["basePos"], Color("#38bdf8") if is_rare else Color("#f5b832"))
		match kind:
			"helmet":
				_helmets_run += 1
				_coins_run += int(def.get("value", 50))
				var hc := GameManager.evaluate_action("helmet")
				if hc["challenge"] != null: _show_notice("Challenge · %s" % str(hc["challenge"].get("title", "")))
			"blueprint":
				_blueprints_run += 1
				_coins_run += int(def.get("value", 75))
				GameManager.evaluate_action("blueprint")
				_show_notice("Blueprint Recovered!")
			"energy":
				player.special_energy = 1.0
				player.health = mini(player.max_health, player.health + 1)
				_coins_run += int(def.get("value", 25))
			"sign":
				_signs_run += 1
				_coins_run += int(def.get("value", 100))
				GameManager.evaluate_action("sign")
				_show_notice("Secret Road Sign Found!")
			_:
				_coins_run += int(def.get("value", 10))

	# Fall / Time Challenge Check
	var fall_lim := float(_current_level.get("fallLimitY", -14.0))
	var ceil_lim := float(_current_level.get("ceilingLimitY", 45.0))
	if player.pos.y < fall_lim or player.pos.y > ceil_lim:
		_falls_count += 1
		AudioManager.play_fall()
		AudioManager.play_fahh("fall", 0.045)
		_respawn_at_checkpoint()

	var tc_sec: Variant = _current_level.get("timeChallengeSec", null)
	if tc_sec != null and _elapsed_run > float(tc_sec):
		_falls_count += 1
		AudioManager.play_fall()
		AudioManager.play_fahh("timeout", 0.045)
		load_level(str(_current_level.get("id", "w1-l1")), true)
		return

	# Finish Gate
	if powerup_sys.is_at_finish(player.pos):
		AudioManager.silence_loops()
		AudioManager.play_victory()
		player.trigger_oneshot("levelComplete", 1.5)
		_spawn_burst(powerup_sys.finish_pos + Vector3(0.0, 1.5, 0.0), Color("#f5b832"))
		GameManager.finalize_level_complete({
			"levelId": str(_current_level.get("id", "")),
			"elapsedTime": _elapsed_run,
			"collectiblesFound": collectible_sys.collected_ids.size(),
			"collectiblesTotal": collectible_sys.items.size(),
			"fallsCount": _falls_count,
			"damageTakenRun": _damage_taken,
			"dashesUsedRun": _dashes_used,
			"trafficHitsRun": _traffic_hits,
			"comboBounces": player.combo_bounces,
			"coinsRun": _coins_run,
			"helmetsRun": _helmets_run,
			"blueprintsRun": _blueprints_run,
			"signsRun": _signs_run,
			"collectedIds": collectible_sys.collected_ids,
			"hasTraffic": not obstacle_sys.traffic_list.is_empty(),
			"hasBoss": not obstacle_sys.boss_data.is_empty()
		})
		return

	_update_camera(dt, player.dash_active_timer > 0.0)

	if _notice_timer > 0.0:
		_notice_timer -= dt
		if _notice_timer <= 0.0:
			_notice_text = null

	_hud_accum += dt
	if _hud_accum >= 0.08:
		_hud_accum = 0.0
		_emit_hud()


func _sample_player_input() -> Dictionary:
	var kb_f := (1.0 if Input.is_action_pressed("move_forward") else 0.0) - (1.0 if Input.is_action_pressed("move_backward") else 0.0)
	var kb_r := (1.0 if Input.is_action_pressed("move_right") else 0.0) - (1.0 if Input.is_action_pressed("move_left") else 0.0)
	var fwd := clampf(kb_f + touch_move.y, -1.0, 1.0)
	var rgt := clampf(kb_r + touch_move.x, -1.0, 1.0)

	var t_jump := bool(touch_actions["jump"])
	var t_slide := bool(touch_actions["slide"])
	var t_bounce := bool(touch_actions["bounce"])
	var t_dash := bool(touch_actions["dash"])
	var t_special := bool(touch_actions["special"])
	var t_inter := bool(touch_actions["interact"])

	var res := {
		"forward": fwd,
		"right": rgt,
		"jumpPressed": Input.is_action_just_pressed("jump") or (t_jump and not bool(_prev_touch_pressed["jump"])),
		"jumpHeld": Input.is_action_pressed("jump") or t_jump,
		"sprintHeld": Input.is_action_pressed("sprint") or bool(touch_actions["sprint"]),
		"slidePressed": Input.is_action_just_pressed("slide") or (t_slide and not bool(_prev_touch_pressed["slide"])),
		"slideHeld": Input.is_action_pressed("slide") or t_slide,
		"bouncePressed": Input.is_action_just_pressed("bounce") or (t_bounce and not bool(_prev_touch_pressed["bounce"])),
		"dashPressed": Input.is_action_just_pressed("dash") or (t_dash and not bool(_prev_touch_pressed["dash"])),
		"specialPressed": Input.is_action_just_pressed("special") or (t_special and not bool(_prev_touch_pressed["special"])),
		"interactPressed": Input.is_action_just_pressed("interact") or (t_inter and not bool(_prev_touch_pressed["interact"]))
	}
	_prev_touch_pressed["jump"] = t_jump
	_prev_touch_pressed["slide"] = t_slide
	_prev_touch_pressed["bounce"] = t_bounce
	_prev_touch_pressed["dash"] = t_dash
	_prev_touch_pressed["special"] = t_special
	_prev_touch_pressed["interact"] = t_inter
	return res


func _apply_damage(knock: Vector3, reason: String) -> void:
	player.health -= 1
	player.invuln_timer = 1.4
	_damage_taken += 1
	player.vel = knock
	AudioManager.play_damage()
	AudioManager.play_fahh(reason, 0.065)
	player.trigger_oneshot("damage", 0.4)
	_cam_trauma = minf(1.0, _cam_trauma + 0.55)
	_spawn_burst(player.pos + Vector3(0.0, 0.4, 0.0), Color("#ef4444"))
	if player.health <= 0:
		_falls_count += 1
		_respawn_at_checkpoint()


func _respawn_at_checkpoint() -> void:
	player.respawn_at(powerup_sys.active_spawn, powerup_sys.active_gravity_inverted, road_sys.platforms)
	road_sys.reset_crumbling()
	_cam_trauma = minf(1.0, _cam_trauma + 0.3)
	_emit_hud()


func _update_camera(dt: float, dash_active: bool) -> void:
	var p_pos := player.pos
	var p_vel := player.vel
	var up_dir := player.get_up_direction()
	var up_sign := 1.0 if up_dir.y >= 0.0 else -1.0

	var target_air := 0.14 if not player.grounded else 0.0
	_air_pitch += (target_air - _air_pitch) * (1.0 - exp(-5.0 * dt))
	var eff_pitch := clampf(_cam_pitch + _air_pitch, -0.25, 1.2)
	var h_dist := cos(eff_pitch) * _cam_dist
	var v_dist := sin(eff_pitch) * _cam_dist * up_sign

	var lx := clampf(p_vel.x * 0.14, -2.2, 2.2)
	var lz := clampf(p_vel.z * 0.14, -2.2, 2.2)

	var goal_pos := Vector3(
		p_pos.x + sin(_cam_yaw) * h_dist + lx * 0.35,
		p_pos.y + v_dist + 1.35 * up_sign,
		p_pos.z + cos(_cam_yaw) * h_dist + lz * 0.35
	)
	var goal_look := Vector3(
		p_pos.x - sin(_cam_yaw) * 2.4 + lx,
		p_pos.y + 1.0 * up_sign,
		p_pos.z - cos(_cam_yaw) * 2.4 + lz
	)

	var smooth := float(SaveManager.settings.get("cameraSmoothing", 1.0))
	_cam_pos = _cam_pos.lerp(goal_pos, 1.0 - exp(-10.0 * smooth * dt))
	_cam_look = _cam_look.lerp(goal_look, 1.0 - exp(-14.0 * smooth * dt))

	var shake := Vector3.ZERO
	if _cam_trauma > 0.0:
		var mag := _cam_trauma * _cam_trauma * 0.25
		shake = Vector3(randf_range(-mag, mag), randf_range(-mag, mag), 0.0)
		_cam_trauma = maxf(0.0, _cam_trauma - dt * 2.5)

	camera.position = _cam_pos + shake
	if _cam_pos.distance_to(_cam_look) > 0.1:
		camera.look_at(_cam_look, up_dir)

	var cam_rx := cos(_cam_yaw)
	var cam_rz := -sin(_cam_yaw)
	var lat_vel := p_vel.x * cam_rx + p_vel.z * cam_rz
	var target_bank := clampf(-lat_vel * 0.0028, -0.045, 0.045)
	_cam_bank += (target_bank - _cam_bank) * (1.0 - exp(-8.0 * dt))
	camera.rotate_object_local(Vector3.BACK, _cam_bank)

	var spd := Vector2(p_vel.x, p_vel.z).length()
	var target_fov := 74.0 if dash_active else (62.0 + clampf((spd - 11.0) * 0.7, 0.0, 8.0))
	camera.fov = lerpf(camera.fov, target_fov, 1.0 - exp(-10.0 * dt))

	key_light.position = p_pos + Vector3(22.0, 34.0, 18.0)


func _spawn_burst(at_pos: Vector3, col: Color) -> void:
	if particles_burst == null:
		return
	particles_burst.global_position = at_pos
	var mat := particles_burst.mesh.material as StandardMaterial3D
	if mat:
		mat.albedo_color = col
	particles_burst.restart()
	particles_burst.emitting = true


func _show_notice(txt: String) -> void:
	_notice_text = txt
	_notice_timer = 2.8


func _emit_hud() -> void:
	var par := float(_current_level.get("parTime", 30.0))
	var found := collectible_sys.collected_ids.size()
	var total := collectible_sys.items.size()
	var live_score := GameManager.compute_level_score(_elapsed_run, par, found, total, _falls_count, player.combo_bounces)
	var tc: Variant = _current_level.get("timeChallengeSec", null)
	GameManager.hud_updated.emit({
		"levelId": str(_current_level.get("id", "w1-l1")),
		"levelName": str(_current_level.get("name", "")),
		"worldName": str(_current_theme.get("name", "")),
		"score": live_score,
		"coinsRun": _coins_run,
		"totalCoins": int(SaveManager.data.get("coins", 0)) + _coins_run,
		"collectiblesFound": found,
		"collectiblesTotal": total,
		"health": player.health,
		"maxHealth": player.max_health,
		"elapsedTime": _elapsed_run,
		"timeChallengeRemaining": maxf(0.0, float(tc) - _elapsed_run) if tc != null else null,
		"speed": player.vel.length(),
		"bounceCooldownRatio": player.bounce_cooldown / PlayerController3D.MAX_BOUNCE_CD,
		"dashCooldownRatio": player.dash_cooldown / PlayerController3D.MAX_DASH_CD,
		"specialCooldownRatio": player.special_cooldown / PlayerController3D.MAX_SPECIAL_CD,
		"specialActive": player.special_active_timer > 0.0,
		"checkpointLabel": powerup_sys.active_label,
		"checkpointNotice": _notice_text,
		"bossName": _current_level.get("boss", {}).get("name", null) if _current_level.has("boss") and typeof(_current_level["boss"]) == TYPE_DICTIONARY else null,
		"interactPrompt": _interact_prompt,
		"levelHint": _current_level.get("hint", null) if _elapsed_run < 6.5 else null,
		"canDash": bool(_current_level.get("allowDash", true))
	})
