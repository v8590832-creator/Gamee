extends Node3D
class_name PlayerController3D

## Sculpted 3D Indian kurta hero rig, procedural animation state machine,
## substepped Sphere-vs-OBB platform solver, and movement/ability controller.

const RADIUS := 0.55
const SLIDE_RADIUS := 0.36

var pos := Vector3(0.0, 1.0, 0.0)
var vel := Vector3.ZERO
var facing_yaw := PI
var grounded := false
var health := 3
var max_health := 3
var invuln_timer := 0.0

var coyote_timer := 0.0
var jump_buffer_timer := 0.0
var double_jump_available := true

var slide_timer := 0.0
var is_sliding := false
var is_sprinting := false

var bounce_cooldown := 0.0
const MAX_BOUNCE_CD := 1.6
var super_bounce_timer := 0.0

var dash_cooldown := 0.0
const MAX_DASH_CD := 1.35
var dash_active_timer := 0.0
var dash_charge := 1.0

var special_cooldown := 0.0
const MAX_SPECIAL_CD := 6.0
var special_active_timer := 0.0
var special_energy := 1.0

var squash_y := 1.0
var squash_xz := 1.0

var player_gravity_inverted := false
var gravity_cd := 0.0
var current_gravity := Vector3(0.0, -24.0, 0.0)
var in_gravity_zone := false

var combo_bounces := 0
var has_ground_below := false
var ground_shadow_y := 0.0

var _prev_jump_held := false
var _prev_platform_pos: Dictionary = {}
var _prev_platform_rot: Dictionary = {}

# Animation & Visual Rig Nodes
var _rig_body: Node3D
var _hips: Node3D
var _torso: Node3D
var _head: Node3D
var _eyelid_l: MeshInstance3D
var _eyelid_r: MeshInstance3D
var _brow_l: MeshInstance3D
var _brow_r: MeshInstance3D
var _mouth: MeshInstance3D
var _arm_l: Node3D
var _forearm_l: Node3D
var _arm_r: Node3D
var _forearm_r: Node3D
var _leg_l: Node3D
var _shin_l: Node3D
var _leg_r: Node3D
var _shin_r: Node3D
var _skirt: MeshInstance3D
var _surge_aura: MeshInstance3D
var _contact_shadow: MeshInstance3D
var _shockwave_ring: MeshInstance3D

var _mat_kurta: StandardMaterial3D
var _mat_trouser: StandardMaterial3D
var _mat_shoe: StandardMaterial3D
var _mat_frame: StandardMaterial3D
var _mat_lens: StandardMaterial3D
var _mat_aura: StandardMaterial3D
var _mat_wave: StandardMaterial3D

var _hard_hat_grp: Node3D
var _gandhi_cap_grp: Node3D
var _turban_grp: Node3D

var _anim_time := 0.0
var _stride_phase := 0.0
var _prev_facing := PI
var _bank_roll := 0.0
var _blink_timer := 3.0
var _oneshot_state := ""
var _oneshot_timer := 0.0
var _spin_angle := 0.0
var _wave_timer := 0.0
var _wave_max_scale := 2.4


func _ready() -> void:
	_build_character_rig()
	apply_loadout(SaveManager.data.get("loadout", {}))
	SaveManager.save_changed.connect(func() -> void:
		apply_loadout(SaveManager.data.get("loadout", {}))
	)


func reset_player(spawn: Vector3, yaw: float, road_platforms: Array) -> void:
	pos = spawn
	vel = Vector3.ZERO
	facing_yaw = yaw + PI
	grounded = false
	health = max_health
	invuln_timer = 0.0
	coyote_timer = 0.0
	jump_buffer_timer = 0.0
	double_jump_available = true
	slide_timer = 0.0
	is_sliding = false
	is_sprinting = false
	bounce_cooldown = 0.0
	super_bounce_timer = 0.0
	dash_cooldown = 0.0
	dash_active_timer = 0.0
	dash_charge = 1.0
	special_cooldown = 0.0
	special_active_timer = 0.0
	special_energy = 1.0
	squash_y = 1.0
	squash_xz = 1.0
	player_gravity_inverted = false
	gravity_cd = 0.0
	current_gravity = Vector3(0.0, -24.0, 0.0)
	in_gravity_zone = false
	combo_bounces = 0
	_prev_jump_held = false
	_oneshot_state = ""
	_oneshot_timer = 0.0
	_spin_angle = 0.0
	_prev_facing = facing_yaw
	position = pos
	scale = Vector3.ONE
	sync_platform_history(road_platforms)


func sync_platform_history(road_platforms: Array) -> void:
	_prev_platform_pos.clear()
	_prev_platform_rot.clear()
	for i in range(road_platforms.size()):
		var p: Dictionary = road_platforms[i]
		_prev_platform_pos[i] = p["currentPos"]
		_prev_platform_rot[i] = float(p["currentRotY"])


func respawn_at(spawn: Vector3, grav_inverted: bool, road_platforms: Array) -> void:
	pos = spawn
	vel = Vector3.ZERO
	health = max_health
	invuln_timer = 0.8
	player_gravity_inverted = grav_inverted
	gravity_cd = 0.0
	grounded = false
	sync_platform_history(road_platforms)


func apply_loadout(loadout: Dictionary) -> void:
	if _mat_kurta == null:
		return
	var k := GameManager.get_cosmetic_by_id("kurta", str(loadout.get("kurta", "ivory")))
	var f := GameManager.get_cosmetic_by_id("footwear", str(loadout.get("footwear", "mojari")))
	var h := GameManager.get_cosmetic_by_id("headwear", str(loadout.get("headwear", "wire_glasses")))

	_mat_kurta.albedo_color = Color.html(str(k.get("primaryColor", "#f4f1ea")))
	_mat_trouser.albedo_color = Color.html(str(k.get("secondaryColor", "#252932")))
	_mat_shoe.albedo_color = Color.html(str(f.get("primaryColor", "#4a3123")))
	_mat_frame.albedo_color = Color.html(str(h.get("primaryColor", "#c8d0db")))
	var hw_id := str(loadout.get("headwear", "wire_glasses"))
	_mat_lens.albedo_color.a = 0.85 if hw_id == "aviators" else 0.22
	_hard_hat_grp.visible = hw_id == "hard_hat"
	_gandhi_cap_grp.visible = hw_id == "gandhi_cap"
	_turban_grp.visible = hw_id == "royal_turban"


