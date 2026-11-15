extends Node3D
class_name PowerUpSystem

## Manages Checkpoints, Paired Portals, Bridge Switches [E], and Finish Gate Inauguration Arch.

var checkpoints: Array[Dictionary] = []
var portals: Array[Dictionary] = []
var switches: Array[Dictionary] = []
var finish_ring: MeshInstance3D = null
var finish_pos := Vector3.ZERO

var active_spawn := Vector3.ZERO
var active_label := "Launch Deck"
var active_gravity_inverted := false
var active_cp_index := 0
var _portal_cooldown := 0.0


func build_level_features(level: Dictionary, theme: Dictionary) -> void:
	for c in get_children():
		c.queue_free()
	checkpoints.clear()
	portals.clear()
	switches.clear()
	finish_ring = null
	_portal_cooldown = 0.0

	var spawn := _v3(level.get("spawn", {}))
	active_spawn = spawn
	active_label = "Launch Deck"
	active_gravity_inverted = false
	active_cp_index = 0

	var mat_steel := StandardMaterial3D.new()
	mat_steel.albedo_color = Color("#3b4048")
	mat_steel.roughness = 0.46
	mat_steel.metallic = 0.72

	var mat_frame := StandardMaterial3D.new()
	mat_frame.albedo_color = Color("#2c3138")
	mat_frame.roughness = 0.72

	# 1. Checkpoints
	for cp_v in level.get("checkpoints", []):
		if typeof(cp_v) != TYPE_DICTIONARY:
			continue
		var cp: Dictionary = cp_v
		var pos := _v3(cp.get("position", {}))
		var grp := Node3D.new()
		grp.position = pos + Vector3(0.0, 0.03, 0.0)
		add_child(grp)

		var base_c := CylinderMesh.new()
		base_c.top_radius = 0.85
		base_c.bottom_radius = 1.05
		base_c.height = 0.22
		var base_m := MeshInstance3D.new()
		base_m.mesh = base_c
		base_m.material_override = mat_steel
		grp.add_child(base_m)

		var b_mat := StandardMaterial3D.new()
		b_mat.albedo_color = Color("#6b7785")
		b_mat.emission_enabled = true
		b_mat.emission = Color("#384654")
		b_mat.emission_energy_multiplier = 0.45

		var pil_c := CylinderMesh.new()
		pil_c.top_radius = 0.08
		pil_c.bottom_radius = 0.12
		pil_c.height = 2.2
		var pil_m := MeshInstance3D.new()
		pil_m.mesh = pil_c
		pil_m.material_override = b_mat
		pil_m.position = Vector3(0.0, 1.1, 0.0)
		grp.add_child(pil_m)

		var orb_s := SphereMesh.new()
		orb_s.radius = 0.2
		orb_s.height = 0.4
		var orb_m := MeshInstance3D.new()
		orb_m.mesh = orb_s
		orb_m.material_override = b_mat
		orb_m.position = Vector3(0.0, 2.3, 0.0)
		grp.add_child(orb_m)

		checkpoints.append({
			"def": cp,
			"pos": pos,
			"beaconMat": b_mat,
			"activated": false
		})

	# 2. Switches [E]
	for sw_v in level.get("switches", []):
		if typeof(sw_v) != TYPE_DICTIONARY:
			continue
		var sw: Dictionary = sw_v
		var pos := _v3(sw.get("position", {}))
		var grp := Node3D.new()
		grp.position = pos
		add_child(grp)

		var ped_c := CylinderMesh.new()
		ped_c.top_radius = 0.45
		ped_c.bottom_radius = 0.55
		ped_c.height = 0.9
		var ped_m := MeshInstance3D.new()
		ped_m.mesh = ped_c
		ped_m.material_override = mat_steel
		ped_m.position = Vector3(0.0, 0.45, 0.0)
		grp.add_child(ped_m)

		var c_mat := StandardMaterial3D.new()
		c_mat.albedo_color = Color("#d96b38")
		c_mat.emission_enabled = true
		c_mat.emission = Color("#b5461b")
		c_mat.emission_energy_multiplier = 0.7

		var lever_s := PrismMesh.new()
		lever_s.size = Vector3(0.55, 0.65, 0.55)
		var lever_m := MeshInstance3D.new()
		lever_m.mesh = lever_s
		lever_m.material_override = c_mat
		lever_m.position = Vector3(0.0, 1.25, 0.0)
		grp.add_child(lever_m)

		switches.append({
			"def": sw,
			"pos": pos,
			"crystalMat": c_mat,
			"activated": false
		})

	# 3. Paired Portals
	for pt_v in level.get("portals", []):
		if typeof(pt_v) != TYPE_DICTIONARY:
			continue
		var pt: Dictionary = pt_v
		var a_pos := _v3(pt.get("aPos", {}))
		var b_pos := _v3(pt.get("bPos", {}))
		var a_n := _v3(pt.get("aNormal", {"z": 1}))
		var b_n := _v3(pt.get("bNormal", {"z": 1}))
		_spawn_portal_gate(a_pos, a_n, str(pt.get("colorA", "#e59a3c")), mat_frame)
		_spawn_portal_gate(b_pos, b_n, str(pt.get("colorB", "#48b8d0")), mat_frame)
		portals.append({
			"def": pt,
			"aPos": a_pos,
			"bPos": b_pos,
			"aNormal": a_n.normalized() if a_n.length() > 0.001 else Vector3.BACK,
			"bNormal": b_n.normalized() if b_n.length() > 0.001 else Vector3.BACK,
			"boost": float(pt.get("boost", 1.1))
		})

	# 4. Finish Gate Arch
	finish_pos = _v3(level.get("finishPosition", {}))
	var fin_grp := Node3D.new()
	fin_grp.position = finish_pos
	add_child(fin_grp)

	var mat_arch := StandardMaterial3D.new()
	mat_arch.albedo_color = Color("#d43a2f")
	mat_arch.roughness = 0.65

	var mat_banner := StandardMaterial3D.new()
	mat_banner.albedo_color = Color("#156c3b")
	mat_banner.roughness = 0.55

	var mat_ribbon := StandardMaterial3D.new()
	mat_ribbon.albedo_color = Color("#e59a3c")
	mat_ribbon.emission_enabled = true
	mat_ribbon.emission = Color("#e59a3c")
	mat_ribbon.emission_energy_multiplier = 0.5

	var mat_gold := StandardMaterial3D.new()
	mat_gold.albedo_color = Color("#f5b832")
	mat_gold.metallic = 0.85
	mat_gold.roughness = 0.22
	mat_gold.emission_enabled = true
	mat_gold.emission = Color("#a86b14")
	mat_gold.emission_energy_multiplier = 0.38

	for sx in [-2.9, 2.9]:
		var pil := _box(Vector3(0.62, 5.9, 0.78), mat_arch)
		pil.position = Vector3(sx, 2.95, 0.0)
		fin_grp.add_child(pil)

	var banner := _box(Vector3(6.6, 1.8, 0.35), mat_banner)
	banner.position = Vector3(0.0, 5.7, 0.0)
	fin_grp.add_child(banner)

	var banner_lbl := Label3D.new()
	banner_lbl.text = "%s\nFINISH GATE" % str(level.get("highwayLabel", "NH-BOUNCE"))
	banner_lbl.pixel_size = 0.018
	banner_lbl.font_size = 34
	banner_lbl.modulate = Color("#f8fafc")
	banner_lbl.position = Vector3(0.0, 5.7, 0.20)
	fin_grp.add_child(banner_lbl)

	var ribbon := _box(Vector3(5.3, 0.25, 0.08), mat_ribbon)
	ribbon.position = Vector3(0.0, 1.4, 0.0)
	fin_grp.add_child(ribbon)

	var torus := TorusMesh.new()
	torus.inner_radius = 1.28
	torus.outer_radius = 1.48
	finish_ring = MeshInstance3D.new()
	finish_ring.mesh = torus
	finish_ring.material_override = mat_gold
	finish_ring.rotation.x = PI * 0.5
	finish_ring.position = Vector3(0.0, 2.5, 0.0)
	fin_grp.add_child(finish_ring)

	# 5. Start Highway Overhead Gantry Sign
	var p_list: Array = level.get("platforms", [])
	var first_deck: Dictionary = p_list[0] if not p_list.is_empty() else {}
	for p in p_list:
		if str(p.get("kind", "")) == "solid" and float(p.get("size", {}).get("x", 0)) >= 4.0 and float(p.get("size", {}).get("z", 0)) >= 5.0:
			first_deck = p
			break
	var fd_pos := _v3(first_deck.get("position", {}))
	var fd_sz := _v3(first_deck.get("size", {"x": 8, "y": 1, "z": 16}))
	var gantry_y := fd_pos.y + fd_sz.y * 0.5 + 6.75
	var span_half := maxf(4.4, fd_sz.x * 0.5 - 0.2)
	var gantry_z := fd_pos.z - minf(4.0, fd_sz.z * 0.25)

	var g_grp := Node3D.new()
	g_grp.position = Vector3(fd_pos.x, gantry_y, gantry_z)
	add_child(g_grp)
	for sx in [-span_half, span_half]:
		var g_post := CylinderMesh.new()
		g_post.top_radius = 0.16
		g_post.bottom_radius = 0.20
		g_post.height = 7.4
		var pm := MeshInstance3D.new()
		pm.mesh = g_post
		pm.material_override = mat_steel
		pm.position = Vector3(sx, -3.05, 0.0)
		g_grp.add_child(pm)
	var beam := _box(Vector3(span_half * 2.0 + 0.6, 0.34, 0.3), mat_steel)
	beam.position = Vector3(0.0, 0.65, -0.22)
	g_grp.add_child(beam)
	var board := _box(Vector3(minf(7.8, span_half * 2.0 - 0.6), 2.1, 0.2), mat_banner)
	board.position = Vector3(0.0, 0.05, 0.14)
	g_grp.add_child(board)
	var sign_lbl := Label3D.new()
	sign_lbl.text = "%s\nWORLD %d · %s" % [str(level.get("name", "STAGE")), int(level.get("worldId", 1)), str(theme.get("subtitle", ""))]
	sign_lbl.pixel_size = 0.015
	sign_lbl.font_size = 32
	sign_lbl.modulate = Color("#f8fafc")
	sign_lbl.position = Vector3(0.0, 0.05, 0.27)
	g_grp.add_child(sign_lbl)


