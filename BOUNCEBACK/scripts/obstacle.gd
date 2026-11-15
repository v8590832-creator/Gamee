extends Node3D
class_name ObstacleSystem

## Living Indian Highway Traffic (Auto-Rickshaw, Truck, Bus, Sedan) + Special Boss Encounter Rig Manager.

var traffic_list: Array[Dictionary] = []
var boss_data: Dictionary = {}

var _mat_rubber: StandardMaterial3D
var _mat_rim: StandardMaterial3D
var _mat_glass: StandardMaterial3D
var _mat_chrome: StandardMaterial3D
var _mat_headlight: StandardMaterial3D
var _mat_taillight: StandardMaterial3D
var _mat_trim: StandardMaterial3D
var _mat_auto_green: StandardMaterial3D
var _mat_auto_yellow: StandardMaterial3D
var _mat_truck_cab: StandardMaterial3D
var _mat_truck_cargo: StandardMaterial3D
var _mat_bus_red: StandardMaterial3D
var _mat_bus_cream: StandardMaterial3D
var _mat_car: StandardMaterial3D
var _mat_boss_red: StandardMaterial3D


func build_obstacles(level: Dictionary) -> void:
	for c in get_children():
		c.queue_free()
	traffic_list.clear()
	boss_data.clear()
	_init_materials()

	var lanes: Array = level.get("trafficLanes", [])
	for l_var in lanes:
		if typeof(l_var) != TYPE_DICTIONARY:
			continue
		var lane: Dictionary = l_var
		var x_min := float(lane.get("xMin", -20.0))
		var x_max := float(lane.get("xMax", 20.0))
		var span := x_max - x_min
		var count := maxi(1, int(lane.get("count", 1)))
		var dir := int(lane.get("direction", 1))
		var lane_y := float(lane.get("y", 0.0))
		var lane_z := float(lane.get("z", 0.0))
		var kind := str(lane.get("vehicleKind", "car"))

		for i in range(count):
			var built := _build_vehicle(kind)
			var grp: Node3D = built["group"]
			var v_size: Vector3 = built["size"]
			var wheels: Array = built["wheels"]
			grp.rotation.y = PI * 0.5 if dir > 0 else -PI * 0.5
			var start_x := x_min + (float(i) / float(count)) * span
			grp.position = Vector3(start_x, lane_y, lane_z)
			add_child(grp)
			traffic_list.append({
				"lane": lane,
				"group": grp,
				"wheels": wheels,
				"pos": Vector3(start_x, lane_y + v_size.y * 0.5, lane_z),
				"size": Vector3(v_size.z, v_size.y, v_size.x),
				"bounceTop": lane.get("bounceTop", true) != false,
				"honkedCooldown": 0.0
			})

	if level.has("boss") and typeof(level["boss"]) == TYPE_DICTIONARY and not level["boss"].is_empty():
		var b_def: Dictionary = level["boss"]
		var b_pos := _v3(b_def.get("position", {}))
		var b_kind := str(b_def.get("kind", "giant_roller"))
		var b_grp := Node3D.new()
		b_grp.position = b_pos
		var b_size := Vector3(5.0, 2.8, 4.8)

		if b_kind == "mega_crane":
			var mast := _box(Vector3(1.4, 14.0, 1.4), _mat_truck_cab)
			mast.position = Vector3(0.0, 4.0, 0.0)
			var boom := _box(Vector3(14.0, 1.0, 1.2), _mat_auto_yellow)
			boom.position = Vector3(0.0, 2.0, 0.0)
			var cab := _box(Vector3(2.0, 1.6, 1.8), _mat_trim)
			cab.position = Vector3(1.2, 3.0, 0.0)
			b_grp.add_child(mast)
			b_grp.add_child(boom)
			b_grp.add_child(cab)
			b_size = Vector3(13.5, 2.2, 2.0)
		else:
			var chassis := _box(Vector3(4.4, 2.2, 4.4), _mat_auto_yellow)
			chassis.position = Vector3(0.0, 0.6, 0.0)
			var drum_c := CylinderMesh.new()
			drum_c.top_radius = 1.5
			drum_c.bottom_radius = 1.5
			drum_c.height = 5.2
			drum_c.radial_segments = 20
			var drum := MeshInstance3D.new()
			drum.mesh = drum_c
			drum.material_override = _mat_rim
			drum.rotation.z = PI * 0.5
			drum.position = Vector3(0.0, 0.1, 1.8)
			var cab := _box(Vector3(2.8, 1.4, 2.2), _mat_trim)
			cab.position = Vector3(0.0, 2.1, -0.4)
			var beacon_s := SphereMesh.new()
			beacon_s.radius = 0.45
			beacon_s.height = 0.9
			var beacon := MeshInstance3D.new()
			beacon.mesh = beacon_s
			beacon.material_override = _mat_boss_red
			beacon.position = Vector3(0.0, 3.05, 0.0)
			b_grp.add_child(chassis)
			b_grp.add_child(drum)
			b_grp.add_child(cab)
			b_grp.add_child(beacon)

		add_child(b_grp)
		boss_data = {
			"def": b_def,
			"group": b_grp,
			"basePos": b_pos,
			"pos": b_pos,
			"size": b_size,
			"phase": 0.0
		}