func trigger_oneshot(state: String, duration: float) -> void:
	_oneshot_state = state
	_oneshot_timer = duration
	if state == "doubleJump":
		_spin_angle = 0.0


func trigger_shockwave(hex_col: String, max_scale := 2.4) -> void:
	_wave_timer = 0.35
	_wave_max_scale = max_scale
	var c := Color.html(hex_col)
	_mat_wave.albedo_color = Color(c.r, c.g, c.b, 0.72)
	_shockwave_ring.visible = true
	_shockwave_ring.scale = Vector3(0.6, 0.6, 1.0)


func trigger_land_squash(impact_speed: float) -> void:
	var strength := minf(0.32, impact_speed * 0.018)
	squash_y = 1.0 - strength
	squash_xz = 1.0 + strength * 0.7


func get_up_direction() -> Vector3:
	if current_gravity.length() < 0.0001:
		return Vector3.UP
	return (-current_gravity).normalized()


func step_simulation(
	dt: float,
	world_dt: float,
	input_state: Dictionary,
	cam_yaw: float,
	allow_dash: bool,
	road_system: RoadSystem
) -> Dictionary:
	# 1. Gravity zones & gravity smoothing
	if gravity_cd > 0.0:
		gravity_cd = maxf(0.0, gravity_cd - dt)
	var zone_grav: Variant = null
	for p in road_system.platforms:
		if str(p["kind"]) == "gravityZone":
			var def: Dictionary = p["def"]
			if def.has("zoneGravity") and _is_point_inside_box(pos, p["currentPos"], p["size"], p["rot"]):
				var zg: Dictionary = def["zoneGravity"]
				zone_grav = Vector3(float(zg.get("x", 0.0)), float(zg.get("y", -24.0)), float(zg.get("z", 0.0)))
				break
	in_gravity_zone = zone_grav != null
	var target_grav := Vector3(0.0, 22.0 if player_gravity_inverted else -24.0, 0.0)
	if zone_grav != null:
		var zv: Vector3 = zone_grav
		target_grav = -zv if player_gravity_inverted else zv
	current_gravity = current_gravity.lerp(target_grav, 1.0 - exp(-14.0 * dt))
	var up_dir := get_up_direction()

	# 2. Movement & Abilities
	var events := _apply_movement(dt, input_state, cam_yaw, up_dir, allow_dash)

	# 3. Platform Physics Step (substepped Sphere-vs-OBB)
	road_system.step_crumble_timers(world_dt)
	vel += current_gravity * dt

	var on_slippery := false
	var riding_roller := false
	for p in road_system.platforms:
		var k := str(p["kind"])
		if k == "windZone" or k == "fluidZone":
			if _is_point_inside_box(pos, p["currentPos"], p["size"], p["rot"]):
				var def: Dictionary = p["def"]
				if def.has("zoneForce"):
					var zf: Dictionary = def["zoneForce"]
					vel += Vector3(float(zf.get("x", 0.0)), float(zf.get("y", 0.0)), float(zf.get("z", 0.0))) * dt
				if k == "fluidZone":
					var drag := float(def.get("zoneDrag", 1.8))
					var factor := exp(-drag * dt)
					vel.x *= factor
					vel.y *= maxf(0.75, factor)
					vel.z *= factor
		elif k == "puddle":
			var cp: Vector3 = p["currentPos"]
			var sz: Vector3 = p["size"]
			if absf(pos.x - cp.x) <= sz.x * 0.5 and absf(pos.z - cp.z) <= sz.z * 0.5 and absf(pos.y - cp.y) <= 1.2:
				on_slippery = true

	var was_grounded := grounded
	grounded = false
	var landed_impact := 0.0
	var pad_bounce_events: Array = []
	var eff_radius := SLIDE_RADIUS if is_sliding else RADIUS
	var substeps := 2
	var sub_dt := dt / float(substeps)

	for s in range(substeps):
		pos += vel * sub_dt
		for i in range(road_system.platforms.size()):
			var p: Dictionary = road_system.platforms[i]
			var k := str(p["kind"])
			if k == "gravityZone" or k == "windZone" or k == "fluidZone" or k == "puddle":
				continue
			if k == "bridge" and not bool(p["active"]):
				continue
			if k == "crumbling" and str(p["crumbleState"]) == "fallen":
				continue

			var rot := Vector3(0.0, float(p["currentRotY"]), 0.0) if k == "gear" else (p["rot"] as Vector3)
			var hit := _intersect_sphere_obb(pos, eff_radius, p["currentPos"], p["size"], rot)
			if not bool(hit["hit"]):
				continue

			var normal: Vector3 = hit["normal"]
			var pen := float(hit["penetration"])
			pos += normal * pen

			var align := normal.dot(up_dir)
			if align > 0.48:
				grounded = true
				var def: Dictionary = p["def"]
				if str(def.get("materialStyle", "")) == "wet":
					on_slippery = true
				if k == "roller":
					riding_roller = true
				if k == "crumbling" and str(p["crumbleState"]) == "intact":
					p["crumbleState"] = "shaking"
					p["crumbleTimer"] = float(def.get("crumbleDelay", 0.85))
				if s == 0:
					if _prev_platform_pos.has(i):
						pos += (p["currentPos"] as Vector3) - (_prev_platform_pos[i] as Vector3)
					if k == "gear" and _prev_platform_rot.has(i):
						var d_theta := float(p["currentRotY"]) - float(_prev_platform_rot[i])
						if absf(d_theta) > 1e-6:
							var cp: Vector3 = p["currentPos"]
							var rx := pos.x - cp.x
							var rz := pos.z - cp.z
							var c := cos(d_theta)
							var sn := sin(d_theta)
							pos.x = cp.x + (rx * c - rz * sn)
							pos.z = cp.z + (rx * sn + rz * c)

			var def_p: Dictionary = p["def"]
			var vn := vel.dot(normal)
			var impact := -vn if vn < 0.0 else 0.0
			if not was_grounded and vn < -3.5 and align > 0.48:
				landed_impact = maxf(landed_impact, impact)

			if k == "bounce" or k == "pothole":
				var pad_force := float(def_p.get("bounceForce", 19.0))
				var rest := float(def_p.get("restitution", 0.72))
				var launch_dir := normal
				if def_p.has("bounceDirection"):
					var bd: Dictionary = def_p["bounceDirection"]
					launch_dir = Vector3(float(bd.get("x", 0.0)), float(bd.get("y", 1.0)), float(bd.get("z", 0.0))).normalized()
				var tan_vel := vel - normal * vn
				var dyn_imp := maxf(pad_force, pad_force * 0.85 + impact * (0.45 + rest * 0.35))
				var tan_keep := 0.92 if launch_dir.dot(normal) > 0.85 else 0.4
				vel = tan_vel * tan_keep + launch_dir * dyn_imp
				p["padPulse"] = 1.0
				combo_bounces += 1
				grounded = false
				pad_bounce_events.append({"impact": maxf(impact, pad_force * 0.5), "pos": hit["closestPoint"]})
			else:
				if vn < 0.0:
					var mat_style := str(def_p.get("materialStyle", "concrete"))
					var mat_rest := 0.28 if mat_style == "steel" else (0.35 if mat_style == "copper" else 0.16)
					var b_fac := mat_rest if impact > 3.2 else 0.0
					var tan_vel := vel - normal * vn
					vel = tan_vel + normal * (-vn * b_fac)

	sync_platform_history(road_system.platforms)

	# 4. Ground contact shadow probe
	has_ground_below = false
	ground_shadow_y = pos.y - 20.0
	var best_dist := 99999.0
	for p in road_system.platforms:
		var k := str(p["kind"])
		if k == "gravityZone" or k == "windZone" or k == "fluidZone" or k == "puddle":
			continue
		if k == "bridge" and not bool(p["active"]):
			continue
		if k == "crumbling" and str(p["crumbleState"]) == "fallen":
			continue
		var cp: Vector3 = p["currentPos"]
		var sz: Vector3 = p["size"]
		if absf(pos.x - cp.x) <= sz.x * 0.5 and absf(pos.z - cp.z) <= sz.z * 0.5:
			var surf_y := (cp.y - sz.y * 0.5) if player_gravity_inverted else (cp.y + sz.y * 0.5)
			var dist := (surf_y - pos.y) if player_gravity_inverted else (pos.y - surf_y)
			if dist >= -0.6 and dist < 16.0 and dist < best_dist:
				best_dist = dist
				ground_shadow_y = surf_y
				has_ground_below = true

	# 5. Update visuals & animation rig
	position = pos
	scale = Vector3(squash_xz, squash_y, squash_xz)
	if has_ground_below:
		_contact_shadow.visible = true
		_contact_shadow.global_position = Vector3(pos.x, ground_shadow_y + (-0.02 if player_gravity_inverted else 0.02), pos.z)
		var s_sc := maxf(0.4, 1.1 - absf(pos.y - ground_shadow_y) * 0.06)
		_contact_shadow.scale = Vector3(s_sc, 1.0, s_sc)
	else:
		_contact_shadow.visible = false

	_update_shockwave(dt)
	var horiz_spd := Vector2(vel.x, vel.z).length()
	_update_animation_rig(dt, horiz_spd, vel.y, grounded, is_sprinting, is_sliding, dash_active_timer > 0.0, special_active_timer > 0.0, facing_yaw, false)

	events["landedImpact"] = landed_impact
	events["padBounces"] = pad_bounce_events
	events["ridingRoller"] = riding_roller
	events["onSlippery"] = on_slippery
	return events


