extends Node3D
class_name RoadSystem

## Modular 3D Indian road & platform builder, procedural material generator, and OBB animation controller.

var platforms: Array[Dictionary] = []

var _mat_asphalt: StandardMaterial3D
var _mat_wet_asphalt: StandardMaterial3D
var _mat_concrete: StandardMaterial3D
var _mat_steel: StandardMaterial3D
var _mat_copper: StandardMaterial3D
var _mat_stone: StandardMaterial3D
var _mat_barrier: StandardMaterial3D
var _mat_roller_yellow: StandardMaterial3D
var _mat_cone_orange: StandardMaterial3D
var _mat_white: StandardMaterial3D
var _mat_frame: StandardMaterial3D
var _mat_puddle: StandardMaterial3D


func build_platforms(level: Dictionary, theme: Dictionary) -> void:
	for c in get_children():
		c.queue_free()
	platforms.clear()
	_init_materials(theme)

	var p_defs: Array = level.get("platforms", [])
	var style := str(theme.get("sceneryStyle", "city_site"))
	var accent := Color.html(str(theme.get("accentColor", "#f28c28")))

	for d in p_defs:
		if typeof(d) != TYPE_DICTIONARY:
			continue
		var def: Dictionary = d
		var kind := str(def.get("kind", "solid"))
		var pos := _v3(def.get("position", {}))
		var sz := _v3(def.get("size", {"x": 4, "y": 1, "z": 4}))
		var rot := _v3(def.get("rotation", {}))

		var grp := Node3D.new()
		grp.position = pos
		grp.rotation = rot
		add_child(grp)

		var striker: MeshInstance3D = null

		if kind == "bounce" or kind == "pothole":
			var base_mesh := _make_box_mesh(sz, _mat_asphalt if kind == "pothole" else _mat_frame)
			grp.add_child(base_mesh)

			var plate_cyl := CylinderMesh.new()
			plate_cyl.top_radius = sz.x * 0.42
			plate_cyl.bottom_radius = sz.x * 0.46
			plate_cyl.height = 0.22
			plate_cyl.radial_segments = 18
			striker = MeshInstance3D.new()
			striker.mesh = plate_cyl
			striker.material_override = _mat_copper
			striker.position = Vector3(0.0, sz.y * 0.5 + 0.08, 0.0)
			grp.add_child(striker)

			if kind == "pothole":
				var cx := sz.x * 0.42
				var cz := sz.z * 0.42
				for offset in [Vector2(-cx, -cz), Vector2(cx, -cz), Vector2(-cx, cz), Vector2(cx, cz)]:
					_add_cone(grp, Vector3(offset.x, sz.y * 0.5 + 0.32, offset.y))
		elif kind == "roller":
			var body := _make_box_mesh(Vector3(sz.x * 0.86, sz.y * 0.56, sz.z * 0.72), _mat_roller_yellow)
			body.position = Vector3(0.0, 0.16, 0.0)
			grp.add_child(body)

			var drum_c := CylinderMesh.new()
			drum_c.top_radius = sz.y * 0.54
			drum_c.bottom_radius = sz.y * 0.54
			drum_c.height = sz.x * 0.98
			drum_c.radial_segments = 18
			var front_drum := MeshInstance3D.new()
			front_drum.mesh = drum_c
			front_drum.material_override = _mat_steel
			front_drum.rotation.z = PI * 0.5
			front_drum.position = Vector3(0.0, -0.1, -sz.z * 0.34)
			grp.add_child(front_drum)

			var rear_drum := MeshInstance3D.new()
			rear_drum.mesh = drum_c
			rear_drum.material_override = _mat_steel
			rear_drum.rotation.z = PI * 0.5
			rear_drum.scale = Vector3(0.85, 0.85, 0.85)
			rear_drum.position = Vector3(0.0, -0.1, sz.z * 0.32)
			grp.add_child(rear_drum)

			var cab := _make_box_mesh(Vector3(sz.x * 0.54, 1.05, sz.z * 0.26), _mat_frame)
			cab.position = Vector3(0.0, 0.88, sz.z * 0.14)
			grp.add_child(cab)

			var roof := _make_box_mesh(Vector3(sz.x * 0.62, 0.12, sz.z * 0.34), _mat_roller_yellow)
			roof.position = Vector3(0.0, 1.46, sz.z * 0.14)
			grp.add_child(roof)
		elif kind == "puddle":
			var pud_c := CylinderMesh.new()
			pud_c.top_radius = sz.x * 0.5
			pud_c.bottom_radius = sz.x * 0.52
			pud_c.height = 0.08
			pud_c.radial_segments = 18
			var pud := MeshInstance3D.new()
			pud.mesh = pud_c
			pud.material_override = _mat_puddle
			pud.scale = Vector3(1.0, 1.0, sz.z / maxf(0.1, sz.x))
			grp.add_child(pud)
		elif kind == "gear":
			var radius := sz.x * 0.5
			var gear_c := CylinderMesh.new()
			gear_c.top_radius = radius
			gear_c.bottom_radius = radius
			gear_c.height = sz.y
			gear_c.radial_segments = 24
			var gear_body := MeshInstance3D.new()
			gear_body.mesh = gear_c
			gear_body.material_override = _mat_copper
			grp.add_child(gear_body)

			var hub_c := CylinderMesh.new()
			hub_c.top_radius = radius * 0.35
			hub_c.bottom_radius = radius * 0.38
			hub_c.height = sz.y + 0.18
			hub_c.radial_segments = 14
			var hub := MeshInstance3D.new()
			hub.mesh = hub_c
			hub.material_override = _mat_steel
			grp.add_child(hub)

			for t in range(10):
				var ang := (float(t) / 10.0) * TAU
				var tooth := _make_box_mesh(Vector3(0.95, sz.y * 0.92, 0.85), _mat_steel)
				tooth.position = Vector3(cos(ang) * (radius + 0.3), 0.0, sin(ang) * (radius + 0.3))
				tooth.rotation.y = -ang
				grp.add_child(tooth)
		elif kind == "gravityZone" or kind == "windZone" or kind == "fluidZone":
			var z_col := Color("#48b8d0") if kind == "gravityZone" else (Color("#95d4c2") if kind == "windZone" else Color("#2ea6b5"))
			var z_mat := StandardMaterial3D.new()
			z_mat.albedo_color = Color(z_col.r, z_col.g, z_col.b, 0.22)
			z_mat.emission_enabled = true
			z_mat.emission = z_col
			z_mat.emission_energy_multiplier = 0.28
			z_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
			z_mat.depth_draw_mode = BaseMaterial3D.DEPTH_DRAW_DISABLED
			grp.add_child(_make_box_mesh(sz, z_mat, false))
		elif kind == "wall":
			var bar := _make_box_mesh(sz, _mat_barrier)
			grp.add_child(bar)
			if pos.y > 1.2:
				var leg_l := _make_box_mesh(Vector3(0.28, 3.0, 0.28), _mat_frame)
				leg_l.position = Vector3(-sz.x * 0.48, -1.2, 0.0)
				var leg_r := _make_box_mesh(Vector3(0.28, 3.0, 0.28), _mat_frame)
				leg_r.position = Vector3(sz.x * 0.48, -1.2, 0.0)
				grp.add_child(leg_l)
				grp.add_child(leg_r)
		else:
			var mat := _pick_material(str(def.get("materialStyle", "concrete")))
			var deck := _make_box_mesh(sz, mat)
			grp.add_child(deck)

			if sz.x >= 4.0 and sz.z >= 6.0 and kind == "solid":
				var curb_l := _make_box_mesh(Vector3(0.36, 0.48, sz.z * 0.9), _mat_barrier)
				curb_l.position = Vector3(-sz.x * 0.5 + 0.2, sz.y * 0.5 + 0.24, 0.0)
				var curb_r := _make_box_mesh(Vector3(0.36, 0.48, sz.z * 0.9), _mat_barrier)
				curb_r.position = Vector3(sz.x * 0.5 - 0.2, sz.y * 0.5 + 0.24, 0.0)
				grp.add_child(curb_l)
				grp.add_child(curb_r)

				if style == "city_site" or style == "pothole" or style == "mega_site":
					_add_cone(grp, Vector3(-sz.x * 0.36, sz.y * 0.5 + 0.32, -sz.z * 0.3))

				var pier_off := maxf(1.4, sz.x * 0.35)
				for sx in [-pier_off, pier_off]:
					var pier := _make_box_mesh(Vector3(0.95, 28.0, 0.95), _mat_concrete, false)
					pier.position = Vector3(sx, -14.5, 0.0)
					var cap := _make_box_mesh(Vector3(1.5, 0.75, 1.5), _mat_concrete, false)
					cap.position = Vector3(sx, -0.75, 0.0)
					grp.add_child(pier)
					grp.add_child(cap)

			if kind == "crumbling":
				var c_mat := StandardMaterial3D.new()
				c_mat.albedo_color = accent
				c_mat.emission_enabled = true
				c_mat.emission = accent
				c_mat.emission_energy_multiplier = 0.55
				var c1 := _make_box_mesh(Vector3(sz.x * 0.9, 0.05, 0.14), c_mat, false)
				c1.position = Vector3(0.0, sz.y * 0.5 + 0.02, 0.0)
				c1.rotation.y = 0.42
				var c2 := _make_box_mesh(Vector3(sz.x * 0.9, 0.05, 0.14), c_mat, false)
				c2.position = Vector3(0.0, sz.y * 0.5 + 0.02, 0.0)
				c2.rotation.y = -0.50
				grp.add_child(c1)
				grp.add_child(c2)

			if kind == "bridge" and def.get("startsActive", true) == false:
				grp.visible = false

		platforms.append({
			"def": def,
			"kind": kind,
			"group": grp,
			"striker": striker,
			"padPulse": 0.0,
			"basePos": pos,
			"currentPos": pos,
			"size": sz,
			"rot": rot,
			"currentRotY": rot.y,
			"crumbleState": "intact",
			"crumbleTimer": 0.0,
			"active": (def.get("startsActive", true) != false) if kind == "bridge" else true
		})