func update_obstacles(dt: float) -> void:
	for tv in traffic_list:
		var lane: Dictionary = tv["lane"]
		var x_min := float(lane.get("xMin", -20.0))
		var x_max := float(lane.get("xMax", 20.0))
		var span := x_max - x_min
		var dir := int(lane.get("direction", 1))
		var spd := float(lane.get("speed", 6.0))
		var pos: Vector3 = tv["pos"]
		pos.x += float(dir) * spd * dt
		if dir > 0 and pos.x > x_max:
			pos.x -= span
		elif dir < 0 and pos.x < x_min:
			pos.x += span
		tv["pos"] = pos
		(tv["group"] as Node3D).position.x = pos.x

		for w in tv["wheels"]:
			(w as Node3D).rotation.x += spd * dt * 2.4

		var hc := float(tv["honkedCooldown"])
		if hc > 0.0:
			tv["honkedCooldown"] = maxf(0.0, hc - dt)

	if not boss_data.is_empty():
		var b_def: Dictionary = boss_data["def"]
		var phase := float(boss_data["phase"]) + float(b_def.get("speed", 2.0)) * dt * 0.45
		boss_data["phase"] = phase
		var base_pos: Vector3 = boss_data["basePos"]
		var p_width := float(b_def.get("patrolWidth", 5.0))
		var b_pos: Vector3 = boss_data["pos"]
		b_pos.x = base_pos.x + sin(phase) * p_width
		boss_data["pos"] = b_pos
		var b_grp: Node3D = boss_data["group"]
		b_grp.position.x = b_pos.x
		if str(b_def.get("kind", "")) == "mega_crane":
			b_grp.rotation.y = sin(phase * 0.8) * 1.1


static func intersect_vehicle(player_pos: Vector3, radius: float, v_center: Vector3, v_size: Vector3) -> Dictionary:
	var hx := v_size.x * 0.5 + radius
	var hy := v_size.y * 0.5 + radius
	var hz := v_size.z * 0.5 + radius
	var dx := player_pos.x - v_center.x
	var dy := player_pos.y - v_center.y
	var dz := player_pos.z - v_center.z
	if absf(dx) > hx or absf(dy) > hy or absf(dz) > hz:
		return {"hit": false, "isTopLanding": false, "pushOut": Vector3.ZERO}
	var is_top := dy > v_size.y * 0.25
	if is_top:
		return {"hit": true, "isTopLanding": true, "pushOut": Vector3(0.0, hy - dy, 0.0)}
	var push_z := (hz - dz) if dz >= 0.0 else -(hz + dz)
	return {"hit": true, "isTopLanding": false, "pushOut": Vector3(0.0, 0.4, push_z)}