func update_title_showcase(dt: float, spawn: Vector3) -> void:
	var road_top_y := spawn.y - 1.0
	pos = Vector3(spawn.x + 1.5, road_top_y + 0.55, spawn.z - 2.6)
	position = pos
	scale = Vector3.ONE
	_contact_shadow.visible = true
	_contact_shadow.global_position = Vector3(pos.x, road_top_y + 0.02, pos.z)
	_contact_shadow.scale = Vector3.ONE
	_update_animation_rig(dt, 0.0, 0.0, true, false, false, false, false, 0.35, false)


func _apply_movement(dt: float, inp: Dictionary, cam_yaw: float, up_dir: Vector3, allow_dash: bool) -> Dictionary:
	var jumped := false
	var double_jumped := false
	var super_bounced := false
	var slid := false
	var dashed := false
	var special_activated := false

	if invuln_timer > 0.0: invuln_timer = maxf(0.0, invuln_timer - dt)
	if bounce_cooldown > 0.0: bounce_cooldown = maxf(0.0, bounce_cooldown - dt)
	if super_bounce_timer > 0.0: super_bounce_timer = maxf(0.0, super_bounce_timer - dt)
	if dash_cooldown > 0.0: dash_cooldown = maxf(0.0, dash_cooldown - dt)
	if dash_active_timer > 0.0: dash_active_timer = maxf(0.0, dash_active_timer - dt)
	if special_cooldown > 0.0: special_cooldown = maxf(0.0, special_cooldown - dt)

	if special_active_timer > 0.0:
		special_active_timer = maxf(0.0, special_active_timer - dt)
		special_energy = maxf(0.0, special_energy - dt * 0.35)
	else:
		special_energy = minf(1.0, special_energy + dt * 0.14)

	if grounded:
		coyote_timer = 0.13
		double_jump_available = true
	else:
		coyote_timer = maxf(0.0, coyote_timer - dt)

	if bool(inp.get("jumpPressed", false)):
		jump_buffer_timer = 0.14
	else:
		jump_buffer_timer = maxf(0.0, jump_buffer_timer - dt)

	var horiz_spd := Vector2(vel.x, vel.z).length()
	dash_charge = minf(1.0, dash_charge + dt * (0.45 + horiz_spd * 0.04))

	var fwd_x := -sin(cam_yaw)
	var fwd_z := -cos(cam_yaw)
	var right_x := cos(cam_yaw)
	var right_z := -sin(cam_yaw)
	var in_fwd := float(inp.get("forward", 0.0))
	var in_right := float(inp.get("right", 0.0))

	var wish_x := fwd_x * in_fwd + right_x * in_right
	var wish_z := fwd_z * in_fwd + right_z * in_right
	var wish_len := Vector2(wish_x, wish_z).length()
	if wish_len > 0.0001:
		wish_x /= wish_len
		wish_z /= wish_len
		var target_yaw := atan2(wish_x, wish_z)
		var diff := wrapf(target_yaw - facing_yaw, -PI, PI)
		facing_yaw += diff * (1.0 - exp(-14.0 * dt))

	if bool(inp.get("slidePressed", false)) and grounded and slide_timer <= 0.0:
		slide_timer = 0.55
		var dx := wish_x if wish_len > 0.0001 else sin(facing_yaw)
		var dz := wish_z if wish_len > 0.0001 else cos(facing_yaw)
		var burst := maxf(horiz_spd, 15.5)
		vel.x = dx * burst
		vel.z = dz * burst
		slid = true
	if slide_timer > 0.0:
		slide_timer = maxf(0.0, slide_timer - dt)
	is_sliding = grounded and (slide_timer > 0.0 or bool(inp.get("slideHeld", false))) and horiz_spd > 2.0

	is_sprinting = bool(inp.get("sprintHeld", false)) and wish_len > 0.0001 and not is_sliding
	var surge_boost := 1.25 if special_active_timer > 0.0 else 1.0
	var base_max := (17.5 if is_sprinting else 13.0) * surge_boost
	var max_spd := 24.0 if dash_active_timer > 0.0 else base_max
	var accel := (44.0 if grounded else 25.0) * (1.25 if is_sprinting else 1.0)

	if wish_len > 0.0001 and slide_timer <= 0.15:
		vel.x += wish_x * accel * dt
		vel.z += wish_z * accel * dt
		var new_h := Vector2(vel.x, vel.z).length()
		if new_h > max_spd and dash_active_timer <= 0.0:
			var damped := new_h + (max_spd - new_h) * (1.0 - exp(-7.0 * dt))
			var ratio := damped / new_h
			vel.x *= ratio
			vel.z *= ratio
	elif not is_sliding:
		var damp := exp(-(6.0 if grounded else 0.7) * dt)
		vel.x *= damp
		vel.z *= damp

	if jump_buffer_timer > 0.0 and coyote_timer > 0.0:
		var j_imp := 11.8 * (1.12 if special_active_timer > 0.0 else 1.0)
		var v_up := vel.dot(up_dir)
		if v_up < 0.0:
			vel -= up_dir * v_up
		vel += up_dir * j_imp
		grounded = false
		coyote_timer = 0.0
		jump_buffer_timer = 0.0
		slide_timer = 0.0
		squash_y = 1.22
		squash_xz = 0.86
		jumped = true
	elif bool(inp.get("jumpPressed", false)) and not grounded and double_jump_available:
		double_jump_available = false
		jump_buffer_timer = 0.0
		var dj_imp := 11.2
		vel.x = vel.x * (1.0 - absf(up_dir.x)) + up_dir.x * dj_imp
		vel.y = vel.y * (1.0 - absf(up_dir.y)) + up_dir.y * dj_imp
		vel.z = vel.z * (1.0 - absf(up_dir.z)) + up_dir.z * dj_imp
		squash_y = 1.25
		squash_xz = 0.84
		double_jumped = true

	var jump_held := bool(inp.get("jumpHeld", false))
	if _prev_jump_held and not jump_held:
		var v_up := vel.dot(up_dir)
		if v_up > 3.0 and super_bounce_timer <= 0.0:
			vel -= up_dir * (v_up * 0.4)
	_prev_jump_held = jump_held

	if bool(inp.get("bouncePressed", false)) and bounce_cooldown <= 0.0:
		var fx := wish_x if wish_len > 0.0001 else sin(facing_yaw)
		var fz := wish_z if wish_len > 0.0001 else cos(facing_yaw)
		vel.x = fx * maxf(horiz_spd, 11.5)
		vel.y = up_dir.y * 17.5
		vel.z = fz * maxf(horiz_spd, 11.5)
		grounded = false
		bounce_cooldown = MAX_BOUNCE_CD
		super_bounce_timer = 0.45
		squash_y = 1.32
		squash_xz = 0.78
		super_bounced = true

	if allow_dash and bool(inp.get("dashPressed", false)) and dash_cooldown <= 0.0 and dash_charge >= 0.3:
		var dx := wish_x if wish_len > 0.0001 else fwd_x
		var dz := wish_z if wish_len > 0.0001 else fwd_z
		var d_spd := 21.0 + dash_charge * 4.5
		vel.x = dx * d_spd
		vel.z = dz * d_spd
		if vel.y * up_dir.y < 2.0:
			vel.y += up_dir.y * 3.5
		dash_cooldown = MAX_DASH_CD
		dash_active_timer = 0.25
		dash_charge = maxf(0.0, dash_charge - 0.6)
		squash_y = 0.84
		squash_xz = 1.2
		dashed = true

	if bool(inp.get("specialPressed", false)) and special_cooldown <= 0.0 and special_energy >= 0.4:
		special_active_timer = 3.2
		special_cooldown = MAX_SPECIAL_CD
		special_activated = true

	var sq_damp := 1.0 - exp(-14.0 * dt)
	squash_y += (1.0 - squash_y) * sq_damp
	squash_xz += (1.0 - squash_xz) * sq_damp

	return {
		"jumped": jumped,
		"doubleJumped": double_jumped,
		"superBounced": super_bounced,
		"slid": slid,
		"dashed": dashed,
		"specialActivated": special_activated
	}