func reset_platforms() -> void:
	for p in platforms:
		p["crumbleState"] = "intact"
		p["crumbleTimer"] = 0.0
		p["padPulse"] = 0.0
		p["currentPos"] = p["basePos"]
		p["currentRotY"] = p["rot"].y
		var def: Dictionary = p["def"]
		var kind := str(p["kind"])
		var act: bool = (def.get("startsActive", true) != false) if kind == "bridge" else true
		p["active"] = act
		var grp: Node3D = p["group"]
		grp.position = p["basePos"]
		grp.rotation = p["rot"]
		grp.visible = act


func reset_crumbling() -> void:
	for p in platforms:
		if str(p["kind"]) == "crumbling":
			p["crumbleState"] = "intact"
			p["crumbleTimer"] = 0.0
			var grp: Node3D = p["group"]
			grp.position = p["basePos"]
			grp.visible = true


func activate_bridges_for_switch(switch_id: String) -> void:
	for p in platforms:
		var def: Dictionary = p["def"]
		if str(p["kind"]) == "bridge" and str(def.get("switchId", "")) == switch_id:
			p["active"] = true
			(p["group"] as Node3D).visible = true


func step_crumble_timers(world_dt: float) -> void:
	for p in platforms:
		if str(p["kind"]) != "crumbling":
			continue
		var def: Dictionary = p["def"]
		if p["crumbleState"] == "shaking":
			p["crumbleTimer"] = float(p["crumbleTimer"]) - world_dt
			if float(p["crumbleTimer"]) <= 0.0:
				p["crumbleState"] = "fallen"
				p["crumbleTimer"] = float(def.get("respawnDelay", 3.0))
		elif p["crumbleState"] == "fallen":
			p["crumbleTimer"] = float(p["crumbleTimer"]) - world_dt
			if float(p["crumbleTimer"]) <= 0.0:
				p["crumbleState"] = "intact"