func reset_state(level: Dictionary) -> void:
	active_spawn = _v3(level.get("spawn", {}))
	active_label = "Launch Deck"
	active_gravity_inverted = false
	active_cp_index = 0
	_portal_cooldown = 0.0
	for cp in checkpoints:
		cp["activated"] = false
		var b_mat: StandardMaterial3D = cp["beaconMat"]
		b_mat.albedo_color = Color("#6b7785")
		b_mat.emission = Color("#384654")
		b_mat.emission_energy_multiplier = 0.45
	for sw in switches:
		sw["activated"] = false
		var c_mat: StandardMaterial3D = sw["crystalMat"]
		c_mat.albedo_color = Color("#d96b38")
		c_mat.emission = Color("#b5461b")


func update_animations(real_time: float) -> void:
	if finish_ring != null:
		finish_ring.rotation.y = real_time * 1.1


func check_checkpoints(player_pos: Vector3, grav_inverted: bool, accent_hex: String) -> Variant:
	for cp in checkpoints:
		if bool(cp["activated"]):
			continue
		var p: Vector3 = cp["pos"]
		if player_pos.distance_to(p + Vector3(0.0, 0.8, 0.0)) < 2.2:
			cp["activated"] = true
			var b_mat: StandardMaterial3D = cp["beaconMat"]
			var acc := Color.html(accent_hex)
			b_mat.albedo_color = acc
			b_mat.emission = acc
			b_mat.emission_energy_multiplier = 0.9
			var def: Dictionary = cp["def"]
			var idx := int(def.get("index", 0))
			if idx >= active_cp_index:
				active_cp_index = idx
				active_spawn = Vector3(p.x, p.y + (-1.1 if grav_inverted else 1.1), p.z)
				active_label = str(def.get("label", "Checkpoint"))
				active_gravity_inverted = grav_inverted
			return active_label
	return null