func _update_animation_rig(dt: float, horiz_spd: float, vel_y: float, is_ground: bool, sprint: bool, slide: bool, dash: bool, special: bool, f_yaw: float, victory: bool) -> void:
	_anim_time += dt
	if is_ground and horiz_spd > 0.3:
		_stride_phase += horiz_spd * dt * 0.85

	if _oneshot_timer > 0.0:
		_oneshot_timer = maxf(0.0, _oneshot_timer - dt)
		if _oneshot_timer <= 0.0:
			_oneshot_state = ""
			_spin_angle = 0.0

	var state := "idle"
	if victory:
		state = "victory"
	elif _oneshot_state != "":
		state = _oneshot_state
	elif dash:
		state = "dash"
	elif slide:
		state = "slide"
	elif not is_ground:
		state = "jump" if vel_y > 1.5 else "fall"
	elif horiz_spd > 13.5 and sprint:
		state = "sprint"
	elif horiz_spd > 5.0:
		state = "run"
	elif horiz_spd > 0.6:
		state = "walk"

	var yaw_delta := wrapf(f_yaw - _prev_facing, -PI, PI)
	_prev_facing = f_yaw
	var target_bank := clampf((-yaw_delta / maxf(dt, 0.008)) * 0.032, -0.24, 0.24) if (is_ground and horiz_spd > 2.5) else 0.0
	_bank_roll += (target_bank - _bank_roll) * (1.0 - exp(-10.0 * dt))
	_rig_body.rotation.y = f_yaw
	_rig_body.rotation.z = _bank_roll

	_blink_timer -= dt
	var blinking := _blink_timer < 0.12
	if _blink_timer <= 0.0:
		_blink_timer = 2.8 + randf() * 1.8
	_eyelid_l.scale.y = 3.2 if blinking else 1.0
	_eyelid_r.scale.y = 3.2 if blinking else 1.0

	var hip_y := 0.0
	var hip_rx := 0.0
	var hip_ry := 0.0
	var torso_rx := 0.0
	var torso_ry := 0.0
	var head_rx := 0.0
	var head_ry := 0.0
	var arm_lx := 0.0
	var arm_rx := 0.0
	var arm_lz := 0.12
	var arm_rz := -0.12
	var fore_lx := -0.25
	var fore_rx := -0.25
	var leg_lx := 0.0
	var leg_rx := 0.0
	var shin_lx := 0.0
	var shin_rx := 0.0
	var spin_x := 0.0

	if state == "idle":
		var b := sin(_anim_time * 2.1)
		var sw := sin(_anim_time * 1.15)
		hip_y = b * 0.022
		hip_ry = sw * 0.04
		torso_ry = -sw * 0.03
		arm_lx = b * 0.05
		arm_rx = -b * 0.05
		head_rx = b * 0.035
		head_ry = sin(_anim_time * 0.7) * 0.12
	elif state == "walk" or state == "run" or state == "sprint":
		var amp := 1.05 if state == "sprint" else (0.8 if state == "run" else 0.48)
		var c := sin(_stride_phase)
		var bob := absf(cos(_stride_phase))
		hip_y = bob * (0.095 if state == "sprint" else (0.065 if state == "run" else 0.035))
		hip_ry = c * (0.14 if state == "sprint" else 0.09)
		torso_rx = 0.26 if state == "sprint" else (0.15 if state == "run" else 0.06)
		torso_ry = -c * (0.22 if state == "sprint" else 0.14)
		head_ry = c * 0.06
		leg_lx = c * amp
		leg_rx = -c * amp
		shin_lx = maxf(0.0, -c) * 0.88 + 0.12
		shin_rx = maxf(0.0, c) * 0.88 + 0.12
		arm_lx = -c * amp * 0.92
		arm_rx = c * amp * 0.92
		fore_lx = -0.68 - maxf(0.0, c) * 0.3
		fore_rx = -0.68 - maxf(0.0, -c) * 0.3
	elif state == "jump" or state == "bounce" or state == "special":
		torso_rx = -0.08
		arm_lx = -2.2
		arm_rx = -2.2
		arm_lz = 0.38
		arm_rz = -0.38
		leg_lx = -0.45
		leg_rx = 0.25
		shin_lx = 0.7
		shin_rx = 0.25
	elif state == "doubleJump":
		_spin_angle += dt * 15.0
		spin_x = _spin_angle
		leg_lx = -0.8
		leg_rx = -0.8
		shin_lx = 1.2
		shin_rx = 1.2
		arm_lx = -1.2
		arm_rx = -1.2
	elif state == "fall":
		var fl := sin(_anim_time * 14.0)
		arm_lx = -1.8 + fl * 0.35
		arm_rx = -1.8 - fl * 0.35
		arm_lz = 0.65
		arm_rz = -0.65
		leg_lx = -0.3 + fl * 0.18
		leg_rx = 0.2 - fl * 0.18
		shin_lx = 0.4
		shin_rx = 0.4
	elif state == "slide":
		hip_y = -0.34
		hip_rx = -0.85
		torso_rx = -0.2
		head_rx = 0.7
		leg_lx = -0.15
		leg_rx = -0.1
		shin_lx = 0.15
		shin_rx = 0.8
		arm_lx = 0.45
		arm_rx = -0.5
	elif state == "dash":
		torso_rx = 0.55
		head_rx = -0.35
		arm_lx = 0.8
		arm_rx = 0.8
		leg_lx = 0.55
		leg_rx = -0.35
	elif state == "land":
		hip_y = -0.16
		torso_rx = 0.2
		leg_lx = -0.55
		leg_rx = -0.55
		shin_lx = 0.9
		shin_rx = 0.9
	elif state == "damage":
		torso_rx = -0.35
		arm_lx = -0.9
		arm_rx = -0.9
		arm_lz = 0.55
		arm_rz = -0.55
	elif state == "pickup":
		arm_rx = -2.3
		hip_y = 0.08
	elif state == "victory" or state == "levelComplete":
		var wv := sin(_anim_time * 6.5)
		hip_y = absf(sin(_anim_time * 4.0)) * 0.1
		arm_lx = -2.6 + wv * 0.3
		arm_rx = -2.6 - wv * 0.3
		arm_lz = 0.45
		arm_rz = -0.45

	var damp := 1.0 - exp(-16.0 * dt)
	_hips.position.y = lerpf(_hips.position.y, hip_y, damp)
	_hips.rotation.x = lerpf(_hips.rotation.x, hip_rx + spin_x, damp)
	_hips.rotation.y = lerpf(_hips.rotation.y, hip_ry, damp)
	_torso.rotation.x = lerpf(_torso.rotation.x, torso_rx, damp)
	_torso.rotation.y = lerpf(_torso.rotation.y, torso_ry, damp)
	_head.rotation.x = lerpf(_head.rotation.x, head_rx, damp)
	_head.rotation.y = lerpf(_head.rotation.y, head_ry, damp)
	_arm_l.rotation.x = lerpf(_arm_l.rotation.x, arm_lx, damp)
	_arm_r.rotation.x = lerpf(_arm_r.rotation.x, arm_rx, damp)
	_arm_l.rotation.z = lerpf(_arm_l.rotation.z, arm_lz, damp)
	_arm_r.rotation.z = lerpf(_arm_r.rotation.z, arm_rz, damp)
	_forearm_l.rotation.x = lerpf(_forearm_l.rotation.x, fore_lx, damp)
	_forearm_r.rotation.x = lerpf(_forearm_r.rotation.x, fore_rx, damp)
	_leg_l.rotation.x = lerpf(_leg_l.rotation.x, leg_lx, damp)
	_leg_r.rotation.x = lerpf(_leg_r.rotation.x, leg_rx, damp)
	_shin_l.rotation.x = lerpf(_shin_l.rotation.x, shin_lx, damp)
	_shin_r.rotation.x = lerpf(_shin_r.rotation.x, shin_rx, damp)
	_skirt.rotation.x = sin(_stride_phase) * minf(0.18, horiz_spd * 0.012)

	_mat_aura.albedo_color.a = (0.55 + sin(_anim_time * 12.0) * 0.2) if special else 0.0
	_surge_aura.visible = special
	_surge_aura.rotation.y += dt * 4.0