func update_animations(world_time: float, real_time: float, dt: float) -> void:
	for p in platforms:
		var def: Dictionary = p["def"]
		var kind := str(p["kind"])
		var grp: Node3D = p["group"]

		if (kind == "moving" or kind == "roller") and def.has("moveOffset"):
			var mo := _v3(def["moveOffset"])
			var spd := float(def.get("moveSpeed", 1.2))
			var ph := float(def.get("movePhase", 0.0))
			var s := sin(world_time * spd + ph)
			var next_pos: Vector3 = p["basePos"] + mo * s
			p["currentPos"] = next_pos
			grp.position = next_pos

		if kind == "gear":
			var cur_ry := float(p["currentRotY"]) + float(def.get("spinSpeed", 0.65)) * dt
			p["currentRotY"] = cur_ry
			grp.rotation.y = cur_ry

		if kind == "crumbling":
			var st := str(p["crumbleState"])
			if st == "shaking":
				var cp: Vector3 = p["currentPos"]
				grp.position = Vector3(cp.x + sin(real_time * 48.0) * 0.08, cp.y, cp.z + cos(real_time * 44.0) * 0.08)
				grp.visible = true
			elif st == "fallen":
				grp.visible = false
			else:
				grp.position = p["currentPos"]
				grp.visible = true

		if kind == "bridge":
			grp.visible = bool(p["active"])

		var striker: MeshInstance3D = p["striker"]
		if striker != null:
			var pulse := float(p["padPulse"])
			if pulse > 0.0:
				pulse = maxf(0.0, pulse - dt * 3.8)
				p["padPulse"] = pulse
			striker.position.y = float(p["size"].y) * 0.5 + 0.08 + sin(pulse * PI) * 0.25