func _build_vehicle(kind: String) -> Dictionary:
	var g := Node3D.new()
	var wheels: Array = []

	if kind == "auto":
		var tub := _box(Vector3(1.42, 0.62, 2.05), _mat_auto_green)
		tub.position = Vector3(0.0, 0.52, -0.05)
		var canopy := _box(Vector3(1.46, 0.72, 1.75), _mat_auto_yellow)
		canopy.position = Vector3(0.0, 1.18, -0.18)
		var shield := _box(Vector3(1.16, 0.52, 0.08), _mat_glass)
		shield.position = Vector3(0.0, 1.15, 0.75)
		shield.rotation.x = -0.22
		var bumper := _box(Vector3(1.48, 0.12, 0.14), _mat_chrome)
		bumper.position = Vector3(0.0, 0.34, 1.24)
		var lamp := _box(Vector3(0.22, 0.18, 0.12), _mat_headlight)
		lamp.position = Vector3(0.0, 0.66, 1.28)
		g.add_child(tub)
		g.add_child(canopy)
		g.add_child(shield)
		g.add_child(bumper)
		g.add_child(lamp)
		for wp in [Vector3(0.0, 0.27, 1.0), Vector3(-0.66, 0.28, -0.68), Vector3(0.66, 0.28, -0.68)]:
			var w := _make_wheel(0.76)
			w.position = wp
			g.add_child(w)
			wheels.append(w)
		return {"group": g, "size": Vector3(1.55, 1.65, 2.35), "wheels": wheels}

	if kind == "truck":
		var chassis := _box(Vector3(2.15, 0.26, 5.3), _mat_trim)
		chassis.position = Vector3(0.0, 0.52, -0.1)
		var cab := _box(Vector3(2.26, 1.55, 1.65), _mat_truck_cab)
		cab.position = Vector3(0.0, 1.38, 1.55)
		var nose := _box(Vector3(2.1, 0.92, 0.65), _mat_truck_cab)
		nose.position = Vector3(0.0, 1.06, 2.52)
		var grille := _box(Vector3(1.5, 0.48, 0.08), _mat_chrome)
		grille.position = Vector3(0.0, 1.02, 2.86)
		var shield := _box(Vector3(1.98, 0.58, 0.08), _mat_glass)
		shield.position = Vector3(0.0, 1.72, 2.38)
		var visor := _box(Vector3(2.3, 0.16, 0.42), _mat_auto_yellow)
		visor.position = Vector3(0.0, 2.15, 2.42)
		visor.rotation.x = 0.2
		var cargo := _box(Vector3(2.42, 1.98, 3.5), _mat_truck_cargo)
		cargo.position = Vector3(0.0, 1.62, -1.08)
		var lamp_l := _box(Vector3(0.32, 0.18, 0.08), _mat_headlight)
		lamp_l.position = Vector3(-0.78, 0.85, 2.86)
		var lamp_r := _box(Vector3(0.32, 0.18, 0.08), _mat_headlight)
		lamp_r.position = Vector3(0.78, 0.85, 2.86)
		for child in [chassis, cab, nose, grille, shield, visor, cargo, lamp_l, lamp_r]:
			g.add_child(child)
		for wp in [Vector3(-1.08, 0.42, 1.9), Vector3(1.08, 0.42, 1.9), Vector3(-1.08, 0.42, -1.85), Vector3(1.08, 0.42, -1.85), Vector3(-1.08, 0.42, -0.75), Vector3(1.08, 0.42, -0.75)]:
			var w := _make_wheel(1.18)
			w.position = wp
			g.add_child(w)
			wheels.append(w)
		return {"group": g, "size": Vector3(2.5, 2.8, 5.7), "wheels": wheels}

	if kind == "bus":
		var hull := _box(Vector3(2.38, 2.15, 6.2), _mat_bus_red)
		hull.position = Vector3(0.0, 1.52, 0.0)
		var band := _box(Vector3(2.42, 0.56, 6.24), _mat_bus_cream)
		band.position = Vector3(0.0, 1.52, 0.0)
		var win := _box(Vector3(2.41, 0.62, 5.6), _mat_glass)
		win.position = Vector3(0.0, 2.02, -0.05)
		var front_g := _box(Vector3(2.05, 0.75, 0.1), _mat_glass)
		front_g.position = Vector3(0.0, 1.95, 3.11)
		var rack := _box(Vector3(2.0, 0.18, 4.6), _mat_trim)
		rack.position = Vector3(0.0, 2.68, -0.2)
		for child in [hull, band, win, front_g, rack]:
			g.add_child(child)
		for wp in [Vector3(-1.12, 0.4, 2.0), Vector3(1.12, 0.4, 2.0), Vector3(-1.12, 0.4, -1.95), Vector3(1.12, 0.4, -1.95)]:
			var w := _make_wheel(1.12)
			w.position = wp
			g.add_child(w)
			wheels.append(w)
		return {"group": g, "size": Vector3(2.45, 2.75, 6.25), "wheels": wheels}

	# Car / Highway Sedan
	var body_l := _box(Vector3(1.88, 0.64, 3.65), _mat_car)
	body_l.position = Vector3(0.0, 0.58, 0.0)
	var cabin := _box(Vector3(1.6, 0.56, 1.85), _mat_car)
	cabin.position = Vector3(0.0, 1.15, -0.18)
	var glass := _box(Vector3(1.63, 0.42, 1.78), _mat_glass)
	glass.position = Vector3(0.0, 1.14, -0.18)
	var lamp_fl := _box(Vector3(0.32, 0.15, 0.08), _mat_headlight)
	lamp_fl.position = Vector3(-0.68, 0.66, 1.84)
	var lamp_fr := _box(Vector3(0.32, 0.15, 0.08), _mat_headlight)
	lamp_fr.position = Vector3(0.68, 0.66, 1.84)
	var tail_l := _box(Vector3(0.34, 0.14, 0.08), _mat_taillight)
	tail_l.position = Vector3(-0.68, 0.68, -1.84)
	var tail_r := _box(Vector3(0.34, 0.14, 0.08), _mat_taillight)
	tail_r.position = Vector3(0.68, 0.68, -1.84)
	for child in [body_l, cabin, glass, lamp_fl, lamp_fr, tail_l, tail_r]:
		g.add_child(child)
	for wp in [Vector3(-0.9, 0.34, 1.12), Vector3(0.9, 0.34, 1.12), Vector3(-0.9, 0.34, -1.12), Vector3(0.9, 0.34, -1.12)]:
		var w := _make_wheel(0.95)
		w.position = wp
		g.add_child(w)
		wheels.append(w)
	return {"group": g, "size": Vector3(1.95, 1.48, 3.7), "wheels": wheels}