func _update_shockwave(dt: float) -> void:
	if _wave_timer > 0.0:
		_wave_timer = maxf(0.0, _wave_timer - dt)
		var t := 1.0 - (_wave_timer / 0.35)
		var sc := 0.6 + t * _wave_max_scale
		_shockwave_ring.scale = Vector3(sc, 1.0, sc)
		_mat_wave.albedo_color.a = (1.0 - t) * 0.72
		if _wave_timer <= 0.0:
			_shockwave_ring.visible = false


func _build_character_rig() -> void:
	var m_skin := _mat("#d49a73", 0.58, 0.02)
	var m_hair := _mat("#b8c0ca", 0.68, 0.06)
	var m_trim := _mat("#e59a3c", 0.52, 0.18)
	var m_sole := _mat("#1b1e24", 0.85, 0.02)
	var m_white := _mat("#f8fafc", 0.4, 0.0)
	var m_iris := _mat("#27201c", 0.2, 0.0)
	var m_mouth := _mat("#7a3c2f", 0.5, 0.0)

	_mat_kurta = _mat("#f4f1ea", 0.78, 0.03)
	_mat_trouser = _mat("#252932", 0.74, 0.04)
	_mat_shoe = _mat("#4a3123", 0.44, 0.14)
	_mat_frame = _mat("#cfd7e3", 0.20, 0.88)
	_mat_lens = _mat("#18202b", 0.12, 0.45)
	_mat_lens.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	_mat_lens.albedo_color.a = 0.22

	_rig_body = Node3D.new()
	_rig_body.position = Vector3(0.0, 0.245, 0.0)
	add_child(_rig_body)

	_hips = Node3D.new()
	_rig_body.add_child(_hips)
	var pelv := _capsule(0.16, 0.42, _mat_trouser)
	pelv.rotation.z = PI * 0.5
	pelv.scale = Vector3(0.75, 1.0, 0.72)
	_hips.add_child(pelv)

	_torso = Node3D.new()
	_torso.position = Vector3(0.0, 0.08, 0.0)
	_hips.add_child(_torso)

	var chest := _cyl(0.245, 0.24, 0.56, _mat_kurta)
	chest.position = Vector3(0.0, 0.28, 0.0)
	chest.scale = Vector3(1.06, 1.0, 0.76)
	_torso.add_child(chest)

	_skirt = _cyl(0.242, 0.29, 0.26, _mat_kurta)
	_skirt.position = Vector3(0.0, -0.04, 0.0)
	_skirt.scale = Vector3(1.06, 1.0, 0.78)
	_torso.add_child(_skirt)

	var collar := _cyl(0.118, 0.132, 0.075, _mat_kurta)
	collar.position = Vector3(0.0, 0.575, 0.0)
	var band := _torus(0.11, 0.134, m_trim)
	band.position = Vector3(0.0, 0.595, 0.0)
	var placket := _box(Vector3(0.052, 0.25, 0.022), _mat_kurta)
	placket.position = Vector3(0.0, 0.435, 0.19)
	_torso.add_child(collar)
	_torso.add_child(band)
	_torso.add_child(placket)
	for i in range(3):
		var btn := _sphere(0.012, _mat_frame)
		btn.position = Vector3(0.0, 0.51 - float(i) * 0.065, 0.205)
		_torso.add_child(btn)

	# Head
	_head = Node3D.new()
	_head.position = Vector3(0.0, 0.625, 0.0)
	_torso.add_child(_head)

	var neck := _cyl(0.078, 0.096, 0.10, m_skin)
	neck.position = Vector3(0.0, 0.02, 0.0)
	var cran := _sphere(0.215, m_skin)
	cran.scale = Vector3(0.94, 1.06, 0.96)
	cran.position = Vector3(0.0, 0.235, 0.0)
	var jaw := _sphere(0.165, m_skin)
	jaw.scale = Vector3(0.95, 0.78, 0.92)
	jaw.position = Vector3(0.0, 0.155, 0.025)
	var nose := _capsule(0.024, 0.09, m_skin)
	nose.position = Vector3(0.0, 0.21, 0.21)
	nose.rotation.x = -0.18
	for ch in [neck, cran, jaw, nose]:
		_head.add_child(ch)

	var eye_l := _sphere(0.032, m_white)
	eye_l.position = Vector3(-0.074, 0.252, 0.182)
	var eye_r := _sphere(0.032, m_white)
	eye_r.position = Vector3(0.074, 0.252, 0.182)
	var pup_l := _sphere(0.018, m_iris)
	pup_l.position = Vector3(-0.074, 0.252, 0.206)
	var pup_r := _sphere(0.018, m_iris)
	pup_r.position = Vector3(0.074, 0.252, 0.206)
	_eyelid_l = _box(Vector3(0.07, 0.016, 0.042), m_skin)
	_eyelid_l.position = Vector3(-0.074, 0.278, 0.192)
	_eyelid_r = _box(Vector3(0.07, 0.016, 0.042), m_skin)
	_eyelid_r.position = Vector3(0.074, 0.278, 0.192)
	_brow_l = _box(Vector3(0.068, 0.018, 0.02), m_hair)
	_brow_l.position = Vector3(-0.076, 0.308, 0.194)
	_brow_r = _box(Vector3(0.068, 0.018, 0.02), m_hair)
	_brow_r.position = Vector3(0.076, 0.308, 0.194)
	_mouth = _box(Vector3(0.06, 0.016, 0.018), m_mouth)
	_mouth.position = Vector3(0.0, 0.15, 0.198)
	for ch in [eye_l, eye_r, pup_l, pup_r, _eyelid_l, _eyelid_r, _brow_l, _brow_r, _mouth]:
		_head.add_child(ch)

	# Silver-grey hair & glasses
	var hair_top := _sphere(0.222, m_hair)
	hair_top.scale = Vector3(0.97, 0.72, 1.03)
	hair_top.position = Vector3(0.0, 0.315, -0.025)
	var hair_crest := _capsule(0.068, 0.26, m_hair)
	hair_crest.rotation.z = PI * 0.5
	hair_crest.position = Vector3(0.0, 0.42, 0.055)
	_head.add_child(hair_top)
	_head.add_child(hair_crest)

	var gl_l := _box(Vector3(0.092, 0.056, 0.014), _mat_lens)
	gl_l.position = Vector3(-0.074, 0.252, 0.22)
	var gl_r := _box(Vector3(0.092, 0.056, 0.014), _mat_lens)
	gl_r.position = Vector3(0.074, 0.252, 0.22)
	var gl_bridge := _box(Vector3(0.055, 0.01, 0.012), _mat_frame)
	gl_bridge.position = Vector3(0.0, 0.255, 0.22)
	_head.add_child(gl_l)
	_head.add_child(gl_r)
	_head.add_child(gl_bridge)

	# Optional Headwear Groups
	_hard_hat_grp = Node3D.new()
	var hat_m := _mat("#f2b824", 0.34, 0.12)
	var hat_dome := _sphere(0.242, hat_m)
	hat_dome.scale = Vector3(1.0, 0.65, 1.05)
	hat_dome.position = Vector3(0.0, 0.34, 0.0)
	var hat_brim := _cyl(0.258, 0.27, 0.026, hat_m)
	hat_brim.position = Vector3(0.0, 0.288, 0.045)
	_hard_hat_grp.add_child(hat_dome)
	_hard_hat_grp.add_child(hat_brim)
	_hard_hat_grp.visible = false
	_head.add_child(_hard_hat_grp)

	_gandhi_cap_grp = Node3D.new()
	var cap_m := _mat("#f4f0e6", 0.82, 0.0)
	var cap_b := _cyl(0.11, 0.15, 0.13, cap_m)
	cap_b.scale = Vector3(0.75, 1.0, 1.55)
	cap_b.position = Vector3(0.0, 0.42, 0.01)
	_gandhi_cap_grp.add_child(cap_b)
	_gandhi_cap_grp.visible = false
	_head.add_child(_gandhi_cap_grp)

	_turban_grp = Node3D.new()
	var tur_m := _mat("#e87722", 0.65, 0.0)
	var tur_r := _torus(0.15, 0.28, tur_m)
	tur_r.position = Vector3(0.0, 0.365, 0.0)
	_turban_grp.add_child(tur_r)
	_turban_grp.visible = false
	_head.add_child(_turban_grp)

	# Arms
	var arms := _build_arm(-1.0, m_skin, m_trim)
	_arm_l = arms[0]
	_forearm_l = arms[1]
	var arms_r := _build_arm(1.0, m_skin, m_trim)
	_arm_r = arms_r[0]
	_forearm_r = arms_r[1]

	# Legs
	var legs_l := _build_leg(-1.0, m_sole)
	_leg_l = legs_l[0]
	_shin_l = legs_l[1]
	var legs_r := _build_leg(1.0, m_sole)
	_leg_r = legs_r[0]
	_shin_r = legs_r[1]

	# Surge Aura & Ground Contact Shadow + Shockwave
	_mat_aura = _mat("#f5b841", 0.3, 0.0, "#f5b841", 1.2)
	_mat_aura.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	_surge_aura = _torus(0.66, 0.76, _mat_aura)
	_surge_aura.position = Vector3(0.0, -0.35, 0.0)
	_surge_aura.visible = false
	add_child(_surge_aura)

	var mat_sh := StandardMaterial3D.new()
	mat_sh.albedo_color = Color(0.0, 0.0, 0.0, 0.46)
	mat_sh.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat_sh.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	var sh_c := CylinderMesh.new()
	sh_c.top_radius = 0.65
	sh_c.bottom_radius = 0.65
	sh_c.height = 0.02
	_contact_shadow = MeshInstance3D.new()
	_contact_shadow.mesh = sh_c
	_contact_shadow.material_override = mat_sh
	_contact_shadow.top_level = true
	add_child(_contact_shadow)

	_mat_wave = StandardMaterial3D.new()
	_mat_wave.albedo_color = Color(0.95, 0.55, 0.16, 0.72)
	_mat_wave.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	_mat_wave.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	_shockwave_ring = _torus(0.45, 0.65, _mat_wave)
	_shockwave_ring.position = Vector3(0.0, 0.03, 0.0)
	_shockwave_ring.visible = false
	_contact_shadow.add_child(_shockwave_ring)