func check_switches(player_pos: Vector3, interact_pressed: bool) -> Dictionary:
	var prompt: Variant = null
	var activated_id := ""
	for sw in switches:
		if bool(sw["activated"]):
			continue
		var p: Vector3 = sw["pos"]
		if player_pos.distance_to(p + Vector3(0.0, 0.8, 0.0)) < 3.2:
			var def: Dictionary = sw["def"]
			prompt = str(def.get("label", "Activate Switch"))
			if interact_pressed:
				sw["activated"] = true
				var c_mat: StandardMaterial3D = sw["crystalMat"]
				c_mat.albedo_color = Color("#58c477")
				c_mat.emission = Color("#2d8a4b")
				activated_id = str(def.get("id", ""))
	return {"prompt": prompt, "activatedId": activated_id}


func check_portals(dt: float, player_pos: Vector3, player_vel: Vector3) -> Dictionary:
	if _portal_cooldown > 0.0:
		_portal_cooldown = maxf(0.0, _portal_cooldown - dt)
		return {"teleported": false, "pos": player_pos, "vel": player_vel}
	for pt in portals:
		var a_pos: Vector3 = pt["aPos"]
		var b_pos: Vector3 = pt["bPos"]
		var boost := float(pt["boost"])
		if player_pos.distance_to(a_pos) < 1.65:
			var out_n: Vector3 = pt["bNormal"]
			var out_spd := maxf(11.5, player_vel.length() * boost)
			_portal_cooldown = 0.55
			return {"teleported": true, "pos": b_pos + out_n * 2.1, "vel": out_n * out_spd}
		if player_pos.distance_to(b_pos) < 1.65:
			var out_n: Vector3 = pt["aNormal"]
			var out_spd := maxf(11.5, player_vel.length() * boost)
			_portal_cooldown = 0.55
			return {"teleported": true, "pos": a_pos + out_n * 2.1, "vel": out_n * out_spd}
	return {"teleported": false, "pos": player_pos, "vel": player_vel}