func _make_wheel(scale_r: float) -> Node3D:
	var c := CylinderMesh.new()
	c.top_radius = 0.36
	c.bottom_radius = 0.36
	c.height = 0.25
	c.radial_segments = 14
	var tire := MeshInstance3D.new()
	tire.mesh = c
	tire.material_override = _mat_rubber
	tire.rotation.z = PI * 0.5
	tire.scale = Vector3(scale_r, 1.0, scale_r)
	return tire


func _box(sz: Vector3, mat: Material) -> MeshInstance3D:
	var b := BoxMesh.new()
	b.size = sz
	var m := MeshInstance3D.new()
	m.mesh = b
	m.material_override = mat
	return m


func _init_materials() -> void:
	_mat_rubber = _mat("#1b1d22", 0.92, 0.04)
	_mat_rim = _mat("#aeb7c4", 0.30, 0.80)
	_mat_glass = _mat("#223548", 0.10, 0.35)
	_mat_chrome = _mat("#d8e0ea", 0.18, 0.90)
	_mat_headlight = _mat("#fff6d6", 0.20, 0.0, "#ffe699", 0.9)
	_mat_taillight = _mat("#e63939", 0.25, 0.0, "#c82020", 0.8)
	_mat_trim = _mat("#242931", 0.78, 0.22)
	_mat_auto_green = _mat("#1d7842", 0.48, 0.12)
	_mat_auto_yellow = _mat("#efb622", 0.70, 0.04)
	_mat_truck_cab = _mat("#d44824", 0.42, 0.22)
	_mat_truck_cargo = _mat("#c4832d", 0.72, 0.06)
	_mat_bus_red = _mat("#b42b2b", 0.44, 0.18)
	_mat_bus_cream = _mat("#ede6d8", 0.56, 0.06)
	_mat_car = _mat("#d5dde7", 0.28, 0.42)
	_mat_boss_red = _mat("#ef4444", 0.25, 0.0, "#ef4444", 0.95)


func _mat(hex: String, rough := 0.6, metal := 0.1, em_hex := "", em_energy := 0.0) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = Color.html(hex)
	m.roughness = rough
	m.metallic = metal
	if em_hex != "":
		m.emission_enabled = true
		m.emission = Color.html(em_hex)
		m.emission_energy_multiplier = em_energy
	return m


func _v3(d: Variant) -> Vector3:
	if typeof(d) != TYPE_DICTIONARY:
		return Vector3.ZERO
	return Vector3(float(d.get("x", 0.0)), float(d.get("y", 0.0)), float(d.get("z", 0.0)))