func _build_arm(side: float, m_skin: Material, m_trim: Material) -> Array:
	var arm := Node3D.new()
	arm.position = Vector3(side * 0.295, 0.495, 0.0)
	var upper := _cyl(0.068, 0.058, 0.26, _mat_kurta)
	upper.position = Vector3(0.0, -0.125, 0.0)
	arm.add_child(upper)

	var forearm := Node3D.new()
	forearm.position = Vector3(0.0, -0.25, 0.0)
	var fmesh := _cyl(0.056, 0.046, 0.24, _mat_kurta)
	fmesh.position = Vector3(0.0, -0.11, 0.0)
	var cuff := _cyl(0.052, 0.052, 0.032, m_trim)
	cuff.position = Vector3(0.0, -0.215, 0.0)
	var hand := _sphere(0.05, m_skin)
	hand.position = Vector3(0.0, -0.255, 0.0)
	forearm.add_child(fmesh)
	forearm.add_child(cuff)
	forearm.add_child(hand)
	arm.add_child(forearm)
	_torso.add_child(arm)
	return [arm, forearm]


func _build_leg(side: float, m_sole: Material) -> Array:
	var leg := Node3D.new()
	leg.position = Vector3(side * 0.125, -0.05, 0.0)
	var thigh := _cyl(0.086, 0.072, 0.34, _mat_trouser)
	thigh.position = Vector3(0.0, -0.165, 0.0)
	leg.add_child(thigh)

	var shin := Node3D.new()
	shin.position = Vector3(0.0, -0.34, 0.0)
	var smesh := _cyl(0.07, 0.054, 0.34, _mat_trouser)
	smesh.position = Vector3(0.0, -0.165, 0.0)
	var shoe := _box(Vector3(0.112, 0.075, 0.24), _mat_shoe)
	shoe.position = Vector3(0.0, -0.355, 0.045)
	var sole := _box(Vector3(0.116, 0.024, 0.25), m_sole)
	sole.position = Vector3(0.0, -0.388, 0.045)
	shin.add_child(smesh)
	shin.add_child(shoe)
	shin.add_child(sole)
	leg.add_child(shin)
	_hips.add_child(leg)
	return [leg, shin]