func is_at_finish(player_pos: Vector3) -> bool:
	return player_pos.distance_to(finish_pos + Vector3(0.0, 1.5, 0.0)) < 2.6


func _spawn_portal_gate(pos: Vector3, normal: Vector3, color_hex: String, frame_mat: Material) -> void:
	var g := Node3D.new()
	g.position = pos
	add_child(g)
	var n := normal.normalized() if normal.length() > 0.001 else Vector3.BACK
	if absf(n.dot(Vector3.UP)) < 0.99:
		g.look_at(pos + n, Vector3.UP)

	var ring := TorusMesh.new()
	ring.inner_radius = 1.58
	ring.outer_radius = 1.88
	var r_mi := MeshInstance3D.new()
	r_mi.mesh = ring
	r_mi.material_override = frame_mat
	r_mi.rotation.x = PI * 0.5
	g.add_child(r_mi)

	var disc := CylinderMesh.new()
	disc.top_radius = 1.58
	disc.bottom_radius = 1.58
	disc.height = 0.06
	var d_mat := StandardMaterial3D.new()
	var c := Color.html(color_hex)
	d_mat.albedo_color = Color(c.r, c.g, c.b, 0.58)
	d_mat.emission_enabled = true
	d_mat.emission = c
	d_mat.emission_energy_multiplier = 1.1
	d_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	var d_mi := MeshInstance3D.new()
	d_mi.mesh = disc
	d_mi.material_override = d_mat
	d_mi.rotation.x = PI * 0.5
	g.add_child(d_mi)


func _box(sz: Vector3, mat: Material) -> MeshInstance3D:
	var b := BoxMesh.new()
	b.size = sz
	var m := MeshInstance3D.new()
	m.mesh = b
	m.material_override = mat
	return m


func _v3(d: Variant) -> Vector3:
	if typeof(d) != TYPE_DICTIONARY:
		return Vector3.ZERO
	return Vector3(float(d.get("x", 0.0)), float(d.get("y", 0.0)), float(d.get("z", 0.0)))