func _init_materials(theme: Dictionary) -> void:
	var surf_primary := Color.html(str(theme.get("surfacePrimary", "#4a4e57")))
	var surf_secondary := Color.html(str(theme.get("surfaceSecondary", "#2d3138")))
	var style := str(theme.get("sceneryStyle", "city_site"))

	_mat_asphalt = StandardMaterial3D.new()
	_mat_asphalt.albedo_texture = _gen_asphalt_tex(false)
	_mat_asphalt.uv1_triplanar = false
	_mat_asphalt.roughness = 0.88
	_mat_asphalt.metallic = 0.03

	_mat_wet_asphalt = StandardMaterial3D.new()
	_mat_wet_asphalt.albedo_texture = _gen_asphalt_tex(true)
	_mat_wet_asphalt.albedo_color = Color("#cfdbe8")
	_mat_wet_asphalt.roughness = 0.20
	_mat_wet_asphalt.metallic = 0.16

	_mat_concrete = StandardMaterial3D.new()
	_mat_concrete.albedo_color = surf_primary
	_mat_concrete.roughness = 0.90
	_mat_concrete.metallic = 0.04

	_mat_steel = StandardMaterial3D.new()
	_mat_steel.albedo_color = surf_secondary
	_mat_steel.roughness = 0.45
	_mat_steel.metallic = 0.72

	_mat_copper = StandardMaterial3D.new()
	_mat_copper.albedo_color = Color("#cc823b")
	_mat_copper.roughness = 0.32
	_mat_copper.metallic = 0.76

	_mat_stone = StandardMaterial3D.new()
	_mat_stone.albedo_color = Color("#7a7568") if style == "mountain" else Color("#736c63")
	_mat_stone.roughness = 0.94

	_mat_barrier = StandardMaterial3D.new()
	_mat_barrier.albedo_texture = _gen_barrier_tex()
	_mat_barrier.roughness = 0.74

	_mat_roller_yellow = StandardMaterial3D.new()
	_mat_roller_yellow.albedo_color = Color("#e8a220")
	_mat_roller_yellow.roughness = 0.38
	_mat_roller_yellow.metallic = 0.34

	_mat_cone_orange = StandardMaterial3D.new()
	_mat_cone_orange.albedo_color = Color("#ea5c1f")
	_mat_cone_orange.roughness = 0.58

	_mat_white = StandardMaterial3D.new()
	_mat_white.albedo_color = Color("#f1f5f9")
	_mat_white.roughness = 0.6

	_mat_frame = StandardMaterial3D.new()
	_mat_frame.albedo_color = Color("#2c3138")
	_mat_frame.roughness = 0.72
	_mat_frame.metallic = 0.35

	_mat_puddle = StandardMaterial3D.new()
	_mat_puddle.albedo_color = Color(0.306, 0.557, 0.659, 0.78)
	_mat_puddle.roughness = 0.07
	_mat_puddle.metallic = 0.30
	_mat_puddle.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA


func _pick_material(style: String) -> StandardMaterial3D:
	match style:
		"asphalt":
			return _mat_asphalt
		"wet":
			return _mat_wet_asphalt
		"steel":
			return _mat_steel
		"copper":
			return _mat_copper
		"stone":
			return _mat_stone
		_:
			return _mat_concrete


func _make_box_mesh(sz: Vector3, mat: Material, cast_shadow := true) -> MeshInstance3D:
	var box := BoxMesh.new()
	box.size = sz
	var mi := MeshInstance3D.new()
	mi.mesh = box
	mi.material_override = mat
	if not cast_shadow:
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	return mi


func _add_cone(parent: Node3D, pos: Vector3) -> void:
	var cone_c := CylinderMesh.new()
	cone_c.top_radius = 0.02
	cone_c.bottom_radius = 0.24
	cone_c.height = 0.65
	cone_c.radial_segments = 10
	var cone := MeshInstance3D.new()
	cone.mesh = cone_c
	cone.material_override = _mat_cone_orange
	cone.position = pos
	parent.add_child(cone)

	var col_c := CylinderMesh.new()
	col_c.top_radius = 0.12
	col_c.bottom_radius = 0.16
	col_c.height = 0.12
	col_c.radial_segments = 10
	var col := MeshInstance3D.new()
	col.mesh = col_c
	col.material_override = _mat_white
	col.position = pos + Vector3(0.0, 0.05, 0.0)
	parent.add_child(col)


func _gen_asphalt_tex(wet: bool) -> ImageTexture:
	var img := Image.create(128, 128, false, Image.FORMAT_RGBA8)
	var base := Color("#2a3039") if wet else Color("#3b3f47")
	for y in range(128):
		for x in range(128):
			var n := sin(float(x) * 1.7 + float(y) * 2.3) * 0.025
			var c := Color(base.r + n, base.g + n, base.b + n, 1.0)
			if x >= 61 and x <= 66 and (y % 32) < 18:
				c = Color("#e8c448")
			elif x == 8 or x == 119:
				c = Color("#d7dde5")
			img.set_pixel(x, y, c)
	return ImageTexture.create_from_image(img)


func _gen_barrier_tex() -> ImageTexture:
	var img := Image.create(64, 32, false, Image.FORMAT_RGBA8)
	for y in range(32):
		for x in range(64):
			var stripe := ((x + y) / 16) % 2 == 0
			img.set_pixel(x, y, Color("#d43a2f") if stripe else Color("#f1ede4"))
	return ImageTexture.create_from_image(img)


func _v3(d: Variant) -> Vector3:
	if typeof(d) != TYPE_DICTIONARY:
		return Vector3.ZERO
	return Vector3(float(d.get("x", 0.0)), float(d.get("y", 0.0)), float(d.get("z", 0.0)))