func _intersect_sphere_obb(sc: Vector3, r: float, bc: Vector3, bs: Vector3, rot: Vector3) -> Dictionary:
	var rel := sc - bc
	var has_rot := rot.x != 0.0 or rot.y != 0.0 or rot.z != 0.0
	var local := _inv_rotate_xyz(rel, rot) if has_rot else rel
	var hx := bs.x * 0.5
	var hy := bs.y * 0.5
	var hz := bs.z * 0.5
	var cx := clampf(local.x, -hx, hx)
	var cy := clampf(local.y, -hy, hy)
	var cz := clampf(local.z, -hz, hz)
	var dx := local.x - cx
	var dy := local.y - cy
	var dz := local.z - cz
	var dist_sq := dx * dx + dy * dy + dz * dz
	if dist_sq > r * r:
		return {"hit": false}

	var l_norm := Vector3.UP
	var pen := 0.0
	if dist_sq > 1e-8:
		var dist := sqrt(dist_sq)
		l_norm = Vector3(dx / dist, dy / dist, dz / dist)
		pen = r - dist
	else:
		var px := hx - absf(local.x)
		var py := hy - absf(local.y)
		var pz := hz - absf(local.z)
		if py <= px and py <= pz:
			l_norm = Vector3(0.0, 1.0 if local.y >= 0.0 else -1.0, 0.0)
			pen = r + py
		elif px <= pz:
			l_norm = Vector3(1.0 if local.x >= 0.0 else -1.0, 0.0, 0.0)
			pen = r + px
		else:
			l_norm = Vector3(0.0, 0.0, 1.0 if local.z >= 0.0 else -1.0)
			pen = r + pz

	var w_norm := _rotate_xyz(l_norm, rot).normalized() if has_rot else l_norm
	var w_closest := bc + (_rotate_xyz(Vector3(cx, cy, cz), rot) if has_rot else Vector3(cx, cy, cz))
	return {"hit": true, "normal": w_norm, "penetration": pen, "closestPoint": w_closest}


func _is_point_inside_box(pt: Vector3, bc: Vector3, bs: Vector3, rot: Vector3) -> bool:
	var rel := pt - bc
	var has_rot := rot.x != 0.0 or rot.y != 0.0 or rot.z != 0.0
	var local := _inv_rotate_xyz(rel, rot) if has_rot else rel
	return absf(local.x) <= bs.x * 0.5 and absf(local.y) <= bs.y * 0.5 and absf(local.z) <= bs.z * 0.5


func _rotate_xyz(v: Vector3, rot: Vector3) -> Vector3:
	var cx := cos(rot.x); var sx := sin(rot.x)
	var cy := cos(rot.y); var sy := sin(rot.y)
	var cz := cos(rot.z); var sz := sin(rot.z)
	var y1 := v.y * cx - v.z * sx
	var z1 := v.y * sx + v.z * cx
	var x1 := v.x
	var x2 := x1 * cy + z1 * sy
	var z2 := -x1 * sy + z1 * cy
	var y2 := y1
	return Vector3(x2 * cz - y2 * sz, x2 * sz + y2 * cz, z2)


func _inv_rotate_xyz(v: Vector3, rot: Vector3) -> Vector3:
	var cx := cos(-rot.x); var sx := sin(-rot.x)
	var cy := cos(-rot.y); var sy := sin(-rot.y)
	var cz := cos(-rot.z); var sz := sin(-rot.z)
	var x1 := v.x * cz - v.y * sz
	var y1 := v.x * sz + v.y * cz
	var z1 := v.z
	var x2 := x1 * cy + z1 * sy
	var z2 := -x1 * sy + z1 * cy
	var y2 := y1
	return Vector3(x2, y2 * cx - z2 * sx, y2 * sx + z2 * cx)


func _mat(hex: String, rough: float, metal: float, em_hex := "", em_e := 0.0) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = Color.html(hex)
	m.roughness = rough
	m.metallic = metal
	if em_hex != "":
		m.emission_enabled = true
		m.emission = Color.html(em_hex)
		m.emission_energy_multiplier = em_e
	return m


func _box(sz: Vector3, mat: Material) -> MeshInstance3D:
	var b := BoxMesh.new()
	b.size = sz
	var m := MeshInstance3D.new()
	m.mesh = b
	m.material_override = mat
	return m


func _cyl(r_top: float, r_bot: float, h: float, mat: Material) -> MeshInstance3D:
	var c := CylinderMesh.new()
	c.top_radius = r_top
	c.bottom_radius = r_bot
	c.height = h
	var m := MeshInstance3D.new()
	m.mesh = c
	m.material_override = mat
	return m


func _sphere(r: float, mat: Material) -> MeshInstance3D:
	var s := SphereMesh.new()
	s.radius = r
	s.height = r * 2.0
	var m := MeshInstance3D.new()
	m.mesh = s
	m.material_override = mat
	return m


func _capsule(r: float, h: float, mat: Material) -> MeshInstance3D:
	var c := CapsuleMesh.new()
	c.radius = r
	c.height = h
	var m := MeshInstance3D.new()
	m.mesh = c
	m.material_override = mat
	return m


func _torus(r_in: float, r_out: float, mat: Material) -> MeshInstance3D:
	var t := TorusMesh.new()
	t.inner_radius = r_in
	t.outer_radius = r_out
	var m := MeshInstance3D.new()
	m.mesh = t
	m.material_override = mat
	return m
